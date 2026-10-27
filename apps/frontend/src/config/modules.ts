import type { Role } from "@/types/auth";

export interface ModuleConfig {
  key: string;
  title: string;
  description: string;
  path: string;
  icon: "personnel" | "contracts" | "benefits" | "attendance" | "users" | "database" | "assets";
  /** Vai trò được phép truy cập, khớp bảng phân quyền SRS mục 2.1 */
  roles: Role[];
}

export const MODULES: ModuleConfig[] = [
  {
    key: "personnel",
    title: "Hồ sơ nhân sự",
    description: "Thông tin cá nhân, công việc, tài liệu đính kèm của toàn bộ nhân viên.",
    path: "/personnel",
    icon: "personnel",
    roles: ["employee", "line_manager", "hr_admin", "system_admin"],
  },
  {
    key: "benefits",
    title: "Phúc lợi",
    description: "Danh mục phúc lợi công ty, đăng ký và lịch sử sử dụng.",
    path: "/benefits",
    icon: "benefits",
    roles: ["employee", "line_manager", "hr_admin", "system_admin"],
  },
  {
    key: "attendance",
    title: "Chấm công & Nghỉ phép",
    description: "Check-in/out, đăng ký nghỉ phép năm, nghỉ ốm, ngủ bù, thai sản.",
    path: "/attendance",
    icon: "attendance",
    roles: ["employee", "line_manager", "hr_admin", "system_admin"],
  },
  {
    // Placeholder - chưa có backend, chờ phát triển sau
    key: "assets",
    title: "Quản lý tài sản",
    description: "Theo dõi tài sản, thiết bị cấp phát cho nhân viên, bàn giao và thu hồi.",
    path: "/assets",
    icon: "assets",
    roles: ["employee", "line_manager", "hr_admin", "system_admin"],
  },
  {
    key: "users",
    title: "Quản trị hệ thống",
    description: "Phân quyền người dùng, cấu hình chung và bảo mật truy cập.",
    path: "/admin/users",
    icon: "users",
    roles: ["system_admin"],
  },
  {
    key: "master-data",
    title: "Master Data",
    description: "Quản lý dữ liệu nền tảng dùng chung: phòng ban, chức vụ...",
    path: "/master-data",
    icon: "database",
    roles: ["hr_admin", "system_admin"],
  },
];
