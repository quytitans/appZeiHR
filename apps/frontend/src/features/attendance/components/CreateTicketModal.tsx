import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { createLeaveRequest, getMyBalances, getMyWorkflow } from "@/api/attendance";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApproverPicker } from "@/features/attendance/components/ApproverPicker";
import { countLeaveDays } from "@/features/attendance/workflow";
import { getErrorDetail } from "@/lib/errors";
import { APPROVAL_LEVEL_LABELS, type MyEmployee } from "@/types/auth";
import {
  APPROVAL_ACTION_LABELS,
  LEAVE_TYPE_LABELS,
  type ApproverCandidate,
  type LeaveType,
} from "@/types/attendance";

// "leave" gửi POST /attendance/leave-requests; "attendance_fix" mới có UI, chưa có model/endpoint.
type TicketKind = "leave" | "attendance_fix";

const TICKET_KIND_LABELS: Record<TicketKind, string> = {
  leave: "Xin nghỉ phép",
  attendance_fix: "Giải trình chấm công",
};

const ATTENDANCE_FIX_REASONS = ["Quên check-in", "Quên check-out", "Đi muộn", "Về sớm", "Đi công tác"];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
const labelClass = "mb-1 block text-xs font-medium text-slate-600";

interface CreateTicketModalProps {
  /** Hồ sơ của người đang đăng nhập; null = tài khoản hệ thống, không tạo được ticket */
  me: MyEmployee | null;
  onClose: () => void;
}

export function CreateTicketModal({ me, onClose }: CreateTicketModalProps) {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<TicketKind>("leave");
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [fixReason, setFixReason] = useState(ATTENDANCE_FIX_REASONS[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: workflow = [], isLoading: workflowLoading } = useQuery({
    queryKey: ["leave-workflow", me?.id],
    queryFn: getMyWorkflow,
    enabled: !!me,
  });
  // Người duyệt được chọn cho từng bước (theo index của workflow); undefined = chưa đụng
  // tới -> dùng người duyệt mặc định theo chuỗi quản lý
  const [picked, setPicked] = useState<Record<number, ApproverCandidate | null>>({});
  const approvers = workflow.map((step, i) => (i in picked ? picked[i] : step.default_approver));
  const allPicked = approvers.every((a) => a !== null);

  // Kiểm tra quỹ ngày nghỉ của loại đang chọn (năm của ngày bắt đầu); backend kiểm tra lại
  const effectiveEnd = isHalfDay ? startDate : endDate;
  const requestedDays = countLeaveDays(startDate, effectiveEnd, isHalfDay);
  const balanceYear = startDate ? Number(startDate.slice(0, 4)) : new Date().getFullYear();
  const { data: myBalances } = useQuery({
    queryKey: ["leave-balances", "me", balanceYear],
    queryFn: () => getMyBalances(balanceYear),
    enabled: !!me && kind === "leave",
  });
  const balance = myBalances?.balances.find((b) => b.leave_type === leaveType);
  const datesChosen = !!startDate && !!effectiveEnd;
  // So với "có thể đăng ký thêm" (đã trừ ticket đang chờ duyệt), không phải số còn lại trong quỹ
  const enoughBalance = !!balance && requestedDays > 0 && requestedDays <= balance.available_days;

  const canSubmit = kind === "leave" && !!me && !workflowLoading && allPicked && enoughBalance;

  const mutation = useMutation({
    mutationFn: () =>
      createLeaveRequest({
        leave_type: leaveType,
        start_date: startDate,
        end_date: isHalfDay ? startDate : endDate,
        is_half_day: isHalfDay,
        reason: note.trim() || null,
        approver_ids: approvers.map((a) => a!.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      onClose();
    },
    onError: (err) => setError(getErrorDetail(err) ?? "Không thể gửi ticket. Vui lòng thử lại."),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (canSubmit) mutation.mutate();
  }

  return (
    <Modal
      title="Tạo ticket của bạn"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="ticket-form" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Đang gửi..." : "Gửi ticket"}
          </Button>
        </>
      }
    >
      <form id="ticket-form" onSubmit={handleSubmit} className="space-y-5">
        {!me && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Tài khoản này chưa liên kết hồ sơ nhân viên nên không tạo được ticket.
          </p>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          {(Object.keys(TICKET_KIND_LABELS) as TicketKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                kind === k ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {TICKET_KIND_LABELS[k]}
            </button>
          ))}
        </div>

        {kind === "leave" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="leave_type">
                Loại nghỉ
              </label>
              <select
                id="leave_type"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className={inputClass}
              >
                {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="start_date">
                Từ ngày
              </label>
              <input
                id="start_date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="end_date">
                Đến ngày
              </label>
              <input
                id="end_date"
                type="date"
                value={isHalfDay ? startDate : endDate}
                min={startDate || undefined}
                required={!isHalfDay}
                disabled={isHalfDay}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Nghỉ nửa ngày
            </label>
            {balance && (
              <div
                className={`rounded-lg px-3 py-2 text-xs sm:col-span-2 ${
                  datesChosen && !enoughBalance ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"
                }`}
              >
                <p>
                  Quỹ {LEAVE_TYPE_LABELS[leaveType].toLowerCase()} năm {balanceYear}: còn{" "}
                  <span className="font-semibold">{balance.remaining_days}</span> / {balance.total_days} ngày
                  {balance.pending_days > 0 && (
                    <>
                      {" "}
                      · đang chờ duyệt ở ticket khác: {balance.pending_days} ngày → có thể đăng ký thêm{" "}
                      <span className="font-semibold">{balance.available_days}</span> ngày
                    </>
                  )}
                </p>
                {datesChosen && (
                  <p className="mt-0.5">
                    Ticket này: <span className="font-semibold">{requestedDays}</span> ngày làm việc
                    {requestedDays === 0 && " (chỉ gồm T7/CN)"}
                    {requestedDays > balance.available_days && " - vượt quỹ, không thể gửi"}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="fix_date">
                Ngày cần giải trình
              </label>
              <input
                id="fix_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="fix_reason">
                Vấn đề
              </label>
              <select
                id="fix_reason"
                value={fixReason}
                onChange={(e) => setFixReason(e.target.value)}
                className={inputClass}
              >
                {ATTENDANCE_FIX_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="ticket_note">
            {kind === "leave" ? "Lý do" : "Nội dung giải trình"}
          </label>
          <textarea
            id="ticket_note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </div>

        {kind === "leave" && me && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Người duyệt</h3>
            {workflowLoading ? (
              <p className="text-sm text-slate-400">Đang tải luồng duyệt...</p>
            ) : (
              <ol className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                    1
                  </span>
                  Bạn tạo ticket
                </li>
                {workflow.length === 0 && (
                  <li className="pl-9 text-sm text-slate-500">Tự động duyệt (không có cấp duyệt phía trên).</li>
                )}
                {workflow.map((step, i) => (
                  <li key={step.step_order} className="flex gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {i + 2}
                    </span>
                    <div className="min-w-0 flex-1">
                      <label className={labelClass} htmlFor={`approver_${i}`}>
                        {APPROVAL_LEVEL_LABELS[step.level]} {APPROVAL_ACTION_LABELS[step.action].toLowerCase()}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <ApproverPicker
                        id={`approver_${i}`}
                        level={step.level}
                        value={approvers[i]}
                        onChange={(a) => setPicked((prev) => ({ ...prev, [i]: a }))}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
        {kind === "attendance_fix" && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Ticket giải trình chấm công mới có giao diện, chức năng gửi sẽ được phát triển sau.
          </p>
        )}
      </form>
    </Modal>
  );
}
