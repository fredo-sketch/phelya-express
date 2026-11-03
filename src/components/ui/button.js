import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/format";

const VARIANT = {
  primary:
    "bg-accent text-white shadow-[0_6px_16px_-6px_var(--accent)] hover:bg-accent-strong active:translate-y-px",
  secondary:
    "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white dark:hover:text-[#1c1310]",
  soft: "bg-soft text-fg hover:bg-accent-soft",
  ghost: "text-fg hover:bg-soft",
  danger: "bg-danger text-white hover:opacity-90",
  teal: "bg-primary text-white hover:bg-primary-strong dark:text-[#1c1310]",
};

const SIZE = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-7 text-base",
};

/**
 * Tombol serbaguna. Jika `href` diberikan, dirender sebagai <Link>.
 * `loading` mematikan klik ganda saat form sedang dikirim.
 */
export default function Button({
  variant = "primary",
  size = "md",
  href,
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  type = "button",
  ...props
}) {
  const cls = cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-full font-bold transition",
    "disabled:cursor-not-allowed disabled:opacity-60",
    VARIANT[variant],
    SIZE[size],
    className,
  );
  const content = (
    <>
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : Icon && <Icon className="size-4" aria-hidden />}
      {children}
      {!loading && IconRight && <IconRight className="size-4" aria-hidden />}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={cls} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}
