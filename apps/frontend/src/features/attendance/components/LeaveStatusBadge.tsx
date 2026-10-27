import { LEAVE_STATUS_LABELS, type LeaveRequestStatus } from "@/types/attendance";

const STYLES: Record<LeaveRequestStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-brand-50 text-brand-700",
  rejected: "bg-red-50 text-red-600",
  cancelled: "bg-slate-100 text-slate-500",
};

export function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LEAVE_STATUS_LABELS[status]}
    </span>
  );
}
