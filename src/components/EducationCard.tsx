import type { ReactNode } from "react";

interface EducationCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  iconBg?: string;
  children: ReactNode;
}

export default function EducationCard({ icon, title, subtitle, iconBg, children }: EducationCardProps) {
  return (
    <article className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
      <div className="flex items-start gap-3">
        <div className={`${iconBg ?? "bg-sky-500/10"} p-2.5 rounded-lg shrink-0`}>
          {icon}
        </div>
        <div>
          <h3 className="text-slate-100 font-semibold text-base">{title}</h3>
          <p className="text-sm text-sky-400">{subtitle}</p>
        </div>
      </div>
      <div className="text-sm text-slate-300 leading-relaxed space-y-2">
        {children}
      </div>
    </article>
  );
}
