import { useState } from "react";

import { Pagination } from "@/components/ui/Pagination";
import { LeaveStatusBadge } from "@/features/attendance/components/LeaveStatusBadge";
import { leaveDays, progressLabel } from "@/features/attendance/workflow";
import { formatDate } from "@/lib/format";
import { LEAVE_TYPE_LABELS, type LeaveRequest } from "@/types/attendance";

function dateRange(req: LeaveRequest): string {
  return req.start_date === req.end_date
    ? formatDate(req.start_date)
    : `${formatDate(req.start_date)} – ${formatDate(req.end_date)}`;
}

interface LeaveRequestListProps {
  requests: LeaveRequest[];
  /** Ẩn cột nhân viên ở tab "Ticket của tôi" */
  showEmployee: boolean;
  emptyText: string;
  onSelect: (request: LeaveRequest) => void;
}

export function LeaveRequestList({ requests, showEmployee, emptyText, onSelect }: LeaveRequestListProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (requests.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-slate-400">{emptyText}</p>;
  }

  const items = requests.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {showEmployee && <th className="px-4 py-3">Nhân viên</th>}
              <th className="px-4 py-3">Loại nghỉ</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3 text-right">Số ngày</th>
              <th className="px-4 py-3">Tiến trình</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((req) => (
              <tr key={req.id} onClick={() => onSelect(req)} className="cursor-pointer hover:bg-slate-50">
                {showEmployee && (
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{req.employee?.full_name ?? `#${req.employee_id}`}</p>
                    <p className="text-xs text-slate-500">{req.employee?.employee_code}</p>
                  </td>
                )}
                <td className="px-4 py-3 text-slate-700">
                  {LEAVE_TYPE_LABELS[req.leave_type]}
                  {req.reason && <p className="max-w-[16rem] truncate text-xs text-slate-400">{req.reason}</p>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{dateRange(req)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{leaveDays(req)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{progressLabel(req)}</td>
                <td className="px-4 py-3">
                  <LeaveStatusBadge status={req.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 md:hidden">
        {items.map((req) => (
          <li key={req.id}>
            <button type="button" onClick={() => onSelect(req)} className="w-full space-y-1.5 p-4 text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {showEmployee ? (req.employee?.full_name ?? `#${req.employee_id}`) : LEAVE_TYPE_LABELS[req.leave_type]}
                  </p>
                  {showEmployee && <p className="text-xs text-slate-500">{LEAVE_TYPE_LABELS[req.leave_type]}</p>}
                </div>
                <LeaveStatusBadge status={req.status} />
              </div>
              <p className="text-xs text-slate-600">
                {dateRange(req)} · {leaveDays(req)} ngày
              </p>
              <p className="text-xs text-slate-500">{progressLabel(req)}</p>
            </button>
          </li>
        ))}
      </ul>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={requests.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </>
  );
}
