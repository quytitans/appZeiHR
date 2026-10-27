"""Luồng duyệt đơn nghỉ phép (SRS 3.4.1 - "Workflow duyệt ticket nghỉ").

Cấp duyệt lấy theo Chức vụ (Position.approval_level), KHÔNG theo role RBAC. Người tạo
đơn tự chọn người duyệt cho từng bước trong số nhân viên giữ đúng cấp của bước đó;
người duyệt mặc định (điền sẵn trên form) là người đầu tiên giữ đúng cấp khi đi ngược
chuỗi quản lý trực tiếp (Employee.manager_id) của người tạo đơn.
"""

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from app.models.attendance import (
    ApprovalAction,
    ApprovalStepStatus,
    LeaveApprovalStep,
    LeaveRequest,
    LeaveRequestStatus,
)
from app.models.personnel import ApprovalLevel, Employee, EmployeeStatus, Position
from app.models.user import User
from app.modules.attendance.balance import assert_enough_balance
from app.modules.attendance.schemas import LeaveRequestCreate

# Cấp của người tạo đơn -> các bước duyệt (cấp người duyệt, hành động), theo thứ tự.
# CEO không có cấp trên nên đơn của CEO được duyệt ngay khi tạo.
WORKFLOW_BY_LEVEL: dict[ApprovalLevel, list[tuple[ApprovalLevel, ApprovalAction]]] = {
    ApprovalLevel.STAFF: [
        (ApprovalLevel.DEPARTMENT_HEAD, ApprovalAction.CONFIRM),
        (ApprovalLevel.DIRECTOR, ApprovalAction.APPROVE),
    ],
    ApprovalLevel.DEPARTMENT_HEAD: [(ApprovalLevel.DIRECTOR, ApprovalAction.APPROVE)],
    ApprovalLevel.DIRECTOR: [(ApprovalLevel.CEO, ApprovalAction.APPROVE)],
    ApprovalLevel.CEO: [],
}

LEVEL_LABELS = {
    ApprovalLevel.STAFF: "Nhân viên",
    ApprovalLevel.DEPARTMENT_HEAD: "Trưởng phòng",
    ApprovalLevel.DIRECTOR: "Giám đốc",
    ApprovalLevel.CEO: "CEO",
}

# Chặn vòng lặp nếu dữ liệu manager_id bị trỏ vòng
MAX_MANAGER_CHAIN_DEPTH = 20


def approval_level_of(employee: Employee) -> ApprovalLevel:
    return employee.position.approval_level if employee.position else ApprovalLevel.STAFF


def find_manager_with_level(employee: Employee, level: ApprovalLevel) -> Employee | None:
    current = employee.manager
    for _ in range(MAX_MANAGER_CHAIN_DEPTH):
        if current is None:
            return None
        if approval_level_of(current) == level:
            return current
        current = current.manager
    return None


def workflow_for(requester: Employee) -> list[tuple[ApprovalLevel, ApprovalAction, Employee | None]]:
    """Các bước duyệt áp cho requester kèm người duyệt MẶC ĐỊNH (theo chuỗi quản lý trực
    tiếp) - dùng để điền sẵn trên form, người tạo đơn có thể chọn người khác cùng cấp."""
    return [
        (level, action, find_manager_with_level(requester, level))
        for level, action in WORKFLOW_BY_LEVEL[approval_level_of(requester)]
    ]


def search_approvers(
    db: Session, level: ApprovalLevel, search: str | None, exclude_id: int, limit: int = 20
) -> list[Employee]:
    """Ứng viên duyệt cho 1 bước: nhân viên đang làm việc, giữ đúng cấp `level`, tìm theo
    họ tên hoặc tài khoản (mã NV / email công ty / email đăng nhập)."""
    query = (
        db.query(Employee)
        .join(Position, Employee.position_id == Position.id)
        .outerjoin(User, Employee.user_id == User.id)
        .options(selectinload(Employee.department))
        .filter(
            Position.approval_level == level,
            Employee.status != EmployeeStatus.TERMINATED,
            Employee.id != exclude_id,
        )
    )
    if search and search.strip():
        pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Employee.full_name).like(pattern),
                func.lower(Employee.employee_code).like(pattern),
                func.lower(Employee.company_email).like(pattern),
                func.lower(User.email).like(pattern),
            )
        )
    return query.order_by(Employee.full_name).limit(limit).all()


