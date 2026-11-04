"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, CircleAlert, MapPin, Phone, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { Field, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import Timeline from "@/components/tracking/timeline";
import TrackMapLoader from "@/components/tracking/track-map-loader";
import { useOrders } from "@/components/order-store";
import { KURIR_AKTIF_ID } from "@/data/mock";
import { LAYANAN, kotaById } from "@/lib/tariff";
import { NEXT_ACTION } from "@/lib/status";

const ALASAN = ["Penerima tidak di tempat", "Alamat tidak ditemukan", "Penerima menolak paket", "Nomor penerima tidak aktif", "Kondisi cuaca / akses jalan"];
const MAKS = 2 * 1024 * 1024;

export default function DetailTugas({ params }) {
  const { resi } = use(params);
  const { orders, ubahStatus } = useOrders();
  const { toast } = useToast();
  const fotoRef = useRef(null);
  const [foto, setFoto] = useState(null);
  const [fotoErr, setFotoErr] = useState("");
  const [gagalOpen, setGagalOpen] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [alasanErr, setAlasanErr] = useState("");
  const [loading, setLoading] = useState(false);

  const o = orders.find((x) => x.resi === resi.toUpperCase() && x.kurirId === KURIR_AKTIF_ID);
  if (!o)
    return <EmptyState pose="santai" title="Tugas tidak ditemukan" description="Paket ini bukan tugasmu atau sudah tidak ada." action={<Button href="/kurir">Kembali ke tugas</Button>} />;

  const aksi = NEXT_ACTION[o.status];
  const butuhFoto = aksi?.ke === "sampai";
  const bisaGagal = ["diambil", "dalam_perjalanan"].includes(o.status);

  function pilihFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setFotoErr("Foto harus JPG, PNG, atau WebP.");
    if (file.size > MAKS) return setFotoErr("Ukuran foto maksimal 2 MB.");
    if (foto) URL.revokeObjectURL(foto.url);
    setFotoErr("");
    setFoto({ file, url: URL.createObjectURL(file) });
  }
  function hapusFoto() {
    if (foto) URL.revokeObjectURL(foto.url);
    setFoto(null);
    if (fotoRef.current) fotoRef.current.value = "";
  }

  async function jalankan() {
    if (loading || !aksi) return;
    if (butuhFoto && !foto) return setFotoErr("Unggah foto bukti serah terima terlebih dahulu.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const h = ubahStatus(o.resi, aksi.ke, { lokasi: kotaById(o.penerima.kota)?.nama, deskripsi: butuhFoto ? "Paket diterima. Foto bukti serah terima diunggah." : "Status diperbarui oleh kurir." });
    setLoading(false);
    toast(h.ok ? { type: "success", title: "Status diperbarui", description: `${o.resi} → ${aksi.label}` } : { type: "error", title: "Gagal memperbarui", description: h.error });
  }

  async function gagalKirim() {
    if (loading) return;
    if (!alasan) return setAlasanErr("Pilih alasan gagal kirim.");
    setAlasanErr("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const h = ubahStatus(o.resi, "gagal", { lokasi: kotaById(o.penerima.kota)?.nama, alasan });
    setLoading(false);
    setGagalOpen(false);
    toast(h.ok ? { type: "info", title: "Dicatat sebagai gagal kirim", description: alasan } : { type: "error", title: "Gagal memperbarui", description: h.error });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/kurir" className="inline-flex items-center gap-2 text-sm font-bold text-primary"><ArrowLeft className="size-4" aria-hidden />Kembali ke tugas</Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">No. Resi</p>
            <h1 className="font-mono text-2xl font-black">{o.resi}</h1>
          </div>
          <StatusBadge status={o.status} className="text-sm" />
        </div>
        <div className="mt-4 flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-deep"><MapPin className="size-5" aria-hidden /></span>
          <div>
            <p className="text-lg font-extrabold">{o.penerima.nama}</p>
            <p className="text-sm text-muted">{o.penerima.alamat}</p>
            <p className="mt-1 text-sm">{LAYANAN[o.layanan].nama} · {o.barang.isi} · {o.barang.berat} kg</p>
          </div>
        </div>
        {o.alasanGagal && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger"><CircleAlert className="size-4" aria-hidden />Gagal kirim: {o.alasanGagal}</p>}
        <a href={`tel:${o.penerima.hp}`} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-soft font-bold"><Phone className="size-4" aria-hidden />Telepon penerima</a>
      </Card>

      <Card className="p-5"><TrackMapLoader asal={o.pengirim.kota} tujuan={o.penerima.kota} status={o.status} height={220} /></Card>

      {aksi && (
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-black">Perbarui Status</h2>
          {butuhFoto && (
            <Field label="Foto bukti serah terima" required error={fotoErr} hint="Foto penerima atau paket di lokasi. JPG/PNG/WebP, maks. 2 MB.">
              {(p) => (
                <div>
                  <input ref={fotoRef} {...p} type="file" accept="image/*" capture="environment" onChange={pilihFoto} className="sr-only" />
                  {foto ? (
                    <div className="flex items-center gap-3 rounded-xl bg-surface2 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={foto.url} alt="Pratinjau bukti serah terima" className="size-20 rounded-lg object-cover" />
                      <p className="min-w-0 flex-1 truncate text-sm font-bold">{foto.file.name}</p>
                      <button type="button" onClick={hapusFoto} aria-label="Hapus foto" className="inline-flex size-9 items-center justify-center rounded-full bg-soft"><X className="size-4" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fotoRef.current?.click()} className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-surface2 py-8 text-sm text-muted hover:border-primary"><Camera className="size-5 text-primary" aria-hidden />Ambil / pilih foto</button>
                  )}
                </div>
              )}
            </Field>
          )}
          <Button size="lg" className="w-full" loading={loading && !gagalOpen} onClick={jalankan}>{aksi.label}</Button>

          {bisaGagal && (
            <div className="border-t border-line pt-4">
              {gagalOpen ? (
                <div className="space-y-3">
                  <Field label="Alasan gagal kirim" required error={alasanErr}>
                    {(p) => <Select {...p} value={alasan} invalid={!!alasanErr} onChange={(e) => setAlasan(e.target.value)}><option value="">Pilih alasan</option>{ALASAN.map((a) => <option key={a}>{a}</option>)}</Select>}
                  </Field>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setGagalOpen(false)} disabled={loading}>Batal</Button>
                    <Button variant="danger" loading={loading} onClick={gagalKirim} className="flex-1">Catat Gagal Kirim</Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setGagalOpen(true)} className="w-full text-center text-sm font-bold text-danger">Paket gagal diantar?</button>
              )}
            </div>
          )}
        </Card>
      )}

      <Card className="p-5">
        <h2 className="mb-5 text-lg font-black">Riwayat Status</h2>
        <Timeline events={o.timeline} status={o.status} />
      </Card>
    </div>
  );
}
