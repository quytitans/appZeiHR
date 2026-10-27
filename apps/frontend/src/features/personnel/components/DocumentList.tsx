import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/format";
import { DOCUMENT_TYPE_LABELS, type EmployeeDocument } from "@/types/personnel";

interface DocumentListProps {
  documents: EmployeeDocument[];
  onSelect: (document: EmployeeDocument) => void;
  /** Có truyền thì hiện nút xóa (kèm bước xác nhận ngay trên dòng) */
  onDelete?: (document: EmployeeDocument) => void;
  deletingId?: number | null;
}

export function DocumentList({ documents, onSelect, onDelete, deletingId }: DocumentListProps) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  if (documents.length === 0) {
    return <p className="text-sm text-slate-400">Chưa có tài liệu đính kèm.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center gap-3 px-3 py-2.5">
          <button
            type="button"
            onClick={() => onSelect(doc)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon name="file-pdf" className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-slate-800 hover:text-brand-700 hover:underline">
                {doc.file_name}
              </span>
              <span className="block text-xs text-slate-500">
                {DOCUMENT_TYPE_LABELS[doc.doc_type] ?? doc.doc_type} · {formatDate(doc.uploaded_at)}
              </span>
            </span>
          </button>

          {onDelete &&
            (confirmingId === doc.id ? (
              <span className="flex shrink-0 items-center gap-2 text-xs">
                <span className="text-slate-500">Xóa?</span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingId(null);
                    onDelete(doc);
                  }}
                  className="font-medium text-red-600 hover:underline"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  className="text-slate-500 hover:underline"
                >
                  Hủy
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingId(doc.id)}
                disabled={deletingId === doc.id}
                className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label={`Xóa ${doc.file_name}`}
              >
                <Icon name={deletingId === doc.id ? "spinner" : "trash"} className="h-4 w-4" />
              </button>
            ))}
        </li>
      ))}
    </ul>
  );
}
