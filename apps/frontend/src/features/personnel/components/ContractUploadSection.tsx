import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { uploadContractDocument } from "@/api/personnel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getErrorDetail } from "@/lib/errors";
import type { Employee } from "@/types/personnel";

interface ContractUploadSectionProps {
  employee: Employee;
  canManage: boolean;
  onViewContract: () => void;
}

export function ContractUploadSection({
  employee,
  canManage,
  onViewContract,
}: ContractUploadSectionProps) {
  const queryClient = useQueryClient();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (replace: boolean) => uploadContractDocument(employee.id, pendingFile!, replace),
    onSuccess: (updated) => {
      queryClient.setQueryData(["employee", employee.id], updated);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setPendingFile(null);
      setError(null);
      setUploadedAt(Date.now());
    },
    onError: (err) => {
      setError(getErrorDetail(err) ?? "Không thể tải lên hợp đồng. Vui lòng thử lại.");
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setUploadedAt(null);
    setPendingFile(e.target.files?.[0] ?? null);
  }

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Hợp đồng lao động
      </h3>

      {employee.contract_document ? (
        <button
          type="button"
          onClick={onViewContract}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
        >
          <Icon name="file-pdf" className="h-4 w-4" />
          Xem hợp đồng hiện tại ({employee.contract_document.file_name})
        </button>
      ) : (
        <p className="text-sm text-slate-400">Chưa có file hợp đồng đính kèm.</p>
      )}

      {canManage && (
        <div className="mt-3 space-y-3">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {uploadedAt && !error && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
              Đã tải lên hợp đồng lúc {new Date(uploadedAt).toLocaleTimeString("vi-VN")}.
            </p>
          )}

          <label
            htmlFor="contract_file"
            className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 hover:border-brand-400 hover:bg-brand-50/40"
          >
            <span className="truncate">
              {pendingFile ? pendingFile.name : "Chọn file hợp đồng lao động (PDF, tối đa 10MB)"}
            </span>
            <span className="shrink-0 font-medium text-brand-700">Chọn file</span>
          </label>
          <input
            id="contract_file"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {pendingFile && !employee.contract_document && (
            <Button
              type="button"
              onClick={() => mutation.mutate(false)}
              disabled={mutation.isPending}
            >
              <Icon name="upload" className="h-4 w-4" />
              {mutation.isPending ? "Đang tải lên..." : "Tải lên"}
            </Button>
          )}

          {pendingFile && employee.contract_document && (
            <div className="space-y-2 rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-800">
                Nhân viên này đã có hợp đồng. Chọn cách xử lý file mới:
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => mutation.mutate(false)}
                  disabled={mutation.isPending}
                >
                  Bổ sung (giữ file cũ)
                </Button>
                <Button
                  type="button"
                  onClick={() => mutation.mutate(true)}
                  disabled={mutation.isPending}
                >
                  Thay thế (xóa file cũ)
                </Button>
              </div>
              {mutation.isPending && <p className="text-xs text-amber-700">Đang xử lý...</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
