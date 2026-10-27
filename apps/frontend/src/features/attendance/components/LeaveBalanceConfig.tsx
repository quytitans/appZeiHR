import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { listBalances, updateQuotas } from "@/api/attendance";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { getErrorDetail } from "@/lib/errors";
import { LEAVE_TYPE_LABELS, type EmployeeBalances, type LeaveType } from "@/types/attendance";

const LEAVE_TYPES = Object.keys(LEAVE_TYPE_LABELS) as LeaveType[];

/** Tab "Quỹ ngày nghỉ" của HR: xem và cấu hình số ngày được cấp từng loại cho từng nhân viên. */
export function LeaveBalanceConfig() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EmployeeBalances | null>(null);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["leave-balances", "all", year],
    queryFn: () => listBalances(year),
  });

  const keyword = search.trim().toLowerCase();
  const rows = keyword
    ? data.filter(
        (r) =>
          r.employee.full_name.toLowerCase().includes(keyword) ||
          r.employee.employee_code.toLowerCase().includes(keyword),
      )
    : data;

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm nhân viên theo tên hoặc mã..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          aria-label="Năm"
        >
          {[thisYear - 1, thisYear, thisYear + 1].map((y) => (
            <option key={y} value={y}>
              Năm {y}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="px-4 py-10 text-center text-sm text-slate-400">Đang tải dữ liệu...</p>}
      {isError && <p className="px-4 py-6 text-center text-sm text-red-600">Không tải được quỹ ngày nghỉ.</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nhân viên</th>
                {LEAVE_TYPES.map((t) => (
                  <th key={t} className="whitespace-nowrap px-3 py-3 text-center">
                    {LEAVE_TYPE_LABELS[t]}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.employee.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{r.employee.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {r.employee.employee_code}
                      {r.department_name && ` · ${r.department_name}`}
                    </p>
                  </td>
                  {LEAVE_TYPES.map((t) => {
                    const b = r.balances.find((x) => x.leave_type === t)!;
                    return (
                      <td key={t} className="whitespace-nowrap px-3 py-3 text-center">
                        <span className={b.remaining_days > 0 ? "text-slate-800" : "text-red-600"}>
                          {b.remaining_days}
                        </span>
                        <span className="text-slate-400"> / {b.total_days}</span>
                        {b.pending_days > 0 && (
                          <span className="block text-[11px] text-amber-700">chờ duyệt {b.pending_days}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(r)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                      aria-label={`Sửa quỹ của ${r.employee.full_name}`}
                    >
                      <Icon name="edit" className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            Hiển thị: còn lại / được cấp (ngày làm việc). Còn lại = được cấp − ticket đã duyệt xong; ticket
            đang chờ duyệt chưa trừ vào quỹ.
          </p>
        </div>
      )}
      {!isLoading && !isError && rows.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-slate-400">Không có nhân viên phù hợp.</p>
      )}

      {editing && <QuotaEditModal row={editing} year={year} onClose={() => setEditing(null)} />}
    </div>
  );
}

function QuotaEditModal({ row, year, onClose }: { row: EmployeeBalances; year: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<LeaveType, string>>(
    () => Object.fromEntries(row.balances.map((b) => [b.leave_type, String(b.total_days)])) as Record<LeaveType, string>,
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      updateQuotas(
        row.employee.id,
        year,
        Object.fromEntries(LEAVE_TYPES.map((t) => [t, Number(values[t])])) as Record<LeaveType, number>,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      onClose();
    },
    onError: (err) => setError(getErrorDetail(err) ?? "Không thể lưu quỹ ngày nghỉ. Vui lòng thử lại."),
  });

  return (
    <Modal
      title={`Quỹ ngày nghỉ ${year} - ${row.employee.full_name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="quota-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </>
      }
    >
      <form
        id="quota-form"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutation.mutate();
        }}
        className="space-y-3"
      >
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {row.balances.map((b) => (
          <div key={b.leave_type} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <label htmlFor={`quota_${b.leave_type}`} className="text-sm text-slate-700">
              {LEAVE_TYPE_LABELS[b.leave_type]}
              <span className="block text-xs text-slate-400">
                Đã dùng {b.used_days}
                {b.pending_days > 0 && ` · chờ duyệt ${b.pending_days}`}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`quota_${b.leave_type}`}
                type="number"
                min={0}
                max={366}
                step={0.5}
                required
                value={values[b.leave_type]}
                onChange={(e) => setValues((prev) => ({ ...prev, [b.leave_type]: e.target.value }))}
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <span className="text-xs text-slate-500">ngày</span>
            </div>
          </div>
        ))}
      </form>
    </Modal>
  );
}
