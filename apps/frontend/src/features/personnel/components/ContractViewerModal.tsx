import { resolveFileUrl } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import type { Employee } from "@/types/personnel";

interface ContractViewerModalProps {
  employee: Employee;
  onClose: () => void;
}

export function ContractViewerModal({ employee, onClose }: ContractViewerModalProps) {
  const contractDoc = employee.contract_document;
  if (!contractDoc) return null;

  const fileUrl = resolveFileUrl(contractDoc.file_url);

  return (
    <Modal
      title={`Hợp đồng lao động - ${employee.full_name}`}
      onClose={onClose}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <a href={fileUrl} download={contractDoc.file_name}>
            <Button variant="primary">
              <Icon name="download" className="h-4 w-4" />
              Tải xuống
            </Button>
          </a>
        </>
      }
    >
      <div className="h-[70vh] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <iframe src={fileUrl} title={contractDoc.file_name} className="h-full w-full" />
      </div>
    </Modal>
  );
}
