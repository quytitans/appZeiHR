import { APPROVAL_ACTION_LABELS, LEAVE_STATUS_LABELS, type LeaveRequest } from "@/types/attendance";

/**
 * Số ngày làm việc (T2-T6) trong khoảng [start, end], nghỉ nửa ngày = 0.5.
 * Phải khớp count_leave_days ở backend (app/modules/attendance/balance.py).
 */
export function countLeaveDays(start: string, end: string, isHalfDay: boolean): number {
  if (!start || !end || end < start) return 0;
  const isWorkday = (d: Date) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6;
  const first = new Date(`${start}T00:00:00Z`);
  if (isHalfDay) return isWorkday(first) ? 0.5 : 0;
  const last = new Date(`${end}T00:00:00Z`);
  let days = 0;
  for (const d = first; d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    if (isWorkday(d)) days += 1;
  }
  return days;
}

export function leaveDays(req: LeaveRequest): number {
  return countLeaveDays(req.start_date, req.end_date, req.is_half_day);
}

/** Mô tả ngắn trạng thái đơn, vd "Chờ Phạm Minh Đức xác nhận (1/2)" */
export function progressLabel(req: LeaveRequest): string {
  const step = req.current_step;
  if (!step) return LEAVE_STATUS_LABELS[req.status];
  const action = APPROVAL_ACTION_LABELS[step.action].toLowerCase();
  return `Chờ ${step.approver.full_name} ${action} (${step.step_order}/${req.steps.length})`;
}
