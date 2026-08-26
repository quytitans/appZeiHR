import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import { listEmployees } from "@/api/personnel";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { ContractViewerModal } from "@/features/personnel/components/ContractViewerModal";
import { EmployeeCardList } from "@/features/personnel/components/EmployeeCardList";
import { EmployeeFormModal } from "@/features/personnel/components/EmployeeFormModal";
import { EmployeeTable } from "@/features/personnel/components/EmployeeTable";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuthStore } from "@/store/authStore";
import type { Employee, SortBy, SortDir } from "@/types/personnel";

const MANAGE_ROLES = ["hr_admin", "system_admin"];

export function PersonnelPage() {
  const user = useAuthStore((state) => state.user);
  const canManage = !!user && MANAGE_ROLES.includes(user.role);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<SortBy>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contractEmployee, setContractEmployee] = useState<Employee | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["employees", { search: debouncedSearch, page, pageSize, sortBy, sortDir }],
    queryFn: () =>
      listEmployees({
        search: debouncedSearch || undefined,
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_dir: sortDir,
      }),
    enabled: !!user,
    placeholderData: (previous) => previous,
  });

  function handleSortChange(field: SortBy) {
    if (field === sortBy) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Icon name="personnel" className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-slate-900">Cần đăng nhập</h1>
          <p className="mt-2 text-sm text-slate-500">
            Bạn cần đăng nhập để xem và quản lý hồ sơ nhân sự.
          </p>
          <Link to="/login">
            <Button className="mt-6">Đăng nhập</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const employees = data?.items ?? [];

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hồ sơ nhân sự</h1>
            <p className="mt-1 text-sm text-slate-500">
              {data ? `${data.total} nhân viên` : "Đang tải danh sách nhân viên..."}
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Icon name="plus" className="h-4 w-4" />
              Thêm nhân viên
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="relative max-w-sm">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo mã NV, họ tên, email, CCCD..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          {isError && (
            <p className="px-4 py-6 text-center text-sm text-red-600">
              Không tải được danh sách nhân sự. Kiểm tra kết nối tới API backend.
            </p>
          )}

          {!isError && !isLoading && employees.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-slate-400">
              {debouncedSearch ? "Không tìm thấy nhân viên phù hợp." : "Chưa có nhân viên nào."}
            </p>
          )}

          {employees.length > 0 && (
            <>
              <EmployeeTable
                employees={employees}
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={handleSortChange}
                onViewContract={setContractEmployee}
              />
              <EmployeeCardList employees={employees} onViewContract={setContractEmployee} />
            </>
          )}

          {data && data.total > 0 && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={data.total}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </div>
      </div>

      {showCreateModal && (
        <EmployeeFormModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => setShowCreateModal(false)}
        />
      )}

      {contractEmployee && (
        <ContractViewerModal employee={contractEmployee} onClose={() => setContractEmployee(null)} />
      )}
    </PageShell>
  );
}
