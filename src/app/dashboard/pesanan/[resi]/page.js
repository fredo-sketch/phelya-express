"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, Package, Printer, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge, BayarBadge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import Timeline from "@/components/tracking/timeline";
import TrackMapLoader from "@/components/tracking/track-map-loader";
import { CopyResi } from "@/components/tracking/resi-actions";
import { useOrders } from "@/components/order-store";
import { kotaById, LAYANAN } from "@/lib/tariff";
import { bisaDibatalkan, SERAH } from "@/lib/status";
import RincianBiaya from "@/components/ui/rincian-biaya";
import TombolBayar from "@/components/ui/tombol-bayar";
import { rupiah, tanggalJam } from "@/lib/format";

const PACKING_NAMA = { tidak: "Tidak", bubble_wrap: "Bubble wrap", kardus: "Kardus", kayu: "Kayu" };

export default function DetailPesanan({ params }) {
  const { resi } = use(params);
  const { orders, batalkan, getKurir } = useOrders();
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
    const hasil = await batalkan(o.resi);
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
            <Button variant="soft" size="sm" icon={Printer} className="mt-3" href={`/api/orders/${o.resi}/label`} target="_blank" rel="noopener" prefetch={false}>Cetak Label</Button>
            <p className="mt-1 text-sm text-muted">Dibuat {tanggalJam(o.dibuat)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={o.status} className="text-sm" />
            <BayarBadge bayar={o.bayar} className="text-sm" />
          </div>
        </div>
        {o.bayar === "menunggu" && o.status !== "dibatalkan" && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent-soft/50 p-4">
            <p className="text-sm font-semibold">Total <b>{rupiah(o.total)}</b> belum dibayar. Bayar sekarang lewat QRIS, transfer bank, atau e-wallet.</p>
            <TombolBayar resi={o.resi} size="sm" />
          </div>
        )}
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
              <div className="flex justify-between gap-6"><dt className="text-muted">Cara serah</dt><dd className="text-right font-bold">{SERAH[o.metodeSerah]?.label}</dd></div>
              {o.metodeSerah === "jemput" && <div className="flex justify-between gap-6"><dt className="text-muted">Alamat jemput</dt><dd className="text-right font-bold">{o.jemputAlamat}</dd></div>}
            </dl>
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold"><Wallet className="size-4 text-primary" aria-hidden />Rincian biaya</p>
              <RincianBiaya ongkir={o.ongkir} packing={o.packingBiaya} packingNama={PACKING_NAMA[o.packingId]} tampilJemput={o.metodeSerah === "jemput"} jemput={o.jemputBiaya} jemputKm={o.jemputJarakKm} diskon={o.diskon} total={o.total} />
            </div>
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
