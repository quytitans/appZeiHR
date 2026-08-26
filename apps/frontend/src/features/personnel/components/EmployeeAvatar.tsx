import { getInitials } from "@/lib/format";

export function EmployeeAvatar({ fullName, sizeRem = 2.25 }: { fullName: string; sizeRem?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
      style={{ height: `${sizeRem}rem`, width: `${sizeRem}rem` }}
    >
      {getInitials(fullName)}
    </span>
  );
}
