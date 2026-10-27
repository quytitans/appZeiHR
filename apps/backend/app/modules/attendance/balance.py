"""Quỹ ngày nghỉ theo loại (SRS 3.4.2).

- Số ngày ĐƯỢC CẤP: bảng leave_balances (HR cấu hình từng nhân viên/năm/loại); chưa có
  dòng nào thì dùng DEFAULT_QUOTAS.
- Số ngày ĐÃ DÙNG / ĐANG CHỜ DUYỆT: tính trực tiếp từ đơn nghỉ (không lưu).
  Quỹ chỉ thực sự bị trừ (remaining_days) khi đơn được duyệt xong mọi bước. Đơn đang
  trong quá trình duyệt không trừ quỹ, nhưng được tính khi kiểm tra đơn mới
  (available_days) để không gửi vượt quỹ.
- Đếm ngày: chỉ ngày làm việc thứ 2 - thứ 6, nghỉ nửa ngày = 0.5. Đơn tính vào năm của
  ngày bắt đầu.
"""

from dataclasses import dataclass
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.models.attendance import LeaveBalance, LeaveRequest, LeaveRequestStatus, LeaveType

# Quỹ mặc định / năm, giống nhau cho mọi nhân viên (tạm thời - HR sửa từng người được)
DEFAULT_QUOTAS: dict[LeaveType, float] = {
    LeaveType.ANNUAL: 12,
    LeaveType.SICK: 30,
    LeaveType.COMPENSATION: 5,
    LeaveType.MATERNITY_PATERNITY: 130,  # ngày làm việc, ~6 tháng
    LeaveType.UNPAID: 30,
    LeaveType.OTHER: 3,
}

LEAVE_TYPE_LABELS = {
    LeaveType.ANNUAL: "Nghỉ phép năm",
    LeaveType.SICK: "Nghỉ ốm",
    LeaveType.COMPENSATION: "Nghỉ bù",
    LeaveType.MATERNITY_PATERNITY: "Thai sản",
    LeaveType.UNPAID: "Nghỉ không lương",
    LeaveType.OTHER: "Khác",
}


def count_leave_days(start: date, end: date, is_half_day: bool) -> float:
    """Số ngày làm việc (T2-T6) trong khoảng [start, end]. Phải khớp countLeaveDays ở
    frontend (src/features/attendance/workflow.ts)."""
    if is_half_day:
        return 0.5 if start.weekday() < 5 else 0
    days, d = 0, start
    while d <= end:
        if d.weekday() < 5:
            days += 1
        d += timedelta(days=1)
    return float(days)


@dataclass
class BalanceRow:
    leave_type: LeaveType
    total_days: float
    used_days: float
    pending_days: float

    @property
    def remaining_days(self) -> float:
        """Còn lại THỰC TẾ trong quỹ - chỉ giảm khi đơn được duyệt xong mọi bước."""
        return self.total_days - self.used_days

    @property
    def available_days(self) -> float:
        """Có thể đăng ký thêm = còn lại trừ các đơn đang trong quá trình duyệt."""
        return self.remaining_days - self.pending_days


def get_balances(db: Session, employee_id: int, year: int) -> list[BalanceRow]:
    configured = {
        b.leave_type: b.total_days
        for b in db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee_id, LeaveBalance.year == year)
    }
    requests = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.employee_id == employee_id,
            extract("year", LeaveRequest.start_date) == year,
            LeaveRequest.status.in_([LeaveRequestStatus.APPROVED, LeaveRequestStatus.PENDING]),
        )
        .all()
    )
    rows = {t: BalanceRow(t, configured.get(t, DEFAULT_QUOTAS[t]), 0, 0) for t in LeaveType}
    for r in requests:
        days = count_leave_days(r.start_date, r.end_date, r.is_half_day)
        if r.status == LeaveRequestStatus.APPROVED:
            rows[r.leave_type].used_days += days
        else:
            rows[r.leave_type].pending_days += days
    return list(rows.values())


def assert_enough_balance(
    db: Session, employee_id: int, leave_type: LeaveType, start: date, end: date, is_half_day: bool
) -> None:
    requested = count_leave_days(start, end, is_half_day)
    if requested <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Khoảng thời gian đã chọn không có ngày làm việc nào (chỉ gồm thứ 7/chủ nhật)",
        )
    row = next(b for b in get_balances(db, employee_id, start.year) if b.leave_type == leave_type)
    if requested > row.available_days:
        pending_note = f", {row.pending_days:g} ngày đang chờ duyệt ở đơn khác" if row.pending_days else ""
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quỹ {LEAVE_TYPE_LABELS[leave_type].lower()} năm {start.year} còn {row.remaining_days:g} ngày"
            f"{pending_note} - chỉ đăng ký thêm được {row.available_days:g} ngày, đơn này cần {requested:g} ngày",
        )


def set_quotas(db: Session, employee_id: int, year: int, quotas: dict[LeaveType, float]) -> None:
    existing = {
        b.leave_type: b
        for b in db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee_id, LeaveBalance.year == year)
    }
    for leave_type, total in quotas.items():
        if leave_type in existing:
            existing[leave_type].total_days = total
        else:
            db.add(LeaveBalance(employee_id=employee_id, year=year, leave_type=leave_type, total_days=total))
    db.commit()
