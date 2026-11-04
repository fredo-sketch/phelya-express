import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/format";

/** Logo Phelya Express: ikon "PE" + wordmark. Wordmark berupa teks supaya ikut tema terang/gelap. */
export default function Logo({ size = "md", href = "/", className, stacked = false, onDark = false }) {
  const icon = size === "lg" ? 52 : size === "sm" ? 30 : 40;
  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", stacked && "flex-col gap-2", className)}>
      <Image src="/brand/logo-icon.png" alt="" width={icon} height={Math.round(icon * 0.97)} priority />
      <span className={cn("leading-none", stacked && "text-center")}>
        <span
          className={cn(
            "block font-black tracking-tight",
            size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl",
            onDark ? "text-white" : "text-primary-strong",
          )}
        >
          Phelya
        </span>
        <span
          className={cn(
            "mt-0.5 block font-extrabold uppercase tracking-[0.3em]",
            size === "sm" ? "text-[8px]" : "text-[10px]",
            onDark ? "text-accent-soft" : "text-accent",
          )}
        >
          Express
        </span>
      </span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} aria-label="Phelya Express, ke beranda">
      {inner}
    </Link>
  );
}
