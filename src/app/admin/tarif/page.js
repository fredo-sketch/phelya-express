"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/components/order-store";
import { rupiah } from "@/lib/format";

const KOSONG = { id: null, nama: "", maxKm: "", perKg: "" };

export default function TarifZona() {
  const { toast } = useToast();
  const [zona, setZona] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galatMuat, setGalatMuat] = useState("");

  const ambil = useCallback(async () => {
    const j = await api("/api/tarif");
    if (j.ok) {
      setZona(j.zona.map((z) => ({ ...z, maxKm: z.maxKm ?? "" })));
      setGalatMuat("");
    } else setGalatMuat(j.error);
    setMemuat(false);
  }, []);
  const muat = ambil;
  useEffect(() => {
    let batal = false;
    api("/api/tarif").then((j) => {
      if (batal) return;
      if (j.ok) setZona(j.zona.map((z) => ({ ...z, maxKm: z.maxKm ?? "" })));
      else setGalatMuat(j.error);
      setMemuat(false);
    });
    return () => {
      batal = true;
    };
  }, []);
  const [modal, setModal] = useState(null);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  async function simpan(e) {
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
    const badan = { nama: modal.nama.trim(), maxKm: km, perKg: harga };
    const j = modal.id ? await api(`/api/zona/${modal.id}`, { method: "PATCH", body: badan }) : await api("/api/zona", { method: "POST", body: badan });
    setBusy(false);
    if (!j.ok) return toast({ type: "error", title: "Zona belum tersimpan", description: j.error });
    setModal(null);
    await muat();
    toast({ type: "success", title: modal.id ? "Zona diperbarui" : "Zona ditambahkan" });
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

      <p className="rounded-xl bg-accent-soft/50 px-4 py-3 text-sm text-accent-deep">Tarif di halaman ini langsung dipakai untuk menghitung ongkir pada pesanan baru.</p>
      {galatMuat && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{galatMuat}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted"><tr>{["Zona", "Jarak Maks.", "Tarif / kg", ""].map((h) => <th key={h} scope="col" className="px-5 py-3.5">{h}</th>)}</tr></thead>
          <tbody>
            {memuat && <tr><td colSpan={4} className="px-5 py-6 text-center text-muted">Memuat tarif...</td></tr>}
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
