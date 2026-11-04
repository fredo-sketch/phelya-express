"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/format";

export default function ThemeToggle({ className, onDark = false }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      className={cn(
        "relative inline-flex h-9 w-[68px] shrink-0 items-center rounded-full p-1 transition",
        onDark ? "bg-white/15" : "bg-soft",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-1 flex size-7 items-center justify-center rounded-full bg-accent text-white shadow transition-all duration-300",
          dark ? "left-[36px]" : "left-1",
        )}
      >
        {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </span>
      <Sun className={cn("ml-2 size-4", onDark ? "text-white/70" : "text-muted", dark ? "opacity-60" : "opacity-0")} aria-hidden />
      <Moon className={cn("ml-auto mr-2 size-4", onDark ? "text-white/70" : "text-muted", dark ? "opacity-0" : "opacity-60")} aria-hidden />
    </button>
  );
}
