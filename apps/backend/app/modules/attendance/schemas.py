from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.attendance import (
    ApprovalAction,
    ApprovalStepStatus,
    LeaveRequestStatus,
    LeaveType,
)
from app.models.personnel import ApprovalLevel, Employee


class EmployeeBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_code: str
    full_name: str


class CheckInOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    work_date: date
    check_in: datetime | None
    check_out: datetime | None
    is_late: bool
    is_early_leave: bool
    employee: EmployeeBrief | None = None


class LeaveRequestBase(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    is_half_day: bool = False
    reason: str | None = Field(default=None, max_length=2000)
    attachment_url: str | None = None


class LeaveRequestCreate(LeaveRequestBase):
    """Không nhận employee_id: đơn luôn tạo cho chính người đang đăng nhập.

    approver_ids: người duyệt do người tạo chọn cho từng bước, đúng thứ tự trả về ở
    GET /attendance/leave-requests/workflow (None ở bước xác nhận = bỏ qua bước đó).
    Bỏ trống cả trường = dùng người duyệt mặc định theo chuỗi quản lý trực tiếp."""

    approver_ids: list[int | None] | None = None


class ApproverOut(BaseModel):
    """Ứng viên người duyệt hiển thị trong ô tìm kiếm của form tạo ticket."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    full_name: str
    company_email: str | None
    department_name: str | None = None

    @model_validator(mode="before")
    @classmethod
    def _department_name(cls, data):
        if isinstance(data, Employee):
            return {
                "id": data.id,
                "employee_code": data.employee_code,
                "full_name": data.full_name,
                "company_email": data.company_email,
                "department_name": data.department.name if data.department else None,
            }
        return data


class WorkflowStepOut(BaseModel):
    """1 bước trong luồng duyệt áp cho người đang đăng nhập, kèm người duyệt mặc định."""

    step_order: int
    level: ApprovalLevel
    action: ApprovalAction
    default_approver: ApproverOut | None


class LeaveApprovalStepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    step_order: int
    action: ApprovalAction
    status: ApprovalStepStatus
    comment: str | None
    decided_at: datetime | None
    approver: EmployeeBrief


class LeaveRequestOut(LeaveRequestBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    status: LeaveRequestStatus
    approver_id: int | None = None
    created_at: datetime
    employee: EmployeeBrief | None = None
    steps: list[LeaveApprovalStepOut] = []
    current_step: LeaveApprovalStepOut | None = None


class LeaveDecision(BaseModel):
    decision: Literal["approve", "reject"]
    comment: str | None = Field(default=None, max_length=2000)


class LeaveBalanceOut(BaseModel):
    """Quỹ 1 loại nghỉ trong năm: được cấp / đã dùng (đơn đã duyệt xong) / đang chờ duyệt /
    còn lại thực tế (= cấp - đã dùng) / có thể đăng ký thêm (= còn lại - đang chờ duyệt). Xem
    app/modules/attendance/balance.py."""

    model_config = ConfigDict(from_attributes=True)

    leave_type: LeaveType
    total_days: float
    used_days: float
    pending_days: float
    remaining_days: float
    available_days: float


class EmployeeBalancesOut(BaseModel):
    employee: EmployeeBrief
    department_name: str | None = None
    year: int
    balances: list[LeaveBalanceOut]


class LeaveQuotaUpdate(BaseModel):
    """HR cấu hình số ngày được cấp theo từng loại; loại không gửi lên giữ nguyên."""

    quotas: dict[LeaveType, float] = Field(min_length=1)

    @model_validator(mode="after")
    def _non_negative(self):
        if any(v < 0 or v > 366 for v in self.quotas.values()):
            raise ValueError("Số ngày phải trong khoảng 0 - 366")
        return self
