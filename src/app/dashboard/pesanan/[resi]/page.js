"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, Package, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge, BayarBadge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import Timeline from "@/components/tracking/timeline";
import TrackMapLoader from "@/components/tracking/track-map-loader";
import { CopyResi } from "@/components/tracking/resi-actions";
import { useOrders } from "@/components/order-store";
import { getKurir } from "@/data/mock";
import { kotaById, LAYANAN } from "@/lib/tariff";
import { bisaDibatalkan } from "@/lib/status";
import { rupiah, tanggalJam } from "@/lib/format";

export default function DetailPesanan({ params }) {
  const { resi } = use(params);
  const { orders, batalkan } = useOrders();
  const { toast } = useToast();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [loading, setLoading] = useState(false);

  const o = orders.find((x) => x.resi === resi.toUpperCase());
  if (!o)
    return <EmptyState pose="santai" title="Pesanan tidak ditemukan" description="Nomor resi tidak ada di akunmu." action={<Button href="/dashboard/pesanan">Kembali ke pesanan</Button>} />;

  const kurir = getKurir(o.kurirId);

  async function proses() {
    if (loading) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const hasil = batalkan(o.resi);
    setLoading(false);
    setKonfirmasi(false);
    if (hasil.ok) toast({ type: "success", title: "Pesanan dibatalkan", description: `${o.resi} berhasil dibatalkan.` });
    else toast({ type: "error", title: "Gagal membatalkan", description: hasil.error });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/dashboard/pesanan" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent">
        <ArrowLeft className="size-4" aria-hidden /> Pesanan saya
      </Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Nomor Resi</p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="font-mono text-2xl font-black">{o.resi}</h1>
              <CopyResi resi={o.resi} />
            </div>
            <p className="mt-1 text-sm text-muted">Dibuat {tanggalJam(o.dibuat)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={o.status} className="text-sm" />
            <BayarBadge bayar={o.bayar} className="text-sm" />
          </div>
        </div>
        {bisaDibatalkan(o.status) && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-danger-soft p-4">
            <p className="text-sm font-semibold">Pesanan masih bisa dibatalkan selama belum diambil kurir.</p>
            {konfirmasi ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setKonfirmasi(false)} disabled={loading}>Tidak</Button>
                <Button variant="danger" size="sm" loading={loading} onClick={proses}>Ya, batalkan</Button>
              </div>
            ) : (
              <Button variant="danger" size="sm" icon={Ban} onClick={() => setKonfirmasi(true)}>Batalkan Pesanan</Button>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-black">Rincian Pesanan</h2>
            <dl className="space-y-3 text-sm">
              {[
                ["Pengirim", `${o.pengirim.nama} · ${kotaById(o.pengirim.kota)?.nama}`],
                ["Penerima", `${o.penerima.nama} · ${kotaById(o.penerima.kota)?.nama}`],
                ["Alamat tujuan", o.penerima.alamat],
                ["Barang", `${o.barang.isi} (${o.barang.berat} kg)`],
                ["Layanan", LAYANAN[o.layanan].nama],
                ["Kurir", kurir ? `${kurir.nama} (${kurir.kode})` : "Belum ditugaskan"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6"><dt className="text-muted">{k}</dt><dd className="text-right font-bold">{v}</dd></div>
              ))}
              <div className="flex items-center justify-between border-t border-line pt-3">
                <dt className="flex items-center gap-2 font-bold"><Wallet className="size-4 text-primary" aria-hidden />Ongkos kirim</dt>
                <dd className="text-lg font-black text-primary">{rupiah(o.ongkir)}</dd>
              </div>
            </dl>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Package className="size-5 text-primary" aria-hidden />Peta Perjalanan</h2>
            <TrackMapLoader asal={o.pengirim.kota} tujuan={o.penerima.kota} status={o.status} height={260} />
          </Card>
        </div>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-5 text-lg font-black">Riwayat Pengiriman</h2>
          <Timeline events={o.timeline} status={o.status} />
        </Card>
      </div>
    </div>
  );
}
