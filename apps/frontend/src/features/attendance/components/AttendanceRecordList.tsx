import { useState } from "react";

import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/format";
import type { AttendanceRecord } from "@/types/attendance";

/** "2026-10-26T08:21:00" -> "08:21" (cắt chuỗi, không đổi múi giờ) */
function formatTime(value: string | null): string {
  return value ? value.slice(11, 16) : "—";
}

function Flags({ record }: { record: AttendanceRecord }) {
  if (!record.is_late && !record.is_early_leave) {
    return <span className="text-xs text-brand-700">Đúng giờ</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {record.is_late && (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Đi muộn</span>
      )}
      {record.is_early_leave && (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Về sớm</span>
      )}
    </span>
  );
}

export function AttendanceRecordList({ records }: { records: AttendanceRecord[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  if (records.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-slate-400">Chưa có dữ liệu chấm công.</p>;
  }

  const items = records.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Nhân viên</th>
              <th className="px-4 py-3">Giờ vào</th>
              <th className="px-4 py-3">Giờ ra</th>
              <th className="px-4 py-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(rec.work_date)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{rec.employee?.full_name ?? `#${rec.employee_id}`}</p>
                  <p className="text-xs text-slate-500">{rec.employee?.employee_code}</p>
                </td>
                <td className={`px-4 py-3 font-mono ${rec.is_late ? "text-amber-700" : "text-slate-600"}`}>
                  {formatTime(rec.check_in)}
                </td>
                <td className={`px-4 py-3 font-mono ${rec.is_early_leave ? "text-amber-700" : "text-slate-600"}`}>
                  {formatTime(rec.check_out)}
                </td>
                <td className="px-4 py-3">
                  <Flags record={rec} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 md:hidden">
        {items.map((rec) => (
          <li key={rec.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">
                {rec.employee?.full_name ?? `#${rec.employee_id}`}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(rec.work_date)} · {formatTime(rec.check_in)} – {formatTime(rec.check_out)}
              </p>
            </div>
            <Flags record={rec} />
          </li>
        ))}
      </ul>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={records.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </>
  );
}
