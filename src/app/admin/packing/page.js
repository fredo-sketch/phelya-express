"use client";

import { useCallback, useEffect, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Pill } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Modal from "@/components/admin/modal";
import CrudTable from "@/components/admin/crud-table";
import { useToast } from "@/components/ui/toast";
import { api } from "@/components/order-store";
import { rupiah } from "@/lib/format";

const KOSONG = { id: null, nama: "", deskripsi: "", harga: "", urutan: "0", aktif: true };

export default function PackingAdmin() {
  const { toast } = useToast();
  const [st, setSt] = useState({ memuat: true, data: [], error: "" });
  const [modal, setModal] = useState(null);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  const muat = useCallback(async () => {
    const j = await api("/api/admin/packing");
    setSt(j.ok ? { memuat: false, data: j.packing, error: "" } : { memuat: false, data: [], error: j.error });
  }, []);
  useEffect(() => {
    let batal = false;
    api("/api/admin/packing").then((j) => {
      if (!batal) setSt(j.ok ? { memuat: false, data: j.packing, error: "" } : { memuat: false, data: [], error: j.error });
    });
    return () => {
      batal = true;
    };
  }, []);

  async function simpan(e) {
    e.preventDefault();
    if (busy) return;
    const n = {};
    if (modal.nama.trim().length < 3) n.nama = "Nama minimal 3 karakter.";
    const h = Number(modal.harga);
    if (modal.harga === "" || !Number.isInteger(h) || h < 0) n.harga = "Harga harus bilangan bulat, minimal Rp 0.";
    setErr(n);
    if (Object.keys(n).length) return;
    setBusy(true);
    const badan = { nama: modal.nama, deskripsi: modal.deskripsi, harga: h, urutan: Number(modal.urutan) || 0, aktif: modal.aktif };
    const j = modal.id ? await api(`/api/admin/packing/${modal.id}`, { method: "PATCH", body: badan }) : await api("/api/admin/packing", { method: "POST", body: badan });
    setBusy(false);
    if (!j.ok) return toast({ type: "error", title: "Packing belum tersimpan", description: j.error });
    setModal(null);
    await muat();
    toast({ type: "success", title: modal.id ? "Packing diperbarui" : "Packing ditambahkan" });
  }

  async function hapus(r) {
    const j = await api(`/api/admin/packing/${r.id}`, { method: "DELETE" });
    if (!j.ok) return toast({ type: "error", title: "Gagal menghapus", description: j.error });
    await muat();
    toast({ type: "success", title: j.dinonaktifkan ? "Packing dinonaktifkan" : "Packing dihapus", description: j.dinonaktifkan ? "Sudah dipakai pesanan, jadi tidak dihapus permanen." : undefined });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent-deep">Admin / Packing</p>
        <h1 className="text-3xl font-black">Packing Tambahan</h1>
        <p className="text-muted">Jenis packing dan harganya. Harga ini otomatis menambah total ongkir pada pesanan baru.</p>
      </div>
      <CrudTable
        cariLabel="Cari packing"
        tambahLabel="Tambah Packing"
        baris={st.data}
        memuat={st.memuat}
        galat={st.error}
        teksCari={(r) => `${r.nama} ${r.deskripsi}`}
        onTambah={() => { setErr({}); setModal({ ...KOSONG }); }}
        onEdit={(r) => { setErr({}); setModal({ ...r, harga: String(r.harga), urutan: String(r.urutan) }); }}
        onHapus={(r) => (r.id === "tidak" ? toast({ type: "error", title: "Tidak bisa dihapus", description: 'Pilihan "Tidak" adalah bawaan sistem.' }) : hapus(r))}
        kolom={[
          { label: "Nama", render: (r) => <span className="font-bold">{r.nama}</span> },
          { label: "Deskripsi", render: (r) => <span className="text-muted">{r.deskripsi || "-"}</span> },
          { label: "Harga", render: (r) => <span className="font-extrabold">{r.harga ? rupiah(r.harga) : "Gratis"}</span> },
          { label: "Status", render: (r) => <Pill tone={r.aktif ? "teal" : "neutral"}>{r.aktif ? "Aktif" : "Nonaktif"}</Pill> },
        ]}
      />
      {modal && (
        <Modal judul={modal.id ? "Ubah Packing" : "Tambah Packing"} onClose={() => setModal(null)}>
          <form onSubmit={simpan} noValidate className="space-y-4">
            <Field label="Nama packing" required error={err.nama}>{(p) => <Input {...p} value={modal.nama} invalid={!!err.nama} onChange={(e) => setModal({ ...modal, nama: e.target.value })} placeholder="Contoh: Styrofoam" />}</Field>
            <Field label="Deskripsi">{(p) => <Textarea {...p} value={modal.deskripsi} onChange={(e) => setModal({ ...modal, deskripsi: e.target.value })} placeholder="Opsional" />}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Harga (Rp)" required error={err.harga}>{(p) => <Input {...p} type="number" min="0" step="500" inputMode="numeric" value={modal.harga} invalid={!!err.harga} disabled={modal.id === "tidak"} onChange={(e) => setModal({ ...modal, harga: e.target.value })} />}</Field>
              <Field label="Urutan tampil">{(p) => <Input {...p} type="number" min="0" inputMode="numeric" value={modal.urutan} onChange={(e) => setModal({ ...modal, urutan: e.target.value })} />}</Field>
            </div>
            <Field label="Status">{(p) => <Select {...p} value={modal.aktif ? "1" : "0"} disabled={modal.id === "tidak"} onChange={(e) => setModal({ ...modal, aktif: e.target.value === "1" })}><option value="1">Aktif (tampil di form pesanan)</option><option value="0">Nonaktif</option></Select>}</Field>
            <div className="flex justify-end gap-3 pt-2"><Button variant="ghost" onClick={() => setModal(null)} disabled={busy}>Batal</Button><Button type="submit" loading={busy}>Simpan</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
