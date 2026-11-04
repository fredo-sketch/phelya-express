import Image from "next/image";
import { cn } from "@/lib/format";

// Ukuran asli tiap pose (px) supaya rasio gambar tidak penyok.
const POSE = {
  terbang: { w: 332, h: 287, alt: "Phely si merpati kurir sedang terbang membawa paket" },
  sapa: { w: 272, h: 301, alt: "Phely si merpati kurir melambaikan tangan" },
  semangat: { w: 276, h: 302, alt: "Phely si merpati kurir penuh semangat" },
  jalan: { w: 268, h: 298, alt: "Phely si merpati kurir berjalan membawa papan catatan" },
  santai: { w: 266, h: 302, alt: "Phely si merpati kurir berdiri santai" },
  paket: { w: 265, h: 302, alt: "Phely si merpati kurir memegang paket" },
  antar: { w: 269, h: 295, alt: "Phely si merpati kurir siap mengantar paket" },
  sukses: { w: 266, h: 297, alt: "Phely si merpati kurir tersenyum membawa paket" },
  hormat: { w: 261, h: 300, alt: "Phely si merpati kurir memberi hormat" },
};

/**
 * Maskot Phely. `height` dalam px; lebar mengikuti rasio pose.
 * Gunakan `float` untuk animasi melayang halus.
 */
export default function Mascot({ pose = "sapa", height = 180, float = false, priority = false, className }) {
  const p = POSE[pose] ?? POSE.sapa;
  const width = Math.round((p.w / p.h) * height);
  return (
    <Image
      src={`/mascot/phely-${pose}.png`}
      alt={p.alt}
      width={width}
      height={height}
      priority={priority}
      className={cn("select-none object-contain drop-shadow-[0_10px_14px_rgba(62,41,34,0.18)]", float && "animate-float", className)}
      style={{ width, height }}
    />
  );
}
