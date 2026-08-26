from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.attendance import LeaveRequestStatus, LeaveType


class CheckInOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    work_date: date
    check_in: datetime | None
    check_out: datetime | None
    is_late: bool
    is_early_leave: bool


class LeaveRequestCreate(BaseModel):
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    is_half_day: bool = False
    reason: str | None = None
    attachment_url: str | None = None


class LeaveRequestOut(LeaveRequestCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: LeaveRequestStatus
    approver_id: int | None = None


class LeaveDecision(BaseModel):
    status: LeaveRequestStatus
