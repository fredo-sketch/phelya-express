import { STATUS, BAYAR, TONE_CLASS } from "@/lib/status";
import { cn } from "@/lib/format";

export function Pill({ tone = "neutral", className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  const s = STATUS[status] ?? STATUS.menunggu_kurir;
  return (
    <Pill tone={s.tone} className={className}>
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {s.label}
    </Pill>
  );
}

export function BayarBadge({ bayar, className }) {
  const b = BAYAR[bayar] ?? BAYAR.menunggu;
  return (
    <Pill tone={b.tone === "teal" ? "info" : b.tone === "orange" ? "amber" : b.tone} className={className}>
      {b.label}
    </Pill>
  );
}

export function Eyebrow({ children, className }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full bg-primary-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary-strong",
        className,
      )}
    >
      {children}
    </span>
  );
}
