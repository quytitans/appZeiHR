import { ContractDocumentLink } from "@/features/personnel/components/ContractDocumentLink";
import { EmployeeAvatar } from "@/features/personnel/components/EmployeeAvatar";
import { StatusBadge } from "@/features/personnel/components/StatusBadge";
import type { Employee } from "@/types/personnel";

interface EmployeeCardListProps {
  employees: Employee[];
  onViewContract: (employee: Employee) => void;
}

export function EmployeeCardList({ employees, onViewContract }: EmployeeCardListProps) {
  return (
    <div className="divide-y divide-slate-100 md:hidden">
      {employees.map((employee) => (
        <div key={employee.id} className="flex gap-3 px-4 py-3.5">
          <EmployeeAvatar fullName={employee.full_name} sizeRem={2.5} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {employee.full_name}
                </p>
                <p className="text-xs text-slate-500">{employee.employee_code}</p>
              </div>
              <StatusBadge status={employee.status} />
            </div>
            <dl className="mt-2 space-y-1 text-xs text-slate-500">
              {employee.company_email && <dd className="truncate">{employee.company_email}</dd>}
              {employee.phone && <dd>{employee.phone}</dd>}
              {employee.department?.name && <dd>{employee.department.name}</dd>}
            </dl>
            <div className="mt-2">
              <ContractDocumentLink employee={employee} onView={onViewContract} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
