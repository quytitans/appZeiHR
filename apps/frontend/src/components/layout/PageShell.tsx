import type { ReactNode } from "react";

import { DevRoleSwitcher } from "@/components/layout/DevRoleSwitcher";
import { Header } from "@/components/layout/Header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400">
        {/* TẠM THỜI - xóa khi hoàn thiện app, xem DevRoleSwitcher.tsx */}
        <DevRoleSwitcher />
        Zei OXA v1.0 &middot; Nội bộ doanh nghiệp
      </footer>
    </div>
  );
}
