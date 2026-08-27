import { apiClient } from "@/api/client";
import type {
  Department,
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
  employee_code: string;
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

export async function getNextEmployeeCode(): Promise<string> {
  const { data } = await apiClient.get<{ employee_code: string }>("/personnel/employees/next-code");
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

export async function uploadContractDocument(employeeId: number, file: File): Promise<Employee> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<Employee>(
    `/personnel/employees/${employeeId}/contract-document`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function listDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<Department[]>("/personnel/departments");
  return data;
}

export async function listPositions(): Promise<Position[]> {
  const { data } = await apiClient.get<Position[]>("/personnel/positions");
  return data;
}
