import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getMyBalances } from "@/api/attendance";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LEAVE_TYPE_LABELS } from "@/types/attendance";

export function MyBalancesModal({ onClose }: { onClose: () => void }) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["leave-balances", "me", year],
    queryFn: () => getMyBalances(year),
  });

  return (
    <Modal
      title="Quỹ ngày nghỉ của tôi"
      onClose={onClose}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Tính theo ngày làm việc (T2–T6). Quỹ chỉ bị trừ khi ticket được duyệt xong mọi bước;
            ticket đang chờ duyệt chưa trừ nhưng được tính khi bạn đăng ký ticket mới.
          </p>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            aria-label="Năm"
          >
            {[thisYear - 1, thisYear, thisYear + 1].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p className="py-6 text-center text-sm text-slate-400">Đang tải...</p>}
        {isError && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Không tải được quỹ ngày nghỉ (tài khoản có thể chưa liên kết hồ sơ nhân viên).
          </p>
        )}

        {data && (
          <ul className="space-y-3">
            {data.balances.map((b) => {
              const usedPct = b.total_days > 0 ? Math.min(100, (b.used_days / b.total_days) * 100) : 0;
              const pendingPct =
                b.total_days > 0 ? Math.min(100 - usedPct, (b.pending_days / b.total_days) * 100) : 0;
              return (
                <li key={b.leave_type} className="rounded-lg border border-slate-200 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-slate-800">{LEAVE_TYPE_LABELS[b.leave_type]}</span>
                    <span className="text-sm">
                      <span
                        className={`text-lg font-semibold ${b.remaining_days > 0 ? "text-brand-700" : "text-red-600"}`}
                      >
                        {b.remaining_days}
                      </span>
                      <span className="text-slate-400"> / {b.total_days} ngày còn lại</span>
                    </span>
                  </div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="bg-brand-500" style={{ width: `${usedPct}%` }} />
                    <div
                      className="bg-amber-300 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,.6)_3px,rgba(255,255,255,.6)_6px)]"
                      style={{ width: `${pendingPct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Đã dùng (đã duyệt) {b.used_days}
                    {b.pending_days > 0 && (
                      <>
                        {" "}
                        · <span className="text-amber-700">Ticket đang chờ duyệt {b.pending_days}</span> → có thể
                        đăng ký thêm {b.available_days}
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
