import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { listAttendanceRecords, listLeaveRequests } from "@/api/attendance";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AttendanceRecordList } from "@/features/attendance/components/AttendanceRecordList";
import { CreateTicketModal } from "@/features/attendance/components/CreateTicketModal";
import { LeaveRequestDetailModal } from "@/features/attendance/components/LeaveRequestDetailModal";
import { LeaveBalanceConfig } from "@/features/attendance/components/LeaveBalanceConfig";
import { LeaveRequestList } from "@/features/attendance/components/LeaveRequestList";
import { MyBalancesModal } from "@/features/attendance/components/MyBalancesModal";
import { useMe } from "@/hooks/useMe";
import { useAuthStore } from "@/store/authStore";
import type { AttendanceTab, LeaveRequest, LeaveScope } from "@/types/attendance";

const VIEW_ALL_ROLES = ["hr_admin", "system_admin"];

const TAB_LABELS: Record<AttendanceTab, string> = {
  mine: "Ticket của tôi",
  to_review: "Chờ tôi xử lý",
  all: "Tất cả đơn",
  attendance: "Chấm công",
  balances: "Quỹ ngày nghỉ",
};

const EMPTY_TEXT: Record<LeaveScope, string> = {
  mine: "Bạn chưa có ticket nào.",
  to_review: "Không có đơn nào đang chờ bạn xử lý.",
  all: "Chưa có đơn nghỉ phép nào.",
};

/**
 * Tab hiển thị theo quyền (SRS 3.4 - Workflow duyệt đơn nghỉ):
 * - Ai có hồ sơ nhân viên: "Ticket của tôi"
 * - Cấp Trưởng phòng trở lên: thêm "Chờ tôi xử lý"
 * - HR/System Admin: thêm "Tất cả đơn", tab Chấm công xem toàn công ty
 * Tab đang chọn lưu ở URL (?tab=...) để giữ nguyên khi reload/back.
 */
export function AttendancePage() {
  const token = useAuthStore((state) => state.token);
  const { data: me } = useMe();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showBalances, setShowBalances] = useState(false);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);

  const myEmployee = me?.employee ?? null;
  const canViewAll = !!me && VIEW_ALL_ROLES.includes(me.role);
  const isApprover = !!myEmployee && myEmployee.approval_level !== "staff";

  const tabs: AttendanceTab[] = [
    ...(myEmployee ? (["mine"] as const) : []),
    ...(isApprover ? (["to_review"] as const) : []),
    ...(canViewAll ? (["all"] as const) : []),
    "attendance",
    ...(canViewAll ? (["balances"] as const) : []),
  ];
  const requestedTab = searchParams.get("tab") as AttendanceTab | null;
  const tab: AttendanceTab = requestedTab && tabs.includes(requestedTab) ? requestedTab : tabs[0];
  const leaveScope: LeaveScope | null = tab === "attendance" || tab === "balances" ? null : tab;

  const leaveQuery = useQuery({
    queryKey: ["leave-requests", leaveScope],
    queryFn: () => listLeaveRequests(leaveScope!),
    enabled: !!me && leaveScope !== null,
  });
  // Luôn tải để hiện số đơn chờ xử lý trên tab, kể cả khi đang ở tab khác
  const toReviewQuery = useQuery({
    queryKey: ["leave-requests", "to_review"],
    queryFn: () => listLeaveRequests("to_review"),
    enabled: isApprover,
  });
  const attendanceScope = canViewAll ? "all" : "mine";
  const attendanceQuery = useQuery({
    queryKey: ["attendance-records", attendanceScope],
    queryFn: () => listAttendanceRecords(attendanceScope),
    enabled: !!me && tab === "attendance",
  });

  if (!token) {
    return (
      <PageShell>
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Icon name="attendance" className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-slate-900">Cần đăng nhập</h1>
          <p className="mt-2 text-sm text-slate-500">Bạn cần đăng nhập để xem chấm công và nghỉ phép.</p>
          <Link to="/login">
            <Button className="mt-6">Đăng nhập</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  // Tab "balances" tự quản lý trạng thái tải trong LeaveBalanceConfig
  const activeQuery = tab === "attendance" ? attendanceQuery : tab === "balances" ? null : leaveQuery;
  const toReviewCount = toReviewQuery.data?.length ?? 0;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Chấm công & Nghỉ phép</h1>
            <p className="mt-1 text-sm text-slate-500">Theo dõi ngày nghỉ, giờ vào/ra và gửi yêu cầu của bạn.</p>
            {myEmployee && (
              <button
                type="button"
                onClick={() => setShowBalances(true)}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
              >
                Xem quỹ ngày nghỉ của tôi
                <Icon name="arrow-right" className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={() => setShowTicketModal(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Tạo ticket của bạn
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4" role="tablist">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setSearchParams({ tab: t }, { replace: true })}
                className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {TAB_LABELS[t]}
                {t === "to_review" && toReviewCount > 0 && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                    {toReviewCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeQuery?.isLoading && <p className="px-4 py-10 text-center text-sm text-slate-400">Đang tải dữ liệu...</p>}
          {activeQuery?.isError && (
            <p className="px-4 py-6 text-center text-sm text-red-600">
              Không tải được dữ liệu. Kiểm tra kết nối tới API backend.
            </p>
          )}
          {leaveScope && leaveQuery.data && (
            <LeaveRequestList
              key={leaveScope}
              requests={leaveQuery.data}
              showEmployee={leaveScope !== "mine"}
              emptyText={EMPTY_TEXT[leaveScope]}
              onSelect={setSelected}
            />
          )}
          {tab === "attendance" && attendanceQuery.data && <AttendanceRecordList records={attendanceQuery.data} />}
          {tab === "balances" && <LeaveBalanceConfig />}
        </div>
      </div>

      {showTicketModal && <CreateTicketModal me={myEmployee} onClose={() => setShowTicketModal(false)} />}
      {showBalances && <MyBalancesModal onClose={() => setShowBalances(false)} />}
      {selected && (
        <LeaveRequestDetailModal
          request={selected}
          myEmployeeId={myEmployee?.id ?? null}
          onClose={() => setSelected(null)}
        />
      )}
    </PageShell>
  );
}