def build_steps(
    db: Session, requester: Employee, approver_ids: list[int | None] | None
) -> list[LeaveApprovalStep]:
    """Sinh các bước duyệt cho đơn của requester.

    approver_ids: người duyệt do người tạo đơn chọn, theo đúng thứ tự WORKFLOW_BY_LEVEL -
    khi tự chọn thì BẮT BUỘC đủ mọi bước (không cho nhân viên tự bỏ bước trưởng phòng).
    None (cả danh sách) = dùng người duyệt mặc định theo chuỗi quản lý; ở chế độ này bước
    xác nhận (CONFIRM) không tìm được người thì bỏ qua, bước duyệt cuối (APPROVE) bắt buộc có."""

    workflow = workflow_for(requester)
    chosen_by_requester = approver_ids is not None
    if approver_ids is None:
        approver_ids = [default.id if default else None for _, _, default in workflow]
    if len(approver_ids) != len(workflow):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Luồng duyệt của bạn có {len(workflow)} bước, cần chọn người duyệt cho từng bước",
        )

    steps: list[LeaveApprovalStep] = []
    for (level, action, _), approver_id in zip(workflow, approver_ids):
        if approver_id is None:
            if action == ApprovalAction.CONFIRM and not chosen_by_requester:
                continue
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Chưa chọn {LEVEL_LABELS[level]} duyệt đơn",
            )
        approver = db.get(Employee, approver_id)
        if (
            approver is None
            or approver.id == requester.id
            or approver.status == EmployeeStatus.TERMINATED
            or approval_level_of(approver) != level
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Người duyệt bước {LEVEL_LABELS[level]} không hợp lệ",
            )
        steps.append(LeaveApprovalStep(step_order=len(steps) + 1, action=action, approver=approver))
    return steps


def leave_request_query(db: Session):
    return db.query(LeaveRequest).options(
        selectinload(LeaveRequest.employee),
        selectinload(LeaveRequest.steps).selectinload(LeaveApprovalStep.approver),
    )


def get_leave_request(db: Session, leave_request_id: int) -> LeaveRequest | None:
    return leave_request_query(db).filter(LeaveRequest.id == leave_request_id).first()


def create_leave_request(db: Session, requester: Employee, payload: LeaveRequestCreate) -> LeaveRequest:
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ngày kết thúc phải sau ngày bắt đầu")

    data = payload.model_dump(exclude={"approver_ids"})
    if payload.is_half_day:
        data["end_date"] = payload.start_date
    assert_enough_balance(
        db, requester.id, payload.leave_type, data["start_date"], data["end_date"], payload.is_half_day
    )

    steps = build_steps(db, requester, payload.approver_ids)
    leave_request = LeaveRequest(**data, employee_id=requester.id, steps=steps)
    if not steps:
        leave_request.status = LeaveRequestStatus.APPROVED
    db.add(leave_request)
    db.commit()
    return get_leave_request(db, leave_request.id)  # type: ignore[return-value]


def _skip_remaining(leave_request: LeaveRequest) -> None:
    for step in leave_request.steps:
        if step.status == ApprovalStepStatus.PENDING:
            step.status = ApprovalStepStatus.SKIPPED


def decide(
    db: Session, leave_request: LeaveRequest, approver: Employee, approve: bool, comment: str | None
) -> LeaveRequest:
    """Người duyệt của bước hiện tại đồng ý/từ chối. Từ chối ở bất kỳ bước nào = đơn bị
    từ chối; đồng ý ở bước cuối = đơn được duyệt."""

    step = leave_request.current_step
    if step is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Đơn này không còn chờ duyệt")
    if step.approver_id != approver.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Đơn này không chờ bạn xử lý")

    step.status = ApprovalStepStatus.APPROVED if approve else ApprovalStepStatus.REJECTED
    step.comment = comment
    step.decided_at = datetime.now()

    if not approve:
        leave_request.status = LeaveRequestStatus.REJECTED
        leave_request.approver_id = approver.id
        _skip_remaining(leave_request)
    elif all(s.status == ApprovalStepStatus.APPROVED for s in leave_request.steps):
        leave_request.status = LeaveRequestStatus.APPROVED
        leave_request.approver_id = approver.id

    db.commit()
    return get_leave_request(db, leave_request.id)  # type: ignore[return-value]


def cancel(db: Session, leave_request: LeaveRequest, requester: Employee) -> LeaveRequest:
    if leave_request.employee_id != requester.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn chỉ hủy được đơn của mình")
    if leave_request.status != LeaveRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Chỉ hủy được đơn đang chờ duyệt")

    leave_request.status = LeaveRequestStatus.CANCELLED
    _skip_remaining(leave_request)
    db.commit()
    return get_leave_request(db, leave_request.id)  # type: ignore[return-value]


def list_waiting_for(db: Session, approver: Employee) -> list[LeaveRequest]:
    """Đơn mà bước hiện tại đang chờ approver xử lý (tab "Chờ tôi xử lý")."""
    candidates = (
        leave_request_query(db)
        .join(LeaveApprovalStep)
        .filter(
            LeaveRequest.status == LeaveRequestStatus.PENDING,
            LeaveApprovalStep.approver_id == approver.id,
            LeaveApprovalStep.status == ApprovalStepStatus.PENDING,
        )
        .distinct()
        .order_by(LeaveRequest.start_date.asc(), LeaveRequest.id.asc())
        .all()
    )
    return [r for r in candidates if r.current_step and r.current_step.approver_id == approver.id]
