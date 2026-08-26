import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Zei Group HR &middot; Nội bộ doanh nghiệp
      </footer>
    </div>
  );
}
