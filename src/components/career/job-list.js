"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, CalendarDays, ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import EmptyState from "@/components/ui/empty-state";
import { KATEGORI_LOWONGAN, LOWONGAN } from "@/data/mock";
import { tanggal, cn } from "@/lib/format";

const PER_HALAMAN = 4;

export default function JobList() {
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("Semua Posisi");
  const [hal, setHal] = useState(1);

  const hasil = useMemo(
    () =>
      LOWONGAN.filter((l) => (kat === "Semua Posisi" || l.kategori === kat) && `${l.judul} ${l.lokasi}`.toLowerCase().includes(q.toLowerCase())),
    [q, kat],
  );
  const total = Math.max(1, Math.ceil(hasil.length / PER_HALAMAN));
  const aktif = Math.min(hal, total);
  const tampil = hasil.slice((aktif - 1) * PER_HALAMAN, aktif * PER_HALAMAN);

  return (
    <section id="lowongan" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">Lowongan Pekerjaan Terbaru</h2>
          <p className="mt-1 text-muted">Cek posisi yang tersedia serta sesuai dengan minat dan keahlianmu.</p>
        </div>
        <Pill tone="amber">Menampilkan {tampil.length} dari {hasil.length} posisi</Pill>
      </div>

      <div className="mt-6 max-w-md">
        <Input icon={Search} value={q} onChange={(e) => { setQ(e.target.value); setHal(1); }} placeholder="Cari posisi atau lokasi" aria-label="Cari lowongan" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
        {KATEGORI_LOWONGAN.map((k) => {
          const n = k === "Semua Posisi" ? LOWONGAN.length : LOWONGAN.filter((l) => l.kategori === k).length;
          return (
            <button key={k} onClick={() => { setKat(k); setHal(1); }} aria-pressed={kat === k} className={cn("rounded-full px-4 py-2 text-sm font-bold transition", kat === k ? "bg-accent-deep text-white" : "bg-soft text-fg hover:bg-accent-soft")}>
              {k} <span className="opacity-70">({n})</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {tampil.length === 0 ? (
          <EmptyState pose="santai" title="Belum ada lowongan yang cocok" description="Coba ubah kata kunci atau pilih kategori lain." />
        ) : (
          tampil.map((l) => (
            <Card key={l.slug} className={cn("relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between", l.urgent && "border-2 border-accent")}>
              {l.urgent && <span className="absolute right-0 top-0 rounded-bl-xl rounded-tr-2xl bg-accent-deep px-3 py-1 text-[11px] font-extrabold text-white">Cepat Dibutuhkan</span>}
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-deep"><Briefcase className="size-6" aria-hidden /></span>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone="info" className="uppercase">{l.divisi}</Pill>
                    <Pill tone="amber" className="uppercase">{l.tipe}</Pill>
                  </div>
                  <h3 className="mt-2 text-lg font-extrabold">{l.judul}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden />{l.lokasi}</span>
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden />Batas: {tanggal(l.batas)}</span>
                  </p>
                </div>
              </div>
              <Button href={`/karier/${l.slug}`} variant={l.urgent ? "teal" : "secondary"} size="sm" className="shrink-0">
                {l.urgent ? "Lihat Detail & Lamar" : "Lihat Detail"}
              </Button>
            </Card>
          ))
        )}
      </div>

      {total > 1 && (
        <nav aria-label="Halaman lowongan" className="mt-8 flex items-center justify-center gap-2">
          <button onClick={() => setHal(aktif - 1)} disabled={aktif === 1} aria-label="Halaman sebelumnya" className="inline-flex size-10 items-center justify-center rounded-full bg-soft disabled:opacity-40"><ChevronLeft className="size-4" /></button>
          {Array.from({ length: total }, (_, i) => (
            <button key={i} onClick={() => setHal(i + 1)} aria-current={aktif === i + 1 ? "page" : undefined} className={cn("size-10 rounded-full text-sm font-bold", aktif === i + 1 ? "bg-primary text-white dark:text-[#1c1310]" : "bg-soft")}>{i + 1}</button>
          ))}
          <button onClick={() => setHal(aktif + 1)} disabled={aktif === total} aria-label="Halaman berikutnya" className="inline-flex size-10 items-center justify-center rounded-full bg-soft disabled:opacity-40"><ChevronRight className="size-4" /></button>
        </nav>
      )}
      <p className="mt-6 text-center text-sm text-muted">Tidak menemukan posisi yang cocok? <Link href="/bantuan" className="font-bold text-primary underline">Hubungi kami</Link>.</p>
    </section>
  );
}
