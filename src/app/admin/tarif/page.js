"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ZONA } from "@/lib/tariff";
import { rupiah } from "@/lib/format";

const KOSONG = { id: null, nama: "", maxKm: "", perKg: "" };

export default function TarifZona() {
  const { toast } = useToast();
  const [zona, setZona] = useState(() => ZONA.map((z) => ({ ...z, maxKm: z.maxKm === Infinity ? "" : z.maxKm })));
  const [modal, setModal] = useState(null);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  function simpan(e) {
    e.preventDefault();
    if (busy) return;
    const n = {};
    if (modal.nama.trim().length < 3) n.nama = "Nama zona minimal 3 karakter.";
    const km = modal.maxKm === "" ? null : Number(modal.maxKm);
    if (km !== null && (!Number.isFinite(km) || km <= 0)) n.maxKm = "Jarak maksimal harus lebih dari 0, atau kosongkan untuk tanpa batas.";
    const harga = Number(modal.perKg);
    if (!Number.isFinite(harga) || harga < 1000) n.perKg = "Tarif per kg minimal Rp 1.000.";
    setErr(n);
    if (Object.keys(n).length) return;
    setBusy(true);
    setTimeout(() => {
      setZona((p) => (modal.id ? p.map((z) => (z.id === modal.id ? { ...z, nama: modal.nama.trim(), maxKm: km ?? "", perKg: harga } : z)) : [...p, { id: Math.max(0, ...p.map((z) => z.id)) + 1, nama: modal.nama.trim(), maxKm: km ?? "", perKg: harga }]));
      setBusy(false);
      setModal(null);
      toast({ type: "success", title: modal.id ? "Zona diperbarui" : "Zona ditambahkan" });
    }, 600);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Tarif dan Zona</h1>
          <p className="text-muted">Kelola tarif dasar per kilogram untuk tiap zona jarak.</p>
        </div>
        <Button icon={Plus} onClick={() => { setErr({}); setModal({ ...KOSONG }); }}>Tambah Zona</Button>
      </div>

      <p className="rounded-xl bg-accent-soft/50 px-4 py-3 text-sm text-accent-deep">Perubahan di halaman ini masih simulasi dan belum memengaruhi perhitungan ongkir. Setelah terhubung ke database, tarif ini menjadi sumber perhitungan.</p>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted"><tr>{["Zona", "Jarak Maks.", "Tarif / kg", ""].map((h) => <th key={h} scope="col" className="px-5 py-3.5">{h}</th>)}</tr></thead>
          <tbody>
            {zona.map((z) => (
              <tr key={z.id} className="border-t border-line">
                <td className="px-5 py-4 font-bold">{z.nama}</td>
                <td className="px-5 py-4 text-muted">{z.maxKm === "" ? "Tanpa batas" : `${z.maxKm} km`}</td>
                <td className="px-5 py-4 font-extrabold">{rupiah(z.perKg)}</td>
                <td className="px-5 py-4 text-right"><Button size="sm" variant="secondary" icon={Pencil} onClick={() => { setErr({}); setModal({ ...z }); }}>Ubah</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={modal.id ? "Ubah zona" : "Tambah zona"}>
          <button className="absolute inset-0 bg-black/50" aria-label="Tutup" onClick={() => setModal(null)} />
          <form onSubmit={simpan} noValidate className="relative w-full max-w-md space-y-4 rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h2 className="text-xl font-black">{modal.id ? "Ubah Zona" : "Tambah Zona"}</h2><button type="button" onClick={() => setModal(null)} aria-label="Tutup" className="inline-flex size-9 items-center justify-center rounded-full bg-soft"><X className="size-4" /></button></div>
            <Field label="Nama zona" required error={err.nama}>{(p) => <Input {...p} value={modal.nama} invalid={!!err.nama} onChange={(e) => setModal({ ...modal, nama: e.target.value })} placeholder="Zona 5 · Kepulauan" />}</Field>
            <Field label="Jarak maksimal (km)" error={err.maxKm} hint="Kosongkan untuk tanpa batas.">{(p) => <Input {...p} type="number" min="1" inputMode="numeric" value={modal.maxKm} invalid={!!err.maxKm} onChange={(e) => setModal({ ...modal, maxKm: e.target.value })} />}</Field>
            <Field label="Tarif per kg (Rp)" required error={err.perKg}>{(p) => <Input {...p} type="number" min="1000" step="500" inputMode="numeric" value={modal.perKg} invalid={!!err.perKg} onChange={(e) => setModal({ ...modal, perKg: e.target.value })} />}</Field>
            <div className="flex justify-end gap-3 pt-2"><Button variant="ghost" onClick={() => setModal(null)} disabled={busy}>Batal</Button><Button type="submit" loading={busy}>Simpan</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
