import { apiClient } from "@/api/client";
import type { ApprovalLevel } from "@/types/auth";
import type {
  Department,
  DocumentType,
  Employee,
  EmployeePage,
  Position,
  SortBy,
  SortDir,
} from "@/types/personnel";

export interface ListEmployeesParams {
  search?: string;
  page: number;
  page_size: number;
  sort_by: SortBy;
  sort_dir: SortDir;
}

export async function listEmployees(params: ListEmployeesParams): Promise<EmployeePage> {
  const { data } = await apiClient.get<EmployeePage>("/personnel/employees", { params });
  return data;
}

export interface CreateEmployeePayload {
  full_name: string;
  company_email?: string | null;
  national_id?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  department_id?: number | null;
  position_id?: number | null;
  start_date?: string | null;
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  const { data } = await apiClient.post<Employee>("/personnel/employees", payload);
  return data;
}

/** Mã nhân viên dự kiến theo họ tên - chỉ xem trước, mã thật chốt lúc createEmployee. */
export async function previewEmployeeCode(fullName: string): Promise<string> {
  const { data } = await apiClient.get<{ employee_code: string }>(
    "/personnel/employees/code-preview",
    { params: { full_name: fullName } },
  );
  return data.employee_code;
}

export async function getEmployee(id: number): Promise<Employee> {
  const { data } = await apiClient.get<Employee>(`/personnel/employees/${id}`);
  return data;
}

export type UpdateEmployeePayload = CreateEmployeePayload;

export async function updateEmployee(
  id: number,
  payload: UpdateEmployeePayload,
): Promise<Employee> {
  const { data } = await apiClient.put<Employee>(`/personnel/employees/${id}`, payload);
  return data;
}

export async function uploadEmployeeDocument(
  employeeId: number,
  file: File,
  docType: DocumentType,
): Promise<Employee> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<Employee>(
    `/personnel/employees/${employeeId}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, params: { doc_type: docType } },
  );
  return data;
}

export async function deleteEmployeeDocument(
  employeeId: number,
  documentId: number,
): Promise<Employee> {
  const { data } = await apiClient.delete<Employee>(
    `/personnel/employees/${employeeId}/documents/${documentId}`,
  );
  return data;
}

export async function listDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<Department[]>("/personnel/departments");
  return data;
}

export interface DepartmentPayload {
  name: string;
  code: string;
}

export async function createDepartment(payload: DepartmentPayload): Promise<Department> {
  const { data } = await apiClient.post<Department>("/personnel/departments", payload);
  return data;
}

export async function updateDepartment(id: number, payload: DepartmentPayload): Promise<Department> {
  const { data } = await apiClient.put<Department>(`/personnel/departments/${id}`, payload);
  return data;
}

export async function deleteDepartment(id: number): Promise<void> {
  await apiClient.delete(`/personnel/departments/${id}`);
}

export async function listPositions(): Promise<Position[]> {
  const { data } = await apiClient.get<Position[]>("/personnel/positions");
  return data;
}

export interface PositionPayload {
  title: string;
  approval_level: ApprovalLevel;
}

export async function createPosition(payload: PositionPayload): Promise<Position> {
  const { data } = await apiClient.post<Position>("/personnel/positions", payload);
  return data;
}

export async function updatePosition(id: number, payload: PositionPayload): Promise<Position> {
  const { data } = await apiClient.put<Position>(`/personnel/positions/${id}`, payload);
  return data;
}

export async function deletePosition(id: number): Promise<void> {
  await apiClient.delete(`/personnel/positions/${id}`);
}
