import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from "@/api/personnel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { getErrorDetail } from "@/lib/errors";
import type { Department } from "@/types/personnel";

interface DepartmentFormValues {
  name: string;
  code: string;
}

const EMPTY_FORM: DepartmentFormValues = { name: "", code: "" };

export function DepartmentSection() {
  const queryClient = useQueryClient();
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: listDepartments,
  });

  const [editing, setEditing] = useState<Department | "new" | null>(null);
  const [form, setForm] = useState<DepartmentFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setEditing("new");
  }

  function openEdit(department: Department) {
    setForm({ name: department.name, code: department.code });
    setError(null);
    setEditing(department);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name.trim(), code: form.code.trim() };
      if (editing && editing !== "new") {
        return updateDepartment(editing.id, payload);
      }
      return createDepartment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setEditing(null);
    },
    onError: (err) => {
      setError(getErrorDetail(err) ?? "Không thể lưu phòng ban. Vui lòng thử lại.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setRowError(null);
    },
    onError: (err, id) => {
      setRowError({
        id,
        message: getErrorDetail(err) ?? "Không thể xóa phòng ban. Vui lòng thử lại.",
      });
    },
  });

  function handleDelete(department: Department) {
    if (!window.confirm(`Xóa phòng ban "${department.name}"?`)) return;
    setRowError(null);
    deleteMutation.mutate(department.id);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    saveMutation.mutate();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Phòng ban</h2>
          <p className="text-xs text-slate-400">{departments.length} phòng ban</p>
        </div>
        <Button onClick={openCreate}>
          <Icon name="plus" className="h-4 w-4" />
          Thêm
        </Button>
      </div>

      {isLoading && <p className="px-5 py-6 text-sm text-slate-400">Đang tải...</p>}
      {!isLoading && departments.length === 0 && (
        <p className="px-5 py-6 text-sm text-slate-400">Chưa có phòng ban nào.</p>
      )}

      {departments.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2.5">Tên phòng ban</th>
              <th className="px-5 py-2.5">Mã</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((department) => (
              <tr key={department.id}>
                <td className="px-5 py-3">
                  <div className="font-medium text-slate-900">{department.name}</div>
                  {rowError?.id === department.id && (
                    <p className="mt-1 text-xs text-red-600">{rowError.message}</p>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-500">{department.code}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(department)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                      aria-label={`Sửa ${department.name}`}
                    >
                      <Icon name="edit" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(department)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Xóa ${department.name}`}
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal
          title={editing === "new" ? "Thêm phòng ban" : "Sửa phòng ban"}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Hủy
              </Button>
              <Button type="submit" form="department-form" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </>
          }
        >
          <form id="department-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="dept_name">
                Tên phòng ban <span className="text-red-500">*</span>
              </label>
              <input
                id="dept_name"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="dept_code">
                Mã phòng ban <span className="text-red-500">*</span>
              </label>
              <input
                id="dept_code"
                required
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
