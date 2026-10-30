import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { createEmployeeAccount } from "@/api/personnel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AccountCredentialsCard } from "@/features/personnel/components/AccountCredentialsCard";
import { getErrorDetail } from "@/lib/errors";
import { ROLE_LABELS, type Role } from "@/types/auth";
import type { Employee } from "@/types/personnel";

interface EmployeeAccountSectionProps {
  employee: Employee;
  canManage: boolean;
}

const ASSIGNABLE_ROLES: Role[] = ["employee", "line_manager", "hr_admin"];

export function EmployeeAccountSection({ employee, canManage }: EmployeeAccountSectionProps) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<Role>("employee");
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createEmployeeAccount(employee.id, role),
    onSuccess: (updated) => {
      queryClient.setQueryData(["employee", employee.id], updated);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setError(null);
      setTempPassword(updated.temp_password);
    },
    onError: (err) => {
      setError(getErrorDetail(err) ?? "Không thể tạo tài khoản. Vui lòng thử lại.");
    },
  });

  if (tempPassword && employee.company_email) {
    return (
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Tài khoản đăng nhập
        </h3>
        <AccountCredentialsCard
          email={employee.company_email}
          tempPassword={tempPassword}
          onDone={() => setTempPassword(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Tài khoản đăng nhập
      </h3>

      {employee.user_id ? (
        <p className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <Icon name="check" className="h-4 w-4 text-brand-700" />
          Đã có tài khoản đăng nhập ({employee.company_email})
        </p>
      ) : !canManage ? (
        <p className="text-sm text-slate-400">Nhân viên chưa có tài khoản đăng nhập.</p>
      ) : !employee.company_email ? (
        <p className="text-sm text-slate-400">
          Nhập Email ở trên và lưu lại trước khi tạo tài khoản đăng nhập.
        </p>
      ) : (
        <div className="space-y-3">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <p className="text-sm text-slate-500">Chưa có tài khoản đăng nhập.</p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              aria-label="Vai trò tài khoản"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              <Icon name="key" className="h-4 w-4" />
              {mutation.isPending ? "Đang tạo..." : "Tạo tài khoản đăng nhập"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
