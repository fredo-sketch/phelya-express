"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, Calculator, TriangleAlert, Phone } from "lucide-react";
import Button from "@/components/ui/button";
import Mascot from "@/components/ui/mascot";
import { cn } from "@/lib/format";

const SLIDES = [
  {
    id: "utama",
    bg: "from-[#3e2922] via-[#0a5a5e] to-[#01757A]",
    pose: "terbang",
    chip: "Ekspedisi terpercaya seluruh nusantara",
    judul: "Kirim Paket Cepat, Sampai dengan Selamat",
    sub: "Dari pintu ke pintu, bisa kamu pantau kapan saja dengan akurasi tinggi dan sentuhan hangat kurir ramah kami.",
    cta: [
      { label: "Jelajahi Layanan", href: "/layanan", variant: "primary", icon: ArrowRight },
      { label: "Simulasi Ongkir", href: "/cek-tarif", variant: "glass", icon: Calculator },
    ],
  },
  {
    id: "promo",
    bg: "from-[#9a4511] via-[#e57734] to-[#f2a65a]",
    pose: "paket",
    chip: "Promo pengguna baru",
    judul: "Diskon 20% untuk pengiriman pertamamu",
    sub: "Gunakan kode PHELYAHEMAT saat membuat pesanan pertama. Berlaku untuk semua layanan Reguler dan Kilat.",
    cta: [{ label: "Daftar & Klaim Promo", href: "/daftar", variant: "dark", icon: ArrowRight }],
  },
  {
    id: "waspada",
    bg: "from-[#241814] via-[#3e2922] to-[#5d3a2a]",
    pose: "hormat",
    chip: "Waspada penipuan",
    judul: "Phelya Express tidak pernah meminta transfer atau scan QR lewat chat",
    sub: "Jika ada pihak yang mengaku dari Phelya dan meminta data atau pembayaran di luar aplikasi, abaikan dan laporkan.",
    cta: [{ label: "Hubungi CS: 021-3020-5050", href: "/bantuan#penipuan", variant: "glass", icon: Phone }],
    warning: true,
  },
];

const BTN = {
  glass: "border-2 border-white/70 bg-white/10 text-white backdrop-blur hover:bg-white/20",
  dark: "bg-[#3e2922] text-white hover:bg-black",
};

export default function Hero() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  const go = useCallback((n) => setIdx((i) => (i + n + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => go(1), 7000);
    return () => clearInterval(t);
  }, [paused, reduce, go]);

  const s = SLIDES[idx];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promo dan informasi Phelya Express"
      className="relative overflow-hidden text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={s.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.45 }}
          className={cn("route-pattern relative bg-linear-to-br", s.bg)}
        >
          {/* garis rute dekoratif */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-60" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden>
            <path
              d="M-20 520 C 250 380, 380 560, 620 380 S 980 120, 1240 160"
              fill="none"
              stroke="rgba(255,255,255,.5)"
              strokeWidth="3"
              strokeDasharray="10 14"
              strokeLinecap="round"
              className="animate-dash"
            />
            <circle cx="620" cy="380" r="9" fill="#f8ebcf" />
            <circle cx="1020" cy="190" r="13" fill="#e57734" />
            <circle cx="1020" cy="190" r="26" fill="none" stroke="#e57734" strokeOpacity=".5" strokeWidth="3" />
          </svg>

          <div className="mx-auto grid max-w-7xl items-center gap-4 px-4 pb-48 pt-12 sm:px-6 md:min-h-[560px] md:grid-cols-[1.15fr_0.85fr] md:pb-60 md:pt-16">
            <div className="relative z-10">
              <motion.span
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] backdrop-blur"
              >
                {s.warning ? <TriangleAlert className="size-3.5 text-[#ffd27a]" aria-hidden /> : <span className="size-2 rounded-full bg-accent" aria-hidden />}
                {s.chip}
              </motion.span>
              <motion.h1
                initial={{ y: 22, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.18 }}
                className="max-w-2xl text-4xl font-black leading-[1.1] text-balance sm:text-5xl lg:text-6xl"
              >
                {s.judul}
              </motion.h1>
              <motion.p
                initial={{ y: 22, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.26 }}
                className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
              >
                {s.sub}
              </motion.p>
              <motion.div
                initial={{ y: 22, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.34 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {s.cta.map((c) => (
                  <Button
                    key={c.label}
                    href={c.href}
                    size="lg"
                    variant={c.variant === "primary" ? "primary" : "ghost"}
                    iconRight={c.icon}
                    className={cn(BTN[c.variant])}
                  >
                    {c.label}
                  </Button>
                ))}
              </motion.div>
            </div>

            <div className="relative z-10 hidden justify-center md:flex">
              <div className="absolute inset-x-6 bottom-2 top-8 rounded-[40%] bg-white/10 blur-2xl" aria-hidden />
              <motion.div
                initial={{ scale: 0.85, opacity: 0, rotate: -6 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.2 }}
              >
                <Mascot pose={s.pose} height={340} float priority />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* kontrol carousel */}
      <div className="absolute inset-x-0 bottom-36 z-20 mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 md:bottom-44">
        <button
          onClick={() => go(-1)}
          aria-label="Slide sebelumnya"
          className="inline-flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2" role="tablist" aria-label="Pilih slide">
          {SLIDES.map((sl, i) => (
            <button
              key={sl.id}
              role="tab"
              aria-selected={i === idx}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={cn("h-2 rounded-full transition-all", i === idx ? "w-9 bg-accent" : "w-2 bg-white/50 hover:bg-white/80")}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          aria-label="Slide berikutnya"
          className="inline-flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </section>
  );
}
