import { useCallback, useState } from "react";

import { resolveFileUrl } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { DocumentList } from "@/features/personnel/components/DocumentList";
import { DOCUMENT_TYPE_LABELS, type Employee, type EmployeeDocument } from "@/types/personnel";

interface EmployeeDocumentsModalProps {
  employee: Employee;
  /** Mở thẳng vào xem 1 tài liệu; bỏ trống thì mở danh sách tài liệu */
  initialDocument?: EmployeeDocument | null;
  onClose: () => void;
}

export function EmployeeDocumentsModal({
  employee,
  initialDocument = null,
  onClose,
}: EmployeeDocumentsModalProps) {
  const [selected, setSelected] = useState<EmployeeDocument | null>(initialDocument);
  const fileUrl = selected ? resolveFileUrl(selected.file_url) : null;
  // Mở từ danh sách tài liệu -> đóng bản xem chi tiết thì quay lại danh sách, không đóng hẳn
  const backToList = initialDocument === null && selected !== null;

  const handleClose = useCallback(() => {
    if (backToList) setSelected(null);
    else onClose();
  }, [backToList, onClose]);

  return (
    <Modal
      title={`Tài liệu - ${employee.full_name}`}
      onClose={handleClose}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {backToList ? "Quay lại danh sách" : "Đóng"}
          </Button>
          {selected && fileUrl && (
            <a href={fileUrl} download={selected.file_name}>
              <Button variant="primary">
                <Icon name="download" className="h-4 w-4" />
                Tải xuống
              </Button>
            </a>
          )}
        </>
      }
    >
      {selected && fileUrl ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              <Icon name="chevron-left" className="h-4 w-4" />
              Danh sách ({employee.documents.length})
            </button>
            <span className="min-w-0 truncate text-sm text-slate-600">
              {DOCUMENT_TYPE_LABELS[selected.doc_type] ?? selected.doc_type}: {selected.file_name}
            </span>
          </div>
          <div className="h-[65vh] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <iframe src={fileUrl} title={selected.file_name} className="h-full w-full" />
          </div>
        </div>
      ) : (
        <DocumentList documents={employee.documents} onSelect={setSelected} />
      )}
    </Modal>
  );
}
