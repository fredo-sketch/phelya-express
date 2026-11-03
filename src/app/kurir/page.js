"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, CircleCheck, ClipboardList, Navigation, Phone, Rocket, Store, Truck, MapPin, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge, Pill } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { CopyResi } from "@/components/tracking/resi-actions";
import { useOrders } from "@/components/order-store";
import { useToast } from "@/components/ui/toast";
import { KURIR_AKTIF_ID, getKurir } from "@/data/mock";
import { LAYANAN, kotaById } from "@/lib/tariff";
import { NEXT_ACTION } from "@/lib/status";
import { cn, jam } from "@/lib/format";

const FILTER = [
  ["semua", "Semua"],
  ["diambil", "Siap Jemput"],
  ["dalam_perjalanan", "Sedang Antar"],
  ["sampai", "Selesai"],
];

function StatMini({ label, value, unit, icon: Icon, hi }) {
  return (
    <div className={cn("rounded-2xl border p-4", hi ? "border-accent bg-accent-soft/50" : "border-line bg-surface")}>
      <div className="flex items-center justify-between text-sm font-semibold text-muted">{label}<Icon className="size-4" aria-hidden /></div>
      <p className="mt-2 text-3xl font-black">{value} <span className="text-sm font-bold text-muted">{unit}</span></p>
    </div>
  );
}

export default function TugasKurir() {
  const { orders, ubahStatus } = useOrders();
  const { toast } = useToast();
  const kurir = getKurir(KURIR_AKTIF_ID);
  const [filter, setFilter] = useState("semua");
  const [busy, setBusy] = useState(null);

  const tugas = useMemo(() => orders.filter((o) => o.kurirId === KURIR_AKTIF_ID && o.status !== "dibatalkan"), [orders]);
  const hitung = (s) => tugas.filter((o) => o.status === s).length;
  const tampil = tugas.filter((o) => filter === "semua" || o.status === filter);
  const aktifCount = tugas.filter((o) => o.status !== "sampai").length;

  async function mulaiAntar(o) {
    if (busy) return;
    setBusy(o.resi);
    await new Promise((r) => setTimeout(r, 600));
    const h = ubahStatus(o.resi, "dalam_perjalanan", { lokasi: kotaById(o.pengirim.kota)?.nama, deskripsi: "Kurir mulai mengantar paket ke penerima." });
    setBusy(null);
    toast(h.ok ? { type: "success", title: "Status diperbarui", description: `${o.resi} sedang diantar.` } : { type: "error", title: "Gagal memperbarui", description: h.error });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-3xl bg-linear-to-br from-accent-soft to-soft p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-accent-deep">Kurir tangguh Phelya</p>
          <Pill tone="neutral">{kurir.hub}</Pill>
        </div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">Semangat Pagi, {kurir.nama.split(" ")[0]}! 🛵</h1>
        <p className="mt-1 text-muted">Tugas antar hari ini: <b className="text-accent-deep">{aktifCount} paket</b> menanti diantarkan amanah.</p>
      </section>

      <section aria-label="Ringkasan tugas" className="grid grid-cols-2 gap-3">
        <StatMini label="Ditugaskan" value={tugas.length} unit="Paket" icon={ClipboardList} />
        <StatMini label="Diambil" value={hitung("diambil")} unit="Paket" icon={Archive} />
        <StatMini label="Dalam Perjalanan" value={hitung("dalam_perjalanan")} unit="Antar" icon={Truck} hi />
        <StatMini label="Selesai" value={hitung("sampai")} unit="Terkirim" icon={CircleCheck} />
      </section>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter tugas">
        {FILTER.map(([k, l]) => {
          const n = k === "semua" ? tugas.length : hitung(k);
          return (
            <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k} className={cn("shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition", filter === k ? "bg-accent-deep text-white" : "bg-soft text-fg")}>
              {l} ({n})
            </button>
          );
        })}
      </div>

      {tampil.length === 0 ? (
        <Card><EmptyState pose="santai" title="Belum ada tugas" description="Tugas baru dari admin akan muncul di sini." /></Card>
      ) : (
        <ul className="space-y-4">
          {tampil.map((o) => {
            const selesai = o.status === "sampai";
            const aksi = NEXT_ACTION[o.status];
            const toko = o.status === "diambil";
            const target = toko ? o.pengirim : o.penerima;
            if (selesai)
              return (
                <li key={o.resi}>
                  <Card className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="info">✓ Selesai</Pill>
                      <Pill tone="neutral">{LAYANAN[o.layanan].nama.replace("Phelya ", "PEX-")} ({o.barang.berat} kg)</Pill>
                      <span className="ml-auto text-xs text-muted">{jam(o.timeline[0].waktu)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="font-mono text-sm font-bold">NO. RESI {o.resi}</p>
                      <Pill tone="info">Diterima penerima</Pill>
                    </div>
                    <p className="mt-2 text-lg font-extrabold">{o.penerima.nama}</p>
                    <p className="text-sm text-muted">Diterima oleh {o.diterimaOleh ?? "yang bersangkutan"}</p>
                  </Card>
                </li>
              );
            return (
              <li key={o.resi}>
                <Card className={cn("p-4 sm:p-5", o.status === "dalam_perjalanan" && "border-2 border-accent")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={o.status} />
                    <Pill tone="info">{LAYANAN[o.layanan].nama} ({o.barang.berat} kg)</Pill>
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-accent-deep"><Navigation className="size-3.5" aria-hidden />{(1 + (o.resi.charCodeAt(12) % 9) / 3).toFixed(1)} km lagi</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className="text-xs font-bold uppercase text-muted">No. Resi</span>
                    <b className="font-mono text-lg">{o.resi}</b>
                    <CopyResi resi={o.resi} />
                  </div>
                  <div className="mt-4 flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-deep">{toko ? <Store className="size-5" /> : <MapPin className="size-5" />}</span>
                    <div>
                      <p className="text-lg font-extrabold">{target.nama}</p>
                      <p className="text-sm text-muted">{target.alamat}</p>
                      {o.status === "dalam_perjalanan" && <p className="mt-2 rounded-lg bg-accent-soft/60 px-3 py-2 text-xs font-semibold text-accent-deep">📌 Catatan: titip ke satpam jika tidak ada orang.</p>}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <a href={`tel:${target.hp}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-soft font-bold"><Phone className="size-4" aria-hidden />{toko ? "Hubungi Toko" : "Telepon"}</a>
                    <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(target.alamat)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white dark:text-[#1c1310]"><Navigation className="size-4" aria-hidden />Navigasi</a>
                  </div>
                  {o.status === "diambil" ? (
                    <Button size="lg" icon={Rocket} className="mt-3 w-full" loading={busy === o.resi} onClick={() => mulaiAntar(o)}>{aksi?.label}</Button>
                  ) : (
                    <Button href={`/kurir/tugas/${o.resi}`} size="lg" variant="teal" className="mt-3 w-full">{o.status === "gagal" ? "Lihat & Coba Lagi" : "Konfirmasi Sampai & Serah Terima"}</Button>
                  )}
                  <Link href={`/kurir/tugas/${o.resi}`} className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-primary"><Package className="size-4" aria-hidden />Detail paket</Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
