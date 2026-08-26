import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin


class LeaveType(str, enum.Enum):
    """SRS 3.4 - các loại nghỉ phép linh hoạt."""

    ANNUAL = "annual"
    SICK = "sick"
    COMPENSATION = "compensation"
    MATERNITY_PATERNITY = "maternity_paternity"
    UNPAID = "unpaid"
    OTHER = "other"


class LeaveRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class AttendanceRecord(Base):
    """Chấm công check-in/check-out."""

    __tablename__ = "attendance_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    check_out: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    check_in_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    check_out_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_late: Mapped[bool] = mapped_column(Boolean, default=False)
    is_early_leave: Mapped[bool] = mapped_column(Boolean, default=False)

    employee: Mapped["Employee"] = relationship("Employee")


class LeaveBalance(Base):
    """Số phép năm còn lại theo từng nhân viên/năm."""

    __tablename__ = "leave_balances"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    total_days: Mapped[float] = mapped_column(default=12)
    used_days: Mapped[float] = mapped_column(default=0)

    employee: Mapped["Employee"] = relationship("Employee")


class LeaveRequest(TimestampMixin, Base):
    """Đơn nghỉ phép/nghỉ ốm/ngủ bù/thai sản..."""

    __tablename__ = "leave_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    leave_type: Mapped[LeaveType] = mapped_column(Enum(LeaveType), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_half_day: Mapped[bool] = mapped_column(Boolean, default=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[LeaveRequestStatus] = mapped_column(
        Enum(LeaveRequestStatus), default=LeaveRequestStatus.PENDING, nullable=False
    )
    approver_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", foreign_keys=[employee_id])
    approver: Mapped["Employee | None"] = relationship("Employee", foreign_keys=[approver_id])
