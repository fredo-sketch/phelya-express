"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/components/order-store";
import { tanggal, tanggalJam } from "@/lib/format";

const STATUS = [
  ["baru", "Baru"],
  ["diproses", "Diproses"],
  ["wawancara", "Wawancara"],
  ["diterima", "Diterima"],
  ["ditolak", "Ditolak"],
];
const TONE = { baru: "amber", diproses: "info", wawancara: "info", diterima: "info", ditolak: "neutral" };

export default function KarierAdmin() {
  const { toast } = useToast();
  const [lowongan, setLowongan] = useState([]);
  const [lamaran, setLamaran] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let batal = false;
    Promise.all([api("/api/lowongan"), api("/api/lamaran")]).then(([a, b]) => {
      if (batal) return;
      if (a.ok) setLowongan(a.lowongan);
      if (b.ok) setLamaran(b.lamaran);
      setError(a.ok && b.ok ? "" : (a.error ?? b.error));
      setMemuat(false);
    });
    return () => {
      batal = true;
    };
  }, []);

  async function ubahStatus(l, status) {
    setBusy(l.id);
    const j = await api(`/api/lamaran/${l.id}`, { method: "PATCH", body: { status } });
    setBusy(null);
    if (!j.ok) return toast({ type: "error", title: "Status belum tersimpan", description: j.error });
    setLamaran((p) => p.map((x) => (x.id === l.id ? { ...x, status } : x)));
    toast({ type: "success", title: "Status lamaran diperbarui", description: `${l.nama} → ${STATUS.find(([k]) => k === status)[1]}` });
  }

  async function unduhCv(l) {
    // tab dibuka lebih dulu (aksi klik) supaya tidak diblokir popup blocker, lalu diarahkan ke tautan sementara
    const tab = window.open("about:blank", "_blank");
    setBusy(l.id);
    const j = await api(`/api/lamaran/${l.id}/cv`);
    setBusy(null);
    if (!j.ok) {
      tab?.close();
      return toast({ type: "error", title: "CV tidak tersedia", description: j.error });
    }
    if (tab) tab.location.href = j.url;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-black">Karier</h1><p className="text-muted">{lowongan.length} lowongan aktif, {lamaran.length} lamaran masuk.</p></div>
        <Button href="/karier" variant="secondary">Lihat halaman publik</Button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}

      <Card className="overflow-x-auto">
        <div className="p-5 pb-2"><h2 className="text-lg font-black">Lowongan</h2></div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted"><tr>{["Posisi", "Divisi", "Lokasi", "Tipe", "Batas", "Pelamar"].map((h) => <th key={h} scope="col" className="px-5 py-3.5">{h}</th>)}</tr></thead>
          <tbody>
            {memuat && <tr><td colSpan={6} className="px-5 py-6 text-center text-muted">Memuat lowongan...</td></tr>}
            {lowongan.map((l) => (
              <tr key={l.slug} className="border-t border-line">
                <td className="px-5 py-4 font-bold">{l.judul}</td>
                <td className="px-5 py-4 text-muted">{l.divisi}</td>
                <td className="px-5 py-4">{l.lokasi}</td>
                <td className="px-5 py-4"><Pill tone="amber">{l.tipe}</Pill></td>
                <td className="px-5 py-4 text-muted">{tanggal(l.batas)}</td>
                <td className="px-5 py-4 font-bold">{lamaran.filter((x) => x.slug === l.slug).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto">
        <div className="p-5 pb-2"><h2 className="text-lg font-black">Lamaran Masuk</h2></div>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted"><tr>{["Pelamar", "Posisi", "Kontak", "Masuk", "Status", "CV"].map((h) => <th key={h} scope="col" className="px-5 py-3.5">{h}</th>)}</tr></thead>
          <tbody>
            {!memuat && lamaran.length === 0 && <tr><td colSpan={6} className="px-5 py-6 text-center text-muted">Belum ada lamaran.</td></tr>}
            {lamaran.map((l) => (
              <tr key={l.id} className="border-t border-line align-top">
                <td className="px-5 py-4"><p className="font-bold">{l.nama}</p><p className="text-xs text-muted">{l.kota}</p></td>
                <td className="px-5 py-4">{l.posisi}</td>
                <td className="px-5 py-4 text-xs"><p>{l.email}</p><p className="text-muted">{l.hp}</p></td>
                <td className="px-5 py-4 text-muted">{tanggalJam(l.dibuat)}</td>
                <td className="px-5 py-4">
                  <Select aria-label={`Status lamaran ${l.nama}`} value={l.status} disabled={busy === l.id} onChange={(e) => ubahStatus(l, e.target.value)}>
                    {STATUS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                  <Pill tone={TONE[l.status]} className="mt-2 sm:hidden">{l.status}</Pill>
                </td>
                <td className="px-5 py-4"><Button size="sm" variant="secondary" icon={FileText} loading={busy === l.id} onClick={() => unduhCv(l)}>Buka CV</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
