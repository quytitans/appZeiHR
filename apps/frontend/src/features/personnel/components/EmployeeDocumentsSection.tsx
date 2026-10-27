import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { deleteEmployeeDocument, uploadEmployeeDocument } from "@/api/personnel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DocumentList } from "@/features/personnel/components/DocumentList";
import { getErrorDetail } from "@/lib/errors";
import {
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
  type Employee,
  type EmployeeDocument,
} from "@/types/personnel";

interface EmployeeDocumentsSectionProps {
  employee: Employee;
  canManage: boolean;
  onViewDocument: (document: EmployeeDocument) => void;
}

export function EmployeeDocumentsSection({
  employee,
  canManage,
  onViewDocument,
}: EmployeeDocumentsSectionProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>("employment_contract");
  const [error, setError] = useState<string | null>(null);

  function applyUpdated(updated: Employee) {
    queryClient.setQueryData(["employee", employee.id], updated);
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    setError(null);
  }

  const uploadMutation = useMutation({
    mutationFn: () => uploadEmployeeDocument(employee.id, pendingFile!, docType),
    onSuccess: (updated) => {
      applyUpdated(updated);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => {
      setError(getErrorDetail(err) ?? "Không thể tải lên tài liệu. Vui lòng thử lại.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (doc: EmployeeDocument) => deleteEmployeeDocument(employee.id, doc.id),
    onSuccess: applyUpdated,
    onError: (err) => {
      setError(getErrorDetail(err) ?? "Không thể xóa tài liệu. Vui lòng thử lại.");
    },
  });

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Hợp đồng & tài liệu ({employee.documents.length})
      </h3>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <DocumentList
        documents={employee.documents}
        onSelect={onViewDocument}
        onDelete={canManage ? (doc) => deleteMutation.mutate(doc) : undefined}
        deletingId={deleteMutation.isPending ? deleteMutation.variables?.id : null}
      />

      {canManage && (
        <div className="mt-4 space-y-3">
          <label
            htmlFor="document_file"
            className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 hover:border-brand-400 hover:bg-brand-50/40"
          >
            <span className="truncate">
              {pendingFile ? pendingFile.name : "Chọn file tài liệu (PDF, tối đa 10MB)"}
            </span>
            <span className="shrink-0 font-medium text-brand-700">Chọn file</span>
          </label>
          <input
            ref={fileInputRef}
            id="document_file"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              setError(null);
              setPendingFile(e.target.files?.[0] ?? null);
            }}
          />

          {pendingFile && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                aria-label="Loại tài liệu"
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending}
              >
                <Icon name="upload" className="h-4 w-4" />
                {uploadMutation.isPending ? "Đang tải lên..." : "Tải lên"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
