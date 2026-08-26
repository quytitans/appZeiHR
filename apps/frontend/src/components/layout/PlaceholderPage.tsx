import { Link } from "react-router-dom";

import { PageShell } from "@/components/layout/PageShell";
import { Icon, type IconName } from "@/components/ui/Icon";

interface PlaceholderPageProps {
  icon: IconName;
  title: string;
  description: string;
}

export function PlaceholderPage({ icon, title, description }: PlaceholderPageProps) {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon name={icon} className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 max-w-md text-sm text-slate-500">{description}</p>
        <span className="mt-6 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          Đang được triển khai chi tiết
        </span>
        <Link
          to="/"
          className="mt-8 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
        >
          ← Quay lại trang chủ
        </Link>
      </div>
    </PageShell>
  );
}
