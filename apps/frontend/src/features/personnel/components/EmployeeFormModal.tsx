import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { createEmployee, listDepartments, listPositions, uploadContractDocument } from "@/api/personnel";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmployeeFormFields } from "@/features/personnel/components/EmployeeFormFields";
import { getErrorDetail } from "@/lib/errors";
import type { EmployeeFormValues } from "@/types/personnel";

interface EmployeeFormModalProps {
  onClose: () => void;
  onCreated: () => void;
}

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
      // Mã nhân viên KHÔNG sinh trước - backend tự sinh ngay trong lúc tạo (POST này) để
      // tránh 2 người mở form cùng lúc bị cấp trùng mã.
      const employee = await createEmployee({
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
      setError(getErrorDetail(err) ?? "Không thể tạo hồ sơ nhân sự. Vui lòng thử lại.");
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
        <p className="text-xs text-slate-400">
          Mã nhân viên sẽ được hệ thống tự động sinh (ZEI + năm tháng + số thứ tự) ngay khi bạn
          bấm "Lưu hồ sơ".
        </p>

        <EmployeeFormFields form={form} update={update} departments={departments} positions={positions} />

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
