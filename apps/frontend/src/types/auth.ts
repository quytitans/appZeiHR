export type Role = "employee" | "line_manager" | "hr_admin" | "system_admin";

/** Cấp trong luồng duyệt đơn - gắn theo Chức vụ, độc lập với Role (RBAC) */
export type ApprovalLevel = "staff" | "department_head" | "director" | "ceo";

export const APPROVAL_LEVEL_LABELS: Record<ApprovalLevel, string> = {
  staff: "Nhân viên",
  department_head: "Trưởng phòng",
  director: "Giám đốc",
  ceo: "CEO",
};

export interface MyEmployee {
  id: number;
  employee_code: string;
  full_name: string;
  approval_level: ApprovalLevel;
}

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  is_active: boolean;
  /** Hồ sơ nhân viên gắn với tài khoản; null với tài khoản hệ thống (vd admin@hrm.local) */
  employee: MyEmployee | null;
}

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Nhân viên",
  line_manager: "Quản lý trực tiếp",
  hr_admin: "Quản trị nhân sự",
  system_admin: "Quản trị hệ thống",
};
