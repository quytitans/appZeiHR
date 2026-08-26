import { PageShell } from "@/components/layout/PageShell";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { MODULES } from "@/config/modules";

export function HomePage() {
  return (
    <PageShell>
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
            Zei Group HR
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Quản lý nhân sự tập trung, gọn nhẹ và trực quan
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            Hồ sơ nhân sự, hợp đồng lao động, phúc lợi và chấm công &ndash; nghỉ phép trong một hệ
            thống duy nhất, truy cập mượt mà trên mọi thiết bị.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Chức năng chính</h2>
          <span className="text-sm text-slate-400">{MODULES.length} phân hệ</span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => (
            <FeatureCard
              key={mod.key}
              icon={mod.icon}
              title={mod.title}
              description={mod.description}
              to={mod.path}
            />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
