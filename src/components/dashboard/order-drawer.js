"use client";

import { useEffect, useState } from "react";
import { X, Printer, Wallet } from "lucide-react";
import Button from "@/components/ui/button";
import { StatusBadge, BayarBadge } from "@/components/ui/badge";
import { Field, Select } from "@/components/ui/field";
import Timeline from "@/components/tracking/timeline";
import TrackMapLoader from "@/components/tracking/track-map-loader";
import { useToast } from "@/components/ui/toast";
import { useOrders } from "@/components/order-store";
import { LAYANAN, kotaById } from "@/lib/tariff";
import { rupiah } from "@/lib/format";

/** Drawer rincian order untuk admin: timeline, peta, assign kurir, konfirmasi pembayaran. */
export default function OrderDrawer({ resi, onClose }) {
  const { orders, kurir: daftarKurir, getKurir, assignKurir, konfirmasiBayar } = useOrders();
  const { toast } = useToast();
  const [pilih, setPilih] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const o = orders.find((x) => x.resi === resi);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!o) return null;
  const kurir = getKurir(o.kurirId);
  const bisaAssign = ["menunggu_kurir", "diambil"].includes(o.status);

  async function simpanKurir() {
    if (busy) return;
    if (!pilih) return setErr("Pilih kurir terlebih dahulu.");
    setErr("");
    setBusy(true);
    const h = await assignKurir(o.resi, pilih);
    setBusy(false);
    if (!h.ok) return toast({ type: "error", title: "Gagal menugaskan kurir", description: h.error });
    setPilih("");
    toast({ type: "success", title: "Kurir ditugaskan", description: `${o.resi} → ${getKurir(pilih)?.nama}` });
  }

  async function bayar() {
    if (busy) return;
    setBusy(true);
    const h = await konfirmasiBayar(o.resi);
    setBusy(false);
    toast(h.ok ? { type: "success", title: "Pembayaran dikonfirmasi", description: o.resi } : { type: "error", title: "Gagal mengonfirmasi", description: h.error });
  }

  return (
    <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label={`Rincian ${o.resi}`}>
      <button className="absolute inset-0 bg-black/50" aria-label="Tutup rincian" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-surface shadow-2xl">
        <div className="flex items-start justify-between border-b border-line p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Rincian Pengiriman</p>
            <h2 className="mt-1 font-mono text-xl font-black">{o.resi}</h2>
            <div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={o.status} /><BayarBadge bayar={o.bayar} /></div>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="inline-flex size-9 items-center justify-center rounded-full bg-soft"><X className="size-4" /></button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <dl className="space-y-2.5 text-sm">
            {[
              ["Rute", `${kotaById(o.pengirim.kota)?.nama} → ${kotaById(o.penerima.kota)?.nama}`],
              ["Pengirim", o.pengirim.nama],
              ["Penerima", o.penerima.nama],
              ["Layanan", LAYANAN[o.layanan].nama],
              ["Barang", `${o.barang.isi} · ${o.barang.berat} kg`],
              ["Ongkir", rupiah(o.ongkir)],
              ["Kurir", kurir ? `${kurir.nama} (${kurir.kode})` : "Belum ditugaskan"],
            ].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right font-bold">{v}</dd></div>)}
          </dl>

          <TrackMapLoader asal={o.pengirim.kota} tujuan={o.penerima.kota} status={o.status} height={190} />

          {bisaAssign && (
            <div className="rounded-2xl border border-line bg-surface2 p-4">
              <p className="mb-3 text-sm font-extrabold">Tugaskan Kurir</p>
              <Field error={err}>
                {(p) => (
                  <Select {...p} value={pilih} invalid={!!err} onChange={(e) => setPilih(e.target.value)} aria-label="Pilih kurir">
                    <option value="">Pilih kurir</option>
                    {daftarKurir.filter((k) => k.aktif).map((k) => <option key={k.id} value={k.id}>{k.nama} · {k.hub}</option>)}
                  </Select>
                )}
              </Field>
              <Button size="sm" className="mt-3" loading={busy} onClick={simpanKurir}>Simpan</Button>
            </div>
          )}

          <div>
            <h3 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-muted">Kronologi Logistik</h3>
            <Timeline events={o.timeline} status={o.status} />
          </div>
        </div>

        <div className="flex gap-3 border-t border-line p-4">
          <Button variant="secondary" icon={Printer} className="flex-1" onClick={() => toast({ type: "info", title: "Cetak label", description: "Label PDF + QR dibuat di tahap backend." })}>Cetak Resi</Button>
          {o.bayar !== "lunas" ? (
            <Button icon={Wallet} className="flex-1" loading={busy} onClick={bayar}>Konfirmasi Bayar</Button>
          ) : (
            <Button variant="soft" className="flex-1" disabled>Sudah Lunas</Button>
          )}
        </div>
      </aside>
    </div>
  );
}
