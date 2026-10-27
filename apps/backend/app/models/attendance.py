import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
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
    """Quỹ ngày nghỉ được cấp cho 1 nhân viên / 1 năm / 1 loại nghỉ (HR cấu hình).

    Chỉ lưu số ngày ĐƯỢC CẤP; số đã dùng tính trực tiếp từ đơn nghỉ - xem
    app/modules/attendance/balance.py. Chưa có dòng nào thì dùng DEFAULT_QUOTAS ở đó."""

    __tablename__ = "leave_balances"
    __table_args__ = (UniqueConstraint("employee_id", "year", "leave_type", name="uq_leave_balance"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    leave_type: Mapped[LeaveType] = mapped_column(
        Enum(LeaveType), nullable=False, server_default=LeaveType.ANNUAL.name
    )
    total_days: Mapped[float] = mapped_column(default=12)

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
    # Người ra quyết định cuối (duyệt bước cuối hoặc từ chối)
    approver: Mapped["Employee | None"] = relationship("Employee", foreign_keys=[approver_id])
    steps: Mapped[list["LeaveApprovalStep"]] = relationship(
        "LeaveApprovalStep",
        back_populates="leave_request",
        cascade="all, delete-orphan",
        order_by="LeaveApprovalStep.step_order",
    )

    @property
    def current_step(self) -> "LeaveApprovalStep | None":
        """Bước đang chờ xử lý (chỉ khi đơn còn PENDING)."""
        if self.status != LeaveRequestStatus.PENDING:
            return None
        return next((s for s in self.steps if s.status == ApprovalStepStatus.PENDING), None)


class ApprovalAction(str, enum.Enum):
    """CONFIRM = trưởng phòng xác nhận (bước trung gian), APPROVE = bước duyệt cuối."""

    CONFIRM = "confirm"
    APPROVE = "approve"


class ApprovalStepStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    # Đơn đã bị từ chối/hủy trước khi tới bước này
    SKIPPED = "skipped"


class LeaveApprovalStep(Base):
    """Từng bước trong luồng duyệt 1 đơn nghỉ - sinh sẵn lúc tạo đơn, duyệt lần lượt theo
    step_order. Xem app/modules/attendance/service.py (WORKFLOW_BY_LEVEL)."""

    __tablename__ = "leave_approval_steps"

    id: Mapped[int] = mapped_column(primary_key=True)
    leave_request_id: Mapped[int] = mapped_column(ForeignKey("leave_requests.id"), nullable=False)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    action: Mapped[ApprovalAction] = mapped_column(Enum(ApprovalAction), nullable=False)
    approver_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    status: Mapped[ApprovalStepStatus] = mapped_column(
        Enum(ApprovalStepStatus), default=ApprovalStepStatus.PENDING, nullable=False
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    leave_request: Mapped["LeaveRequest"] = relationship("LeaveRequest", back_populates="steps")
    approver: Mapped["Employee"] = relationship("Employee")
