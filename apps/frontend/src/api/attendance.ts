import { apiClient } from "@/api/client";
import type { ApprovalLevel } from "@/types/auth";
import type {
  ApproverCandidate,
  AttendanceRecord,
  EmployeeBalances,
  LeaveRequest,
  LeaveScope,
  LeaveType,
  WorkflowStep,
} from "@/types/attendance";

export async function listLeaveRequests(scope: LeaveScope): Promise<LeaveRequest[]> {
  const { data } = await apiClient.get<LeaveRequest[]>("/attendance/leave-requests", {
    params: { scope },
  });
  return data;
}

export interface CreateLeaveRequestPayload {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  reason: string | null;
  /** Người duyệt từng bước, đúng thứ tự getMyWorkflow() */
  approver_ids: number[];
}

export async function createLeaveRequest(payload: CreateLeaveRequestPayload): Promise<LeaveRequest> {
  const { data } = await apiClient.post<LeaveRequest>("/attendance/leave-requests", payload);
  return data;
}

export async function getMyWorkflow(): Promise<WorkflowStep[]> {
  const { data } = await apiClient.get<WorkflowStep[]>("/attendance/leave-requests/workflow");
  return data;
}

export async function searchApprovers(level: ApprovalLevel, search: string): Promise<ApproverCandidate[]> {
  const { data } = await apiClient.get<ApproverCandidate[]>("/attendance/approvers", {
    params: { level, search: search || undefined },
  });
  return data;
}

export async function decideLeaveRequest(
  id: number,
  decision: "approve" | "reject",
  comment: string | null,
): Promise<LeaveRequest> {
  const { data } = await apiClient.post<LeaveRequest>(`/attendance/leave-requests/${id}/decision`, {
    decision,
    comment,
  });
  return data;
}

export async function cancelLeaveRequest(id: number): Promise<LeaveRequest> {
  const { data } = await apiClient.post<LeaveRequest>(`/attendance/leave-requests/${id}/cancel`);
  return data;
}

export async function listAttendanceRecords(scope: "mine" | "all"): Promise<AttendanceRecord[]> {
  const { data } = await apiClient.get<AttendanceRecord[]>("/attendance/records", { params: { scope } });
  return data;
}

export async function getMyBalances(year: number): Promise<EmployeeBalances> {
  const { data } = await apiClient.get<EmployeeBalances>("/attendance/leave-balances/me", { params: { year } });
  return data;
}

export async function listBalances(year: number): Promise<EmployeeBalances[]> {
  const { data } = await apiClient.get<EmployeeBalances[]>("/attendance/leave-balances", { params: { year } });
  return data;
}

export async function updateQuotas(
  employeeId: number,
  year: number,
  quotas: Partial<Record<LeaveType, number>>,
): Promise<EmployeeBalances> {
  const { data } = await apiClient.put<EmployeeBalances>(
    `/attendance/leave-balances/${employeeId}`,
    { quotas },
    { params: { year } },
  );
  return data;
}
