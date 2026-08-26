import { Icon } from "@/components/ui/Icon";
import type { Employee } from "@/types/personnel";

interface ContractDocumentLinkProps {
  employee: Employee;
  onView: (employee: Employee) => void;
}

export function ContractDocumentLink({ employee, onView }: ContractDocumentLinkProps) {
  if (!employee.contract_document) {
    return <span className="text-sm text-slate-300">—</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onView(employee)}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
    >
      <Icon name="file-pdf" className="h-4 w-4" />
      Xem hợp đồng
    </button>
  );
}
