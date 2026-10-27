import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { searchApprovers } from "@/api/attendance";
import { Icon } from "@/components/ui/Icon";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { APPROVAL_LEVEL_LABELS, type ApprovalLevel } from "@/types/auth";
import type { ApproverCandidate } from "@/types/attendance";

interface ApproverPickerProps {
  id: string;
  /** Chỉ tìm trong số nhân viên giữ đúng cấp duyệt này */
  level: ApprovalLevel;
  value: ApproverCandidate | null;
  onChange: (value: ApproverCandidate | null) => void;
}

export function ApproverPicker({ id, level, value, onChange }: ApproverPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  const { data: candidates = [], isFetching } = useQuery({
    queryKey: ["approvers", level, debouncedSearch],
    queryFn: () => searchApprovers(level, debouncedSearch),
    enabled: open,
  });

  if (value && !open) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-300 px-3 py-2">
        <div className="min-w-0 text-sm">
          <p className="truncate font-medium text-slate-900">{value.full_name}</p>
          <p className="truncate text-xs text-slate-500">
            {value.employee_code}
            {value.department_name && ` · ${value.department_name}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setOpen(true);
          }}
          className="shrink-0 text-xs font-medium text-brand-700 hover:underline"
        >
          Đổi
        </button>
      </div>
    );
  }

  const levelLabel = APPROVAL_LEVEL_LABELS[level].toLowerCase();

  return (
    <div className="relative">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-[1.15rem] h-4 w-4 -translate-y-1/2 text-slate-400"
      />
      <input
        id={id}
        autoFocus={open}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setOpen(true)}
        // Trễ để kịp nhận click vào 1 dòng gợi ý trước khi đóng danh sách
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={`Tìm ${levelLabel} theo tên hoặc tài khoản...`}
        className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {isFetching && candidates.length === 0 && <li className="px-3 py-2 text-xs text-slate-400">Đang tìm...</li>}
          {!isFetching && candidates.length === 0 && (
            <li className="px-3 py-2 text-xs text-slate-400">Không tìm thấy {levelLabel} phù hợp.</li>
          )}
          {candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className={`flex w-full flex-col px-3 py-2 text-left hover:bg-brand-50 ${
                  value?.id === c.id ? "bg-brand-50" : ""
                }`}
              >
                <span className="text-sm font-medium text-slate-900">{c.full_name}</span>
                <span className="text-xs text-slate-500">
                  {c.employee_code}
                  {c.department_name && ` · ${c.department_name}`}
                  {c.company_email && ` · ${c.company_email}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
