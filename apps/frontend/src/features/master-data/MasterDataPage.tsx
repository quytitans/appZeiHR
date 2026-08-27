import { Link } from "react-router-dom";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DepartmentSection } from "@/features/master-data/components/DepartmentSection";
import { PositionSection } from "@/features/master-data/components/PositionSection";
import { useAuthStore } from "@/store/authStore";

const MANAGE_ROLES = ["hr_admin", "system_admin"];

export function MasterDataPage() {
  const user = useAuthStore((state) => state.user);
  const canManage = !!user && MANAGE_ROLES.includes(user.role);

  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <h1 className="text-xl font-bold text-slate-900">Cần đăng nhập</h1>
          <Link to="/login">
            <Button className="mt-6">Đăng nhập</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  if (!canManage) {
    return (
      <PageShell>
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Icon name="database" className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-slate-900">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm text-slate-500">
            Chỉ Quản trị nhân sự (HR Admin) và Quản trị hệ thống (System Admin) được quản lý dữ
            liệu nền tảng (Master Data).
          </p>
          <Link to="/">
            <Button variant="secondary" className="mt-6">
              Về trang chủ
            </Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Master Data</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý dữ liệu nền tảng dùng chung cho toàn hệ thống (phòng ban, chức vụ...). Các
            form khác (vd thêm nhân viên) sẽ tự động lấy dropdown từ dữ liệu này.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DepartmentSection />
          <PositionSection />
        </div>
      </div>
    </PageShell>
  );
}
