export type Role = "employee" | "line_manager" | "hr_admin" | "system_admin";

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  is_active: boolean;
}

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Nhân viên",
  line_manager: "Quản lý trực tiếp",
  hr_admin: "Quản trị nhân sự",
  system_admin: "Quản trị hệ thống",
};
