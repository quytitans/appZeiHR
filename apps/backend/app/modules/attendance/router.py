from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session, selectinload

from app.common.deps import get_current_employee, get_current_user
from app.db.session import get_db
from app.models.attendance import AttendanceRecord, LeaveRequest
from app.models.personnel import ApprovalLevel, Employee, EmployeeStatus
from app.models.user import Role, User
from app.modules.attendance import balance, service
from app.modules.attendance.schemas import (
    ApproverOut,
    CheckInOut,
    EmployeeBalancesOut,
    LeaveBalanceOut,
    LeaveDecision,
    LeaveQuotaUpdate,
    LeaveRequestCreate,
    LeaveRequestOut,
    WorkflowStepOut,
)

router = APIRouter(prefix="/attendance", tags=["attendance"], dependencies=[Depends(get_current_user)])

# Được xem toàn bộ dữ liệu chấm công/đơn nghỉ của công ty
VIEW_ALL_ROLES = (Role.HR_ADMIN, Role.SYSTEM_ADMIN)


def _assert_can_view_all(user: User) -> None:
    if user.role not in VIEW_ALL_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền xem toàn bộ dữ liệu")


@router.post("/check-in/{employee_id}", response_model=CheckInOut, status_code=status.HTTP_201_CREATED)
def check_in(employee_id: int, request: Request, db: Session = Depends(get_db)):
    today = date.today()
    record = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.employee_id == employee_id, AttendanceRecord.work_date == today)
        .first()
    )
    if record and record.check_in:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Đã check-in hôm nay")

    if not record:
        record = AttendanceRecord(employee_id=employee_id, work_date=today)
        db.add(record)

    record.check_in = datetime.now()
    record.check_in_ip = request.client.host if request.client else None
    db.commit()
    db.refresh(record)
    return record


@router.post("/check-out/{employee_id}", response_model=CheckInOut)
def check_out(employee_id: int, request: Request, db: Session = Depends(get_db)):
    today = date.today()
    record = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.employee_id == employee_id, AttendanceRecord.work_date == today)
        .first()
    )
    if not record or not record.check_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chưa check-in hôm nay")

    record.check_out = datetime.now()
    record.check_out_ip = request.client.host if request.client else None
    db.commit()
    db.refresh(record)
    return record


@router.get("/records", response_model=list[CheckInOut])
def list_attendance_records(
    scope: Literal["mine", "all"] = Query("mine"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(AttendanceRecord).options(selectinload(AttendanceRecord.employee))
    if scope == "all":
        _assert_can_view_all(current_user)
    else:
        employee_id = current_user.employee.id if current_user.employee else None
        query = query.filter(AttendanceRecord.employee_id == employee_id)
    return query.order_by(AttendanceRecord.work_date.desc(), AttendanceRecord.id.desc()).all()


@router.get("/leave-requests", response_model=list[LeaveRequestOut])
def list_leave_requests(
    scope: Literal["mine", "to_review", "all"] = Query(
        "mine", description="mine = đơn của tôi, to_review = đơn đang chờ tôi xử lý, all = toàn công ty (HR)"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if scope == "all":
        _assert_can_view_all(current_user)
        return (
            service.leave_request_query(db)
            .order_by(LeaveRequest.start_date.desc(), LeaveRequest.id.desc())
            .all()
        )

    employee = current_user.employee
    if employee is None:
        return []
    if scope == "to_review":
        return service.list_waiting_for(db, employee)
    return (
        service.leave_request_query(db)
        .filter(LeaveRequest.employee_id == employee.id)
        .order_by(LeaveRequest.start_date.desc(), LeaveRequest.id.desc())
        .all()
    )


@router.get("/leave-requests/workflow", response_model=list[WorkflowStepOut])
def my_leave_workflow(employee: Employee = Depends(get_current_employee)):
    """Các bước duyệt áp cho đơn của tôi + người duyệt mặc định để điền sẵn trên form."""
    return [
        WorkflowStepOut(step_order=i, level=level, action=action, default_approver=default)
        for i, (level, action, default) in enumerate(service.workflow_for(employee), start=1)
    ]


@router.get("/approvers", response_model=list[ApproverOut])
def search_approvers(
    level: ApprovalLevel = Query(..., description="Chỉ trả người giữ đúng cấp duyệt này"),
    search: str | None = Query(None, description="Tìm theo họ tên / mã NV / email"),
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return service.search_approvers(db, level, search, exclude_id=employee.id)


@router.post("/leave-requests", response_model=LeaveRequestOut, status_code=status.HTTP_201_CREATED)
def create_leave_request(
    payload: LeaveRequestCreate,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return service.create_leave_request(db, employee, payload)


def _get_or_404(db: Session, leave_request_id: int) -> LeaveRequest:
    leave_request = service.get_leave_request(db, leave_request_id)
    if not leave_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn nghỉ phép")
    return leave_request


@router.post("/leave-requests/{leave_request_id}/decision", response_model=LeaveRequestOut)
def decide_leave_request(
    leave_request_id: int,
    payload: LeaveDecision,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    """Người duyệt của bước hiện tại xác nhận/duyệt hoặc từ chối đơn."""
    leave_request = _get_or_404(db, leave_request_id)
    return service.decide(db, leave_request, employee, payload.decision == "approve", payload.comment)


@router.post("/leave-requests/{leave_request_id}/cancel", response_model=LeaveRequestOut)
def cancel_leave_request(
    leave_request_id: int,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return service.cancel(db, _get_or_404(db, leave_request_id), employee)


def _balances_out(db: Session, employee: Employee, year: int) -> EmployeeBalancesOut:
    return EmployeeBalancesOut(
        employee=employee,
        department_name=employee.department.name if employee.department else None,
        year=year,
        balances=[LeaveBalanceOut.model_validate(b) for b in balance.get_balances(db, employee.id, year)],
    )


@router.get("/leave-balances/me", response_model=EmployeeBalancesOut)
def my_leave_balances(
    year: int = Query(default_factory=lambda: date.today().year),
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    """Quỹ ngày nghỉ các loại của tôi trong năm."""
    return _balances_out(db, employee, year)


@router.get("/leave-balances", response_model=list[EmployeeBalancesOut])
def list_leave_balances(
    year: int = Query(default_factory=lambda: date.today().year),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Quỹ ngày nghỉ của toàn bộ nhân viên đang làm việc (HR cấu hình)."""
    _assert_can_view_all(current_user)
    employees = (
        db.query(Employee)
        .options(selectinload(Employee.department))
        .filter(Employee.status != EmployeeStatus.TERMINATED)
        .order_by(Employee.full_name)
        .all()
    )
    return [_balances_out(db, e, year) for e in employees]


@router.put("/leave-balances/{employee_id}", response_model=EmployeeBalancesOut)
def update_leave_quotas(
    employee_id: int,
    payload: LeaveQuotaUpdate,
    year: int = Query(default_factory=lambda: date.today().year),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_can_view_all(current_user)
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy nhân viên")
    balance.set_quotas(db, employee_id, year, payload.quotas)
    return _balances_out(db, employee, year)
