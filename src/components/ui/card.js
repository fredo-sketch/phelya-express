import { cn } from "@/lib/format";

export function Card({ className, as: Tag = "div", children, ...props }) {
  return (
    <Tag
      className={cn("rounded-2xl border border-line bg-surface shadow-card", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = "center", className }) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full bg-primary-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary-strong">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-extrabold leading-tight text-balance md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
    </div>
  );
}
