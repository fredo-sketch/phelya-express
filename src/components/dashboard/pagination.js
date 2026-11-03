"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/format";

export default function Pagination({ page, total, onChange, label = "Halaman" }) {
  if (total <= 1) return null;
  const nomor = [];
  for (let i = 1; i <= total; i++) if (i === 1 || i === total || Math.abs(i - page) <= 1) nomor.push(i);
  const dengan = nomor.flatMap((n, i) => (i > 0 && n - nomor[i - 1] > 1 ? ["…" + n, n] : [n]));
  return (
    <nav aria-label={label} className="flex items-center justify-center gap-1.5">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Halaman sebelumnya" className="inline-flex size-9 items-center justify-center rounded-lg bg-soft disabled:opacity-40"><ChevronLeft className="size-4" /></button>
      {dengan.map((n) =>
        typeof n === "string" ? (
          <span key={n} className="px-1 text-muted">…</span>
        ) : (
          <button key={n} onClick={() => onChange(n)} aria-current={page === n ? "page" : undefined} className={cn("size-9 rounded-lg text-sm font-bold", page === n ? "bg-primary text-white dark:text-[#1c1310]" : "bg-soft hover:bg-accent-soft")}>{n}</button>
        ),
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === total} aria-label="Halaman berikutnya" className="inline-flex size-9 items-center justify-center rounded-lg bg-soft disabled:opacity-40"><ChevronRight className="size-4" /></button>
    </nav>
  );
}
