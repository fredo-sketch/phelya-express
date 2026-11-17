"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/components/order-store";

export default function PengaturanAdmin() {
  const { toast } = useToast();
  const [f, setF] = useState(null);
  const [galatMuat, setGalatMuat] = useState("");
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let batal = false;
    api("/api/pengaturan").then((j) => {
      if (batal) return;
      if (j.ok) setF(Object.fromEntries(Object.entries(j.pengaturan).map(([k, v]) => [k, String(v)])));
      else setGalatMuat(j.error);
    });
    return () => {
      batal = true;
    };
  }, []);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function simpan(e) {
    e.preventDefault();
    if (busy) return;
    const n = {};
    if (f.kantorNama.trim().length < 3) n.kantorNama = "Minimal 3 karakter.";
    if (f.kantorAlamat.trim().length < 5) n.kantorAlamat = "Minimal 5 karakter.";
    if (!(Number(f.kantorLat) >= -90 && Number(f.kantorLat) <= 90)) n.kantorLat = "Lintang harus -90 sampai 90.";
    if (!(Number(f.kantorLng) >= -180 && Number(f.kantorLng) <= 180)) n.kantorLng = "Bujur harus -180 sampai 180.";
    const m = Number(f.jemputMaksKm);
    if (!Number.isInteger(m) || m < 1 || m > 100) n.jemputMaksKm = "Harus 1 sampai 100 km.";
    if (!Number.isInteger(Number(f.jemputBiayaDasar)) || Number(f.jemputBiayaDasar) < 0) n.jemputBiayaDasar = "Bilangan bulat, minimal 0.";
    if (!Number.isInteger(Number(f.jemputBiayaPerKm)) || Number(f.jemputBiayaPerKm) < 0) n.jemputBiayaPerKm = "Bilangan bulat, minimal 0.";
    if (!(Number(f.jemputMinBerat) > 0)) n.jemputMinBerat = "Harus lebih dari 0 kg.";
    if (!/^62\d{8,13}$/.test(f.waAdmin.replace(/[\s+-]/g, ""))) n.waAdmin = "Format 62xxxxxxxxxx (tanpa +).";
    setErr(n);
    if (Object.keys(n).length) return;
    setBusy(true);
    const j = await api("/api/pengaturan", { method: "PATCH", body: f });
    setBusy(false);
    toast(j.ok ? { type: "success", title: "Pengaturan disimpan" } : { type: "error", title: "Pengaturan belum tersimpan", description: j.error });
  }

  if (galatMuat) return <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{galatMuat}</p>;
  if (!f) return <p className="py-10 text-center text-muted" role="status">Memuat pengaturan...</p>;

  const contoh = Number(f.jemputBiayaDasar) + Number(f.jemputBiayaPerKm) * 4;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent-deep">Admin / Pengaturan</p>
        <h1 className="text-3xl font-black">Pengaturan Kantor dan Jemput</h1>
        <p className="text-muted">Dipakai server untuk menghitung biaya jemput dan menentukan batas jangkauan.</p>
      </div>
      <form onSubmit={simpan} noValidate className="space-y-5">
        <Card className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-black">Kantor / drop point</h2>
          <Field label="Nama kantor" required error={err.kantorNama}>{(p) => <Input {...p} value={f.kantorNama} invalid={!!err.kantorNama} onChange={set("kantorNama")} />}</Field>
          <Field label="Alamat kantor" required error={err.kantorAlamat}>{(p) => <Input {...p} value={f.kantorAlamat} invalid={!!err.kantorAlamat} onChange={set("kantorAlamat")} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lintang (lat)" required error={err.kantorLat}>{(p) => <Input {...p} type="number" step="any" value={f.kantorLat} invalid={!!err.kantorLat} onChange={set("kantorLat")} />}</Field>
            <Field label="Bujur (lng)" required error={err.kantorLng}>{(p) => <Input {...p} type="number" step="any" value={f.kantorLng} invalid={!!err.kantorLng} onChange={set("kantorLng")} />}</Field>
          </div>
        </Card>
        <Card className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-black">Penjemputan (khusus membership)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jarak maksimal (km)" required error={err.jemputMaksKm}>{(p) => <Input {...p} type="number" inputMode="numeric" value={f.jemputMaksKm} invalid={!!err.jemputMaksKm} onChange={set("jemputMaksKm")} />}</Field>
            <Field label="Berat minimal (kg)" required error={err.jemputMinBerat}>{(p) => <Input {...p} type="number" step="0.5" value={f.jemputMinBerat} invalid={!!err.jemputMinBerat} onChange={set("jemputMinBerat")} />}</Field>
            <Field label="Biaya dasar (Rp)" required error={err.jemputBiayaDasar}>{(p) => <Input {...p} type="number" step="500" inputMode="numeric" value={f.jemputBiayaDasar} invalid={!!err.jemputBiayaDasar} onChange={set("jemputBiayaDasar")} />}</Field>
            <Field label="Biaya per km (Rp)" required error={err.jemputBiayaPerKm}>{(p) => <Input {...p} type="number" step="500" inputMode="numeric" value={f.jemputBiayaPerKm} invalid={!!err.jemputBiayaPerKm} onChange={set("jemputBiayaPerKm")} />}</Field>
          </div>
          <p className="rounded-xl bg-accent-soft/50 px-4 py-3 text-sm text-accent-deep">Contoh: titik jemput 4 km dari kantor, biaya jemput = Rp {Number.isFinite(contoh) ? contoh.toLocaleString("id-ID") : "-"}. Jarak dibulatkan ke atas per km.</p>
        </Card>
        <Card className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-black">Lain-lain</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp admin (chatbot)" required error={err.waAdmin} hint="Format 62xxxxxxxxxx">{(p) => <Input {...p} type="tel" inputMode="tel" value={f.waAdmin} invalid={!!err.waAdmin} onChange={set("waAdmin")} />}</Field>
            <Field label="Diskon member (%)" hint="0 = tidak ada diskon (ditunda).">{(p) => <Input {...p} type="number" step="0.5" min="0" max="100" value={f.diskonMemberPersen} onChange={set("diskonMemberPersen")} />}</Field>
          </div>
        </Card>
        <div className="flex justify-end"><Button type="submit" loading={busy}>Simpan Pengaturan</Button></div>
      </form>
    </div>
  );
}
