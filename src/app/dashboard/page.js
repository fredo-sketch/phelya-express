"use client";

import Link from "next/link";
import { Archive, CircleCheck, CircleX, Truck, ArrowRight, MapPin, RefreshCw } from "lucide-react";
import StatCard from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { StatusBadge, Pill } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Mascot from "@/components/ui/mascot";
import { CopyResi } from "@/components/tracking/resi-actions";
import TrackMapLoader from "@/components/tracking/track-map-loader";
import { useOrders } from "@/components/order-store";
import { PELANGGAN_AKTIF, getKurir } from "@/data/mock";
import { kotaById, LAYANAN } from "@/lib/tariff";
import { STATUS } from "@/lib/status";
import { jam } from "@/lib/format";

export default function Ringkasan() {
  const { orders } = useOrders();
  const saya = orders.filter((o) => o.ownerId === PELANGGAN_AKTIF.id);
  const hitung = (s) => saya.filter((o) => o.status === s).length;
  const jalan = saya.filter((o) => ["menunggu_kurir", "diambil", "dalam_perjalanan"].includes(o.status));
  const aktif = saya.find((o) => o.status === "dalam_perjalanan") ?? saya.find((o) => o.status === "diambil");
  const kurir = aktif && getKurir(aktif.kurirId);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-accent-soft to-soft p-6 sm:p-8">
        <Pill tone="amber">● Layanan penjemputan aktif</Pill>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Halo, {PELANGGAN_AKTIF.nama}! 👋</h1>
        <p className="mt-2 max-w-md text-muted">
          Paketmu sedang meluncur dengan aman dan terpercaya bersama Phelya Express. Ada {jalan.length} paket yang sedang diproses hari ini.
        </p>
        <div className="pointer-events-none absolute -bottom-3 right-4 hidden sm:block md:right-12">
          <Mascot pose="sapa" height={170} float />
        </div>
      </section>

      <section aria-label="Statistik" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Pesanan" value={saya.length} unit="Paket" icon={Archive} foot="↗ +12% dari bulan lalu" />
        <StatCard label="Dalam Perjalanan" value={hitung("dalam_perjalanan") + hitung("diambil")} unit="Paket" icon={Truck} foot="● Perlu dipantau" />
        <StatCard label="Sampai Tujuan" value={hitung("sampai")} unit="Paket" icon={CircleCheck} tone="teal" foot="✓ Tepat waktu" />
        <StatCard label="Dibatalkan" value={hitung("dibatalkan")} unit="Paket" icon={CircleX} tone="red" foot="Batal oleh pengirim" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="terkini">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="terkini" className="text-xl font-black">Pesanan Terkini</h2>
              <p className="text-sm text-muted">Pantau pergerakan kurir dan estimasi tiba.</p>
            </div>
            <Link href="/dashboard/pesanan" className="text-sm font-bold text-primary hover:text-accent">
              Lihat Semua ({saya.length}) →
            </Link>
          </div>
          <div className="space-y-4">
            {saya.slice(0, 3).map((o) => {
              const prog = (STATUS[o.status].step / 3) * 100;
              return (
                <Card key={o.resi} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-lg font-black">{o.resi}</span>
                        <CopyResi resi={o.resi} />
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {kotaById(o.pengirim.kota)?.nama} ({o.pengirim.nama.split(" ")[0]}) → {kotaById(o.penerima.kota)?.nama} ({o.penerima.nama})
                      </p>
                    </div>
                    <Button href={`/dashboard/pesanan/${o.resi}`} variant="secondary" size="sm">
                      {o.status === "sampai" ? "Riwayat" : "Lihat Detail"}
                    </Button>
                  </div>
                  <div className="mt-4 border-t border-line pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><RefreshCw className="size-4 text-accent" aria-hidden />{o.timeline[0].judul}</span>
                      {o.status !== "sampai" && o.status !== "dibatalkan" && <span className="text-xs text-muted">Est. tiba: {jam(o.estimasi)}</span>}
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuenow={Math.round(prog)} aria-valuemin={0} aria-valuemax={100} aria-label="Progres pengiriman">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${o.status === "dibatalkan" ? 0 : Math.max(prog, 8)}%` }} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] font-bold text-muted">
                      <span>Diambil</span><span className="text-accent-deep">Transit</span><span>Diantar</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black">Peta Kurir & Rute Aktif</h2>
                <p className="text-sm text-muted">Live radar paketmu hari ini.</p>
              </div>
              <span className="mt-1 flex size-3"><span className="absolute size-3 rounded-full bg-primary animate-pulse-ring" /><span className="size-3 rounded-full bg-primary" /></span>
            </div>
            <div className="mt-4">
              {aktif ? <TrackMapLoader asal={aktif.pengirim.kota} tujuan={aktif.penerima.kota} status={aktif.status} height={230} /> : <p className="rounded-2xl bg-surface2 p-6 text-center text-sm text-muted">Belum ada paket yang sedang berjalan.</p>}
            </div>
            {aktif && kurir && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface2 p-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent text-white"><MapPin className="size-5" /></span>
                <div className="text-sm">
                  <p className="font-extrabold">Kurir {kurir.nama.split(" ")[0]} {kurir.nama.split(" ")[1]?.[0]}.</p>
                  <p className="text-xs text-muted">{kurir.kendaraan} · {kurir.plat}</p>
                </div>
              </div>
            )}
          </Card>

          <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-accent-soft to-soft p-6">
            <span className="rounded bg-accent-deep px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">Promo minggu ini</span>
            <h2 className="mt-3 text-2xl font-black leading-tight">Diskon Ongkir s.d. 35%!</h2>
            <p className="mt-2 text-sm text-muted">Gunakan kode voucher <b className="text-accent-deep underline">PHELYAHEMAT</b> saat buat pesanan.</p>
            <Link href="/dashboard/buat" className="mt-3 inline-block text-sm font-extrabold text-accent-deep">Klaim sekarang ›</Link>
            <span className="absolute -bottom-10 -right-8 size-36 rounded-full bg-white/40 dark:bg-white/5" aria-hidden />
          </section>
        </aside>
      </div>
    </div>
  );
}
