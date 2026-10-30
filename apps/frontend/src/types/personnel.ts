import type { ApprovalLevel, Role } from "@/types/auth";

export type Gender = "male" | "female" | "other";
export type EmployeeStatus = "active" | "on_leave" | "terminated";

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: "Đang làm việc",
  on_leave: "Đang nghỉ",
  terminated: "Đã nghỉ việc",
};

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface Position {
  id: number;
  title: string;
  approval_level: ApprovalLevel;
}

// Phải khớp EmployeeDocumentType ở backend (app/modules/personnel/schemas.py)
export type DocumentType = "employment_contract" | "contract_appendix" | "other";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  employment_contract: "Hợp đồng lao động",
  contract_appendix: "Phụ lục hợp đồng",
  other: "Tài liệu khác",
};

export interface EmployeeDocument {
  id: number;
  doc_type: DocumentType;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  company_email: string | null;
  personal_email: string | null;
  phone: string | null;
  national_id: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  department_id: number | null;
  position_id: number | null;
  manager_id: number | null;
  start_date: string | null;
  status: EmployeeStatus;
  /** null = chưa có tài khoản đăng nhập liên kết */
  user_id: number | null;
  department: { id: number; name: string } | null;
  position: { id: number; title: string } | null;
  contract_document: EmployeeDocument | null;
  /** Toàn bộ tài liệu đính kèm, mới nhất lên đầu */
  documents: EmployeeDocument[];
}

/** Response của tạo nhân viên / tạo tài khoản - temp_password chỉ có đúng 1 lần ngay sau khi tạo */
export interface EmployeeCreateResult extends Employee {
  temp_password: string | null;
}

export interface EmployeePage {
  items: Employee[];
  total: number;
  page: number;
  page_size: number;
}

export interface EmployeeFormValues {
  full_name: string;
  company_email: string;
  national_id: string;
  gender: Gender | "";
  date_of_birth: string;
  phone: string;
  department_id: string;
  position_id: string;
  start_date: string;
  /** Vai trò tài khoản - chỉ áp dụng khi có company_email */
  role: Role;
}

export type SortBy = "full_name" | "start_date";
export type SortDir = "asc" | "desc";
