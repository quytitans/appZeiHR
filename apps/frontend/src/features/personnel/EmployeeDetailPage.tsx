import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getEmployee, listDepartments, listPositions, updateEmployee } from "@/api/personnel";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ContractUploadSection } from "@/features/personnel/components/ContractUploadSection";
import { ContractViewerModal } from "@/features/personnel/components/ContractViewerModal";
import { EmployeeAvatar } from "@/features/personnel/components/EmployeeAvatar";
import { EmployeeFormFields } from "@/features/personnel/components/EmployeeFormFields";
import { StatusBadge } from "@/features/personnel/components/StatusBadge";
import { getErrorDetail } from "@/lib/errors";
import { useAuthStore } from "@/store/authStore";
import type { Employee, EmployeeFormValues } from "@/types/personnel";

const MANAGE_ROLES = ["hr_admin", "system_admin"];

const EMPTY_FORM: EmployeeFormValues = {
  full_name: "",
  company_email: "",
  national_id: "",
  gender: "",
  date_of_birth: "",
  phone: "",
  department_id: "",
  position_id: "",
  start_date: "",
};

function toFormValues(employee: Employee): EmployeeFormValues {
  return {
    full_name: employee.full_name,
    company_email: employee.company_email ?? "",
    national_id: employee.national_id ?? "",
    gender: employee.gender ?? "",
    date_of_birth: employee.date_of_birth ?? "",
    phone: employee.phone ?? "",
    department_id: employee.department_id ? String(employee.department_id) : "",
    position_id: employee.position_id ? String(employee.position_id) : "",
    start_date: employee.start_date ?? "",
  };
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManage = !!user && MANAGE_ROLES.includes(user.role);

  const [form, setForm] = useState<EmployeeFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [showContractViewer, setShowContractViewer] = useState(false);

  const {
    data: employee,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => getEmployee(employeeId),
    enabled: !!user && Number.isFinite(employeeId),
  });

  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: listDepartments });
  const { data: positions = [] } = useQuery({ queryKey: ["positions"], queryFn: listPositions });

  // Đồng bộ form với dữ liệu mới nhất mỗi khi employee được (re)fetch thành công.
  useEffect(() => {
    if (employee) setForm(toFormValues(employee));
  }, [employee]);

  function update<K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const mutation = useMutation({
    mutationFn: () =>
      updateEmployee(employeeId, {
        full_name: form.full_name.trim(),
        company_email: form.company_email.trim() || null,
        national_id: form.national_id.trim() || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone.trim() || null,
        department_id: form.department_id ? Number(form.department_id) : null,
        position_id: form.position_id ? Number(form.position_id) : null,
        start_date: form.start_date || null,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["employee", employeeId], updated);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setSavedAt(Date.now());
      setError(null);
    },
    onError: (err) => {
      setError(getErrorDetail(err) ?? "Không thể lưu thay đổi. Vui lòng thử lại.");
      setSavedAt(null);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavedAt(null);
    mutation.mutate();
  }

  function handleBack() {
    // navigate(-1) quay lại đúng URL trước đó (kèm query string search/page/sort đã lưu
    // trong PersonnelPage), giữ nguyên trạng thái danh sách thay vì reset về mặc định.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/personnel");
    }
  }

  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <h1 className="text-xl font-bold text-slate-900">Cần đăng nhập</h1>
          <Link to="/login">
            <Button className="mt-6">Đăng nhập</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  if (!Number.isFinite(employeeId)) {
    return (
      <PageShell>
        <p className="px-4 py-10 text-center text-sm text-red-600">Mã nhân viên không hợp lệ.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Quay lại danh sách
        </button>

        {isLoading && <p className="py-10 text-center text-sm text-slate-400">Đang tải hồ sơ...</p>}
        {isError && (
          <p className="py-10 text-center text-sm text-red-600">
            Không tải được hồ sơ nhân viên. Nhân viên có thể không tồn tại.
          </p>
        )}

        {employee && (
          <>
            <div className="mb-6 flex items-center gap-4">
              <EmployeeAvatar fullName={employee.full_name} sizeRem={3.5} />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-bold text-slate-900">{employee.full_name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>{employee.employee_code}</span>
                  <StatusBadge status={employee.status} />
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              {!canManage && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  Bạn chỉ có quyền xem hồ sơ này. Liên hệ Quản trị nhân sự để chỉnh sửa.
                </p>
              )}
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              {savedAt && !error && (
                <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                  Đã lưu thay đổi lúc {new Date(savedAt).toLocaleTimeString("vi-VN")}.
                </p>
              )}

              <EmployeeFormFields
                form={form}
                update={update}
                departments={departments}
                positions={positions}
                disabled={!canManage}
              />

              {canManage && (
                <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              )}
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ContractUploadSection
                employee={employee}
                canManage={canManage}
                onViewContract={() => setShowContractViewer(true)}
              />
            </div>
          </>
        )}
      </div>

      {showContractViewer && employee && (
        <ContractViewerModal employee={employee} onClose={() => setShowContractViewer(false)} />
      )}
    </PageShell>
  );
}
