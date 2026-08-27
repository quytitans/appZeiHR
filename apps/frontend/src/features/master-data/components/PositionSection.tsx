import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { createPosition, deletePosition, listPositions, updatePosition } from "@/api/personnel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { getErrorDetail } from "@/lib/errors";
import type { Position } from "@/types/personnel";

export function PositionSection() {
  const queryClient = useQueryClient();
  const { data: positions = [], isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: listPositions,
  });

  const [editing, setEditing] = useState<Position | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);

  function openCreate() {
    setTitle("");
    setError(null);
    setEditing("new");
  }

  function openEdit(position: Position) {
    setTitle(position.title);
    setError(null);
    setEditing(position);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { title: title.trim() };
      if (editing && editing !== "new") {
        return updatePosition(editing.id, payload);
      }
      return createPosition(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setEditing(null);
    },
    onError: (err) => {
      setError(getErrorDetail(err) ?? "Không thể lưu chức vụ. Vui lòng thử lại.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setRowError(null);
    },
    onError: (err, id) => {
      setRowError({
        id,
        message: getErrorDetail(err) ?? "Không thể xóa chức vụ. Vui lòng thử lại.",
      });
    },
  });

  function handleDelete(position: Position) {
    if (!window.confirm(`Xóa chức vụ "${position.title}"?`)) return;
    setRowError(null);
    deleteMutation.mutate(position.id);
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
          <h2 className="text-sm font-semibold text-slate-900">Chức vụ</h2>
          <p className="text-xs text-slate-400">{positions.length} chức vụ</p>
        </div>
        <Button onClick={openCreate}>
          <Icon name="plus" className="h-4 w-4" />
          Thêm
        </Button>
      </div>

      {isLoading && <p className="px-5 py-6 text-sm text-slate-400">Đang tải...</p>}
      {!isLoading && positions.length === 0 && (
        <p className="px-5 py-6 text-sm text-slate-400">Chưa có chức vụ nào.</p>
      )}

      {positions.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2.5">Tên chức vụ</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {positions.map((position) => (
              <tr key={position.id}>
                <td className="px-5 py-3">
                  <div className="font-medium text-slate-900">{position.title}</div>
                  {rowError?.id === position.id && (
                    <p className="mt-1 text-xs text-red-600">{rowError.message}</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(position)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                      aria-label={`Sửa ${position.title}`}
                    >
                      <Icon name="edit" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(position)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Xóa ${position.title}`}
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
          title={editing === "new" ? "Thêm chức vụ" : "Sửa chức vụ"}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Hủy
              </Button>
              <Button type="submit" form="position-form" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </>
          }
        >
          <form id="position-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="position_title">
                Tên chức vụ <span className="text-red-500">*</span>
              </label>
              <input
                id="position_title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
