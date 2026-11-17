"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

/** Jendela pop-up di atas halaman (tidak pindah halaman). Tutup dengan Esc, klik latar, atau tombol X. */
export default function Modal({ judul, onClose, children, lebar = "max-w-md" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={judul}>
      <button className="absolute inset-0 bg-black/50" aria-label="Tutup" onClick={onClose} />
      <div className={cn("relative max-h-[92vh] w-full space-y-4 overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl", lebar)}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">{judul}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-soft">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
