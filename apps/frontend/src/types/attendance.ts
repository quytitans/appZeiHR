import type { ApprovalLevel } from "@/types/auth";

export type LeaveType =
  | "annual"
  | "sick"
  | "compensation"
  | "maternity_paternity"
  | "unpaid"
  | "other";

export type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Nghỉ phép năm",
  sick: "Nghỉ ốm",
  compensation: "Nghỉ bù",
  maternity_paternity: "Thai sản",
  unpaid: "Nghỉ không lương",
  other: "Khác",
};

export const LEAVE_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

/** confirm = trưởng phòng xác nhận (bước trung gian), approve = bước duyệt cuối */
export type ApprovalAction = "confirm" | "approve";
export type ApprovalStepStatus = "pending" | "approved" | "rejected" | "skipped";

export const APPROVAL_ACTION_LABELS: Record<ApprovalAction, string> = {
  confirm: "Xác nhận",
  approve: "Duyệt",
};

export interface EmployeeBrief {
  id: number;
  employee_code: string;
  full_name: string;
}

/** Ứng viên người duyệt trong ô tìm kiếm của form tạo ticket */
export interface ApproverCandidate {
  id: number;
  employee_code: string;
  full_name: string;
  company_email: string | null;
  department_name: string | null;
}

/** 1 bước trong luồng duyệt áp cho người đang đăng nhập (GET /attendance/leave-requests/workflow) */
export interface WorkflowStep {
  step_order: number;
  level: ApprovalLevel;
  action: ApprovalAction;
  /** Người duyệt mặc định theo chuỗi quản lý trực tiếp, để điền sẵn */
  default_approver: ApproverCandidate | null;
}

export interface LeaveApprovalStep {
  id: number;
  step_order: number;
  action: ApprovalAction;
  status: ApprovalStepStatus;
  comment: string | null;
  decided_at: string | null;
  approver: EmployeeBrief;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  reason: string | null;
  attachment_url: string | null;
  status: LeaveRequestStatus;
  approver_id: number | null;
  created_at: string;
  employee: EmployeeBrief | null;
  steps: LeaveApprovalStep[];
  /** Bước đang chờ xử lý, null nếu đơn đã kết thúc */
  current_step: LeaveApprovalStep | null;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  work_date: string;
  /** Giờ địa phương không kèm múi giờ, vd "2026-10-26T08:21:00" */
  check_in: string | null;
  check_out: string | null;
  is_late: boolean;
  is_early_leave: boolean;
  employee: EmployeeBrief | null;
}

/** mine = đơn của tôi, to_review = chờ tôi xử lý, all = toàn công ty (HR) */
export type LeaveScope = "mine" | "to_review" | "all";
export type AttendanceTab = LeaveScope | "attendance" | "balances";

/**
 * Quỹ 1 loại nghỉ trong năm. used = đơn đã duyệt xong mọi bước, pending = đơn đang trong
 * quá trình duyệt. remaining = còn lại thực tế (cấp - used), chỉ giảm khi đơn duyệt xong;
 * available = có thể đăng ký thêm (remaining - pending), dùng để chặn gửi vượt quỹ.
 */
export interface LeaveBalance {
  leave_type: LeaveType;
  total_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
  available_days: number;
}

export interface EmployeeBalances {
  employee: EmployeeBrief;
  department_name: string | null;
  year: number;
  balances: LeaveBalance[];
}
