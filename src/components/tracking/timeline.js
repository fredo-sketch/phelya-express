import { Check, CircleAlert, MapPin, X } from "lucide-react";
import { tanggalJam } from "@/lib/format";
import { cn } from "@/lib/format";

/**
 * Timeline riwayat pengiriman. Data diurutkan terbaru di atas.
 * Item terbaru disorot oranye (sedang berjalan), selesai = teal, gagal/batal = merah.
 */
export default function Timeline({ events, status }) {
  const final = status === "sampai";
  const merah = status === "gagal" || status === "dibatalkan";

  return (
    <ol className="relative" aria-label="Riwayat pengiriman">
      {events.map((e, i) => {
        const terbaru = i === 0;
        const Icon = terbaru ? (merah ? (status === "gagal" ? CircleAlert : X) : final ? Check : MapPin) : Check;
        const warna = terbaru
          ? merah
            ? "bg-danger text-white"
            : final
              ? "bg-primary text-white dark:text-[#1c1310]"
              : "bg-accent text-white"
          : "bg-primary text-white dark:text-[#1c1310]";
        return (
          <li key={e.waktu + e.judul} className="relative flex gap-4 pb-7 last:pb-0">
            {i < events.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 bg-line" aria-hidden />}
            <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full", warna)}>
              {terbaru && !final && !merah && <span className="absolute inset-0 rounded-full bg-accent animate-pulse-ring" aria-hidden />}
              <Icon className="relative size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <time className={cn("text-xs font-bold", terbaru ? (merah ? "text-danger" : "text-accent-deep") : "text-muted")} dateTime={e.waktu}>
                {tanggalJam(e.waktu)}
              </time>
              <p className={cn("mt-0.5 font-extrabold", terbaru ? "text-base" : "text-[15px]")}>{e.judul}</p>
              <p className="text-sm text-muted">
                {e.lokasi} · {e.deskripsi}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
