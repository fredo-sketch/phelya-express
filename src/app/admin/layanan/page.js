"use client";

import { useCallback, useEffect, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Pill } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Modal from "@/components/admin/modal";
import CrudTable from "@/components/admin/crud-table";
import { useToast } from "@/components/ui/toast";
import { api } from "@/components/order-store";

export default function LayananAdmin() {
  const { toast } = useToast();
  const [st, setSt] = useState({ memuat: true, data: [], error: "" });
  const [modal, setModal] = useState(null);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  const muat = useCallback(async () => {
    const j = await api("/api/layanan");
    setSt(j.ok ? { memuat: false, data: j.layanan, error: "" } : { memuat: false, data: [], error: j.error });
  }, []);
  useEffect(() => {
    let batal = false;
    api("/api/layanan").then((j) => {
      if (!batal) setSt(j.ok ? { memuat: false, data: j.layanan, error: "" } : { memuat: false, data: [], error: j.error });
    });
    return () => {
      batal = true;
    };
  }, []);

  async function simpan(e) {
    e.preventDefault();
    if (busy) return;
    const n = {};
    const pg = Number(modal.pengali);
    const mb = Number(modal.minBerat);
    if (!(pg > 0 && pg <= 99)) n.pengali = "Pengali harus lebih dari 0 dan maksimal 99.";
    if (!(mb > 0 && mb <= 100)) n.minBerat = "Berat minimal harus antara 0 dan 100 kg.";
    if (modal.singkat.trim().length < 2) n.singkat = "Label minimal 2 karakter.";
    if (modal.deskripsi.trim().length < 5) n.deskripsi = "Deskripsi minimal 5 karakter.";
    setErr(n);
    if (Object.keys(n).length) return;
    setBusy(true);
    const j = await api(`/api/layanan/${modal.id}`, { method: "PATCH", body: { ...modal, pengali: pg, minBerat: mb } });
    setBusy(false);
    if (!j.ok) return toast({ type: "error", title: "Layanan belum tersimpan", description: j.error });
    setModal(null);
    await muat();
    toast({ type: "success", title: "Layanan diperbarui" });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent-deep">Admin / Layanan</p>
        <h1 className="text-3xl font-black">Layanan dan Tarif</h1>
        <p className="text-muted">Pengali tarif dan berat minimal tiap layanan. Tarif per kg per zona diatur di menu Tarif dan Zona.</p>
      </div>
      <CrudTable
        cariLabel="Cari layanan"
        baris={st.data}
        memuat={st.memuat}
        galat={st.error}
        teksCari={(r) => `${r.nama} ${r.singkat}`}
        onEdit={(r) => { setErr({}); setModal({ ...r, pengali: String(r.pengali), minBerat: String(r.minBerat) }); }}
        kolom={[
          { label: "Layanan", render: (r) => <><span className="font-bold">{r.nama}</span><span className="block text-xs text-muted">{r.singkat}</span></> },
          { label: "Pengali tarif", render: (r) => <b>x {r.pengali}</b> },
          { label: "Berat min.", render: (r) => `${r.minBerat} kg` },
          { label: "Maks. zona", render: (r) => (r.maxZona ? `Zona ${r.maxZona}` : "Semua") },
          { label: "Status", render: (r) => <Pill tone={r.aktif ? "teal" : "neutral"}>{r.aktif ? "Aktif" : "Nonaktif"}</Pill> },
        ]}
      />
      {modal && (
        <Modal judul={`Ubah ${modal.nama}`} onClose={() => setModal(null)}>
          <form onSubmit={simpan} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pengali tarif" required error={err.pengali} hint="Mis. 1 = tarif dasar, 1.6 = 60% lebih mahal.">{(p) => <Input {...p} type="number" step="0.1" min="0.1" inputMode="decimal" value={modal.pengali} invalid={!!err.pengali} onChange={(e) => setModal({ ...modal, pengali: e.target.value })} />}</Field>
              <Field label="Berat minimal (kg)" required error={err.minBerat}>{(p) => <Input {...p} type="number" step="0.5" min="0.5" inputMode="decimal" value={modal.minBerat} invalid={!!err.minBerat} onChange={(e) => setModal({ ...modal, minBerat: e.target.value })} />}</Field>
            </div>
            <Field label="Label singkat" required error={err.singkat}>{(p) => <Input {...p} value={modal.singkat} invalid={!!err.singkat} onChange={(e) => setModal({ ...modal, singkat: e.target.value })} />}</Field>
            <Field label="Deskripsi" required error={err.deskripsi}>{(p) => <Textarea {...p} value={modal.deskripsi} invalid={!!err.deskripsi} onChange={(e) => setModal({ ...modal, deskripsi: e.target.value })} />}</Field>
            <Field label="Status">{(p) => <Select {...p} value={modal.aktif ? "1" : "0"} onChange={(e) => setModal({ ...modal, aktif: e.target.value === "1" })}><option value="1">Aktif</option><option value="0">Nonaktif (tidak bisa dipilih)</option></Select>}</Field>
            <div className="flex justify-end gap-3 pt-2"><Button variant="ghost" onClick={() => setModal(null)} disabled={busy}>Batal</Button><Button type="submit" loading={busy}>Simpan</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
