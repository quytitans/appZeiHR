import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/store/authStore";
import { ROLE_LABELS } from "@/types/auth";

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Icon name="logo" className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Zei Group HR</p>
            <p className="text-xs text-slate-500">Quản lý Nhân sự</p>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.email}</p>
              <p className="text-xs text-brand-700">{ROLE_LABELS[user.role]}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Đăng xuất
            </Button>
          </div>
        ) : (
          <Button onClick={() => navigate("/login")}>Đăng nhập</Button>
        )}
      </div>
    </header>
  );
}
