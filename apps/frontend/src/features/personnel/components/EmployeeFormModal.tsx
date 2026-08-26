import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { createEmployee, listDepartments, listPositions, uploadContractDocument } from "@/api/personnel";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { EmployeeFormValues } from "@/types/personnel";

interface EmployeeFormModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const EMPTY_FORM: EmployeeFormValues = {
  employee_code: "",
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

function isAxiosErrorWithDetail(err: unknown): err is { response: { data: { detail: string } } } {
  return (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: unknown }).response === "object"
  );
}

export function EmployeeFormModal({ onClose, onCreated }: EmployeeFormModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EmployeeFormValues>(EMPTY_FORM);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: listDepartments,
  });
  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: listPositions,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const employee = await createEmployee({
        employee_code: form.employee_code.trim(),
        full_name: form.full_name.trim(),
        company_email: form.company_email.trim() || null,
        national_id: form.national_id.trim() || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone.trim() || null,
        department_id: form.department_id ? Number(form.department_id) : null,
        position_id: form.position_id ? Number(form.position_id) : null,
        start_date: form.start_date || null,
      });

      if (contractFile) {
        await uploadContractDocument(employee.id, contractFile);
      }
      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onCreated();
    },
    onError: (err) => {
      const detail = isAxiosErrorWithDetail(err) ? err.response.data.detail : null;
      setError(detail ?? "Không thể tạo hồ sơ nhân sự. Vui lòng thử lại.");
    },
  });

  function update<K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
  const labelClass = "mb-1 block text-xs font-medium text-slate-600";

  return (
    <Modal
      title="Thêm mới hồ sơ nhân sự"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="employee-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu hồ sơ"}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Thông tin định danh
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="employee_code">
                Mã nhân viên <span className="text-red-500">*</span>
              </label>
              <input
                id="employee_code"
                required
                value={form.employee_code}
                onChange={(e) => update("employee_code", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="full_name">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                id="full_name"
                required
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="gender">
                Giới tính
              </label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value as EmployeeFormValues["gender"])}
                className={inputClass}
              >
                <option value="">— Không chọn —</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="date_of_birth">
                Ngày sinh
              </label>
              <input
                id="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => update("date_of_birth", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="national_id">
                Số CCCD/CMND
              </label>
              <input
                id="national_id"
                value={form.national_id}
                onChange={(e) => update("national_id", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Liên hệ
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="company_email">
                Email
              </label>
              <input
                id="company_email"
                type="email"
                value={form.company_email}
                onChange={(e) => update("company_email", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="phone">
                Số điện thoại
              </label>
              <input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Công việc
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="department_id">
                Phòng ban
              </label>
              <select
                id="department_id"
                value={form.department_id}
                onChange={(e) => update("department_id", e.target.value)}
                className={inputClass}
              >
                <option value="">— Không chọn —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="position_id">
                Chức vụ
              </label>
              <select
                id="position_id"
                value={form.position_id}
                onChange={(e) => update("position_id", e.target.value)}
                className={inputClass}
              >
                <option value="">— Không chọn —</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="start_date">
                Ngày vào làm
              </label>
              <input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => update("start_date", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tài liệu đính kèm
          </h3>
          <label
            htmlFor="contract_file"
            className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 hover:border-brand-400 hover:bg-brand-50/40"
          >
            <span className="truncate">
              {contractFile ? contractFile.name : "Chọn file hợp đồng lao động (PDF, tối đa 10MB)"}
            </span>
            <span className="shrink-0 font-medium text-brand-700">Chọn file</span>
          </label>
          <input
            id="contract_file"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </form>
    </Modal>
  );
}
