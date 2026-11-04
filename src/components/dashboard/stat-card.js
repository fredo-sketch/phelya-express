import { cn } from "@/lib/format";

export default function StatCard({ label, value, unit, icon: Icon, foot, tone = "orange", className }) {
  const toneCls = {
    orange: "bg-accent-soft text-accent-deep",
    teal: "bg-primary-soft text-primary",
    red: "bg-danger-soft text-danger",
    neutral: "bg-soft text-muted",
  }[tone];
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5 shadow-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-muted">{label}</p>
        {Icon && (
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", toneCls)}>
            <Icon className="size-5" aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-black">
        {value} {unit && <span className="text-base font-bold text-muted">{unit}</span>}
      </p>
      {foot && <p className="mt-2 text-xs font-bold text-primary">{foot}</p>}
    </div>
  );
}
