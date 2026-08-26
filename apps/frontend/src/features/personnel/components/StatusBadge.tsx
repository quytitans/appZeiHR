import { STATUS_LABELS, type EmployeeStatus } from "@/types/personnel";

const STYLES: Record<EmployeeStatus, string> = {
  active: "bg-brand-50 text-brand-700",
  on_leave: "bg-amber-50 text-amber-700",
  terminated: "bg-slate-100 text-slate-500",
};

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
