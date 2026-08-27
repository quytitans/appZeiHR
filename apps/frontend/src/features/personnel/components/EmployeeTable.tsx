import { Link } from "react-router-dom";

import { Icon } from "@/components/ui/Icon";
import { ContractDocumentLink } from "@/features/personnel/components/ContractDocumentLink";
import { EmployeeAvatar } from "@/features/personnel/components/EmployeeAvatar";
import { StatusBadge } from "@/features/personnel/components/StatusBadge";
import type { Employee, SortBy, SortDir } from "@/types/personnel";

interface EmployeeTableProps {
  employees: Employee[];
  sortBy: SortBy;
  sortDir: SortDir;
  onSortChange: (sortBy: SortBy) => void;
  onViewContract: (employee: Employee) => void;
}

function SortHeader({
  label,
  field,
  sortBy,
  sortDir,
  onSortChange,
}: {
  label: string;
  field: SortBy;
  sortBy: SortBy;
  sortDir: SortDir;
  onSortChange: (field: SortBy) => void;
}) {
  const active = sortBy === field;
  return (
    <button
      type="button"
      onClick={() => onSortChange(field)}
      className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${
        active ? "text-brand-700" : "text-slate-500"
      }`}
    >
      {label}
      <Icon
        name="sort"
        className={`h-3.5 w-3.5 transition-transform ${active && sortDir === "desc" ? "rotate-180" : ""}`}
      />
    </button>
  );
}

export function EmployeeTable({
  employees,
  sortBy,
  sortDir,
  onSortChange,
  onViewContract,
}: EmployeeTableProps) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60">
            <th className="px-4 py-3 font-medium" />
            <th className="px-4 py-3">
              <SortHeader
                label="Họ tên"
                field="full_name"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={onSortChange}
              />
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mã NV
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Điện thoại
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phòng ban
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Hợp đồng
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.map((employee) => (
            <tr key={employee.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <EmployeeAvatar fullName={employee.full_name} />
              </td>
              <td className="px-4 py-3 font-medium">
                <Link
                  to={`/personnel/${employee.id}`}
                  className="text-brand-700 hover:text-brand-800 hover:underline"
                >
                  {employee.full_name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-500">{employee.employee_code}</td>
              <td className="px-4 py-3 text-slate-500">{employee.company_email ?? "—"}</td>
              <td className="px-4 py-3 text-slate-500">{employee.phone ?? "—"}</td>
              <td className="px-4 py-3 text-slate-500">{employee.department?.name ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={employee.status} />
              </td>
              <td className="px-4 py-3">
                <ContractDocumentLink employee={employee} onView={onViewContract} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
