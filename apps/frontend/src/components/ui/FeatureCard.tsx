import { Link } from "react-router-dom";

import { Icon, type IconName } from "@/components/ui/Icon";

interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
  to: string;
}

export function FeatureCard({ icon, title, description, to }: FeatureCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-100">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
        Truy cập
        <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
