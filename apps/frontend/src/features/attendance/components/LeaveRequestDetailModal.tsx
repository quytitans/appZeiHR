import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { cancelLeaveRequest, decideLeaveRequest } from "@/api/attendance";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LeaveStatusBadge } from "@/features/attendance/components/LeaveStatusBadge";
import { leaveDays } from "@/features/attendance/workflow";
import { getErrorDetail } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import {
  APPROVAL_ACTION_LABELS,
  LEAVE_TYPE_LABELS,
  type ApprovalStepStatus,
  type LeaveRequest,
} from "@/types/attendance";

const STEP_STATUS: Record<ApprovalStepStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Đang chờ", dot: "bg-amber-400", text: "text-amber-700" },
  approved: { label: "Đồng ý", dot: "bg-brand-500", text: "text-brand-700" },
  rejected: { label: "Từ chối", dot: "bg-red-500", text: "text-red-600" },
  skipped: { label: "Bỏ qua", dot: "bg-slate-300", text: "text-slate-400" },
};

/** "2026-10-27T14:33:25" -> "27/10/2026 14:33" (giờ không kèm múi giờ, cắt chuỗi) */
function formatDateTime(value: string): string {
  return `${formatDate(value.slice(0, 10))} ${value.slice(11, 16)}`;
}

interface LeaveRequestDetailModalProps {
  request: LeaveRequest;
  myEmployeeId: number | null;
  onClose: () => void;
}

export function LeaveRequestDetailModal({ request, myEmployeeId, onClose }: LeaveRequestDetailModalProps) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const step = request.current_step;
  const isMyTurn = !!step && step.approver.id === myEmployeeId;
  const canCancel = request.status === "pending" && request.employee_id === myEmployeeId;

  const mutation = useMutation({
    mutationFn: (action: "approve" | "reject" | "cancel") =>
      action === "cancel"
        ? cancelLeaveRequest(request.id)
        : decideLeaveRequest(request.id, action, comment.trim() || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      onClose();
    },
    onError: (err) => setError(getErrorDetail(err) ?? "Không thể xử lý đơn. Vui lòng thử lại."),
  });

  return (
    <Modal
      title={`Đơn nghỉ #${request.id}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          {canCancel && (
            <Button
              variant="secondary"
              className="mr-auto text-red-600"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("cancel")}
            >
              Hủy đơn
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          {isMyTurn && (
            <>
              <Button variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate("reject")}>
                Từ chối
              </Button>
              <Button disabled={mutation.isPending} onClick={() => mutation.mutate("approve")}>
                {APPROVAL_ACTION_LABELS[step!.action]}
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Nhân viên</dt>
            <dd className="font-medium text-slate-900">
              {request.employee?.full_name}{" "}
              <span className="font-normal text-slate-500">({request.employee?.employee_code})</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Trạng thái</dt>
            <dd>
              <LeaveStatusBadge status={request.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Loại nghỉ</dt>
            <dd className="text-slate-800">{LEAVE_TYPE_LABELS[request.leave_type]}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Thời gian</dt>
            <dd className="text-slate-800">
              {formatDate(request.start_date)}
              {request.end_date !== request.start_date && ` – ${formatDate(request.end_date)}`} ({leaveDays(request)}{" "}
              ngày)
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-slate-500">Lý do</dt>
            <dd className="text-slate-800">{request.reason || "—"}</dd>
          </div>
        </dl>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Luồng duyệt</h3>
          <ol className="space-y-0">
            <li className="relative flex gap-3 pb-4">
              <span className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
              <span className="absolute left-[4px] top-3 h-full w-px bg-slate-200" />
              <div className="text-sm">
                <p className="text-slate-800">Tạo đơn</p>
                <p className="text-xs text-slate-500">{formatDateTime(request.created_at)}</p>
              </div>
            </li>
            {request.steps.length === 0 && (
              <li className="flex gap-3 text-sm text-slate-500">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                Tự động duyệt (không có cấp duyệt phía trên)
              </li>
            )}
            {request.steps.map((s, i) => {
              const st = STEP_STATUS[s.status];
              const isCurrent = s.id === step?.id;
              return (
                <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} />
                  {i < request.steps.length - 1 && <span className="absolute left-[4px] top-3 h-full w-px bg-slate-200" />}
                  <div className="text-sm">
                    <p className="text-slate-800">
                      {APPROVAL_ACTION_LABELS[s.action]}: <span className="font-medium">{s.approver.full_name}</span>
                    </p>
                    <p className={`text-xs ${st.text}`}>
                      {isCurrent ? "Đang chờ xử lý" : s.status === "pending" ? "Chờ bước trước" : st.label}
                      {s.decided_at && ` · ${formatDateTime(s.decided_at)}`}
                    </p>
                    {s.comment && <p className="mt-1 text-xs italic text-slate-500">"{s.comment}"</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {isMyTurn && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="decision_comment">
              Ghi chú (không bắt buộc)
            </label>
            <textarea
              id="decision_comment"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
