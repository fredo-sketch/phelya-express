"use client";

import { useCallback, useEffect, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Pill } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Modal from "@/components/admin/modal";
import CrudTable from "@/components/admin/crud-table";
import { useToast } from "@/components/ui/toast";
import { api } from "@/components/order-store";
import { KOTA, kotaById } from "@/lib/tariff";
import { cn, tanggal } from "@/lib/format";

const HP_RE = /^(08|\+628)\d{8,11}$/;
const bersih = (v) => String(v ?? "").replace(/[\s-]/g, "");
const KOSONG_UMUM = { id: null, nama: "", hp: "", alamat: "", kota: "semarang", aktif: true };

export default function PelangganAdmin() {
  const { toast } = useToast();
  const [tab, setTab] = useState("member");
  const [st, setSt] = useState({ memuat: true, member: [], umum: [], error: "" });
  const [modal, setModal] = useState(null); // { jenis, ...data }
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  const muat = useCallback(async () => {
    const j = await api("/api/pelanggan");
    setSt(j.ok ? { memuat: false, member: j.member, umum: j.umum, error: "" } : { memuat: false, member: [], umum: [], error: j.error });
  }, []);
  useEffect(() => {
    let batal = false;
    api("/api/pelanggan").then((j) => {
      if (!batal) setSt(j.ok ? { memuat: false, member: j.member, umum: j.umum, error: "" } : { memuat: false, member: [], umum: [], error: j.error });
    });
    return () => {
      batal = true;
    };
  }, []);

  async function simpan(e) {
    e.preventDefault();
    if (busy) return;
    const n = {};
    if (modal.nama.trim().length < 2) n.nama = "Nama minimal 2 karakter.";
    if (modal.jenis === "umum" || modal.hp) if (!HP_RE.test(bersih(modal.hp))) n.hp = "Nomor HP tidak valid.";
    if (modal.jenis === "umum" && modal.alamat.trim().length < 5) n.alamat = "Alamat minimal 5 karakter.";
    setErr(n);
    if (Object.keys(n).length) return;
    setBusy(true);
    const badan = { ...modal };
    const j = modal.id ? await api(`/api/pelanggan/${modal.id}`, { method: "PATCH", body: badan }) : await api("/api/pelanggan", { method: "POST", body: badan });
    setBusy(false);
    if (!j.ok) return toast({ type: "error", title: "Pelanggan belum tersimpan", description: j.error });
    setModal(null);
    await muat();
    toast({ type: "success", title: modal.id ? "Data pelanggan diperbarui" : "Pelanggan ditambahkan" });
  }

  async function hapus(jenis, r) {
    const j = await api(`/api/pelanggan/${r.id}?jenis=${jenis}`, { method: "DELETE" });
    if (!j.ok) return toast({ type: "error", title: "Gagal menghapus", description: j.error });
    await muat();
    toast({ type: "success", title: j.dinonaktifkan ? "Pelanggan dinonaktifkan" : "Pelanggan dihapus", description: j.dinonaktifkan ? "Riwayat pesanannya tetap tersimpan." : undefined });
  }

  const kotaOpsi = KOTA.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>);
  const status = (r) => <Pill tone={r.aktif ? "teal" : "neutral"}>{r.aktif ? "Aktif" : "Nonaktif"}</Pill>;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent-deep">Admin / Pelanggan</p>
        <h1 className="text-3xl font-black">Data Pelanggan</h1>
        <p className="text-muted">Membership (punya akun, riwayat pengiriman) dan pelanggan umum (kirim sekali, diinput admin).</p>
      </div>

      <div role="tablist" aria-label="Jenis pelanggan" className="inline-flex rounded-full bg-soft p-1">
        {[["member", `Membership (${st.member.length})`], ["umum", `Umum (${st.umum.length})`]].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-full px-5 py-2 text-sm font-bold transition", tab === k ? "bg-accent text-white" : "text-muted hover:text-fg")}>{l}</button>
        ))}
      </div>

      {tab === "member" ? (
        <CrudTable
          key="member"
          cariLabel="Cari nama, email, atau HP"
          baris={st.member}
          memuat={st.memuat}
          galat={st.error}
          teksCari={(r) => `${r.nama} ${r.email} ${r.hp}`}
          onEdit={(r) => { setErr({}); setModal({ jenis: "member", ...r }); }}
          onHapus={(r) => hapus("member", r)}
          kosong="Belum ada pelanggan membership."
          kolom={[
            { label: "Nama", render: (r) => <span className="font-bold">{r.nama}</span> },
            { label: "Email", render: (r) => <span className="text-muted">{r.email}</span> },
            { label: "HP", render: (r) => r.hp || "-" },
            { label: "Kota", render: (r) => kotaById(r.kota)?.nama ?? "-" },
            { label: "Tier", render: (r) => <Pill tone={r.tier === "Gold" ? "amber" : "neutral"}>{r.tier}</Pill> },
            { label: "Order", render: (r) => <b>{r.totalOrder}</b> },
            { label: "Status", render: status },
          ]}
        />
      ) : (
        <CrudTable
          key="umum"
          cariLabel="Cari nama atau HP"
          tambahLabel="Tambah Pelanggan Umum"
          baris={st.umum}
          memuat={st.memuat}
          galat={st.error}
          teksCari={(r) => `${r.nama} ${r.hp} ${r.alamat}`}
          onTambah={() => { setErr({}); setModal({ jenis: "umum", ...KOSONG_UMUM }); }}
          onEdit={(r) => { setErr({}); setModal({ jenis: "umum", ...r }); }}
          onHapus={(r) => hapus("umum", r)}
          kosong="Belum ada pelanggan umum."
          kolom={[
            { label: "Nama", render: (r) => <span className="font-bold">{r.nama}</span> },
            { label: "HP", render: (r) => r.hp },
            { label: "Alamat", render: (r) => <span className="text-muted">{r.alamat}</span> },
            { label: "Kota", render: (r) => kotaById(r.kota)?.nama ?? "-" },
            { label: "Order", render: (r) => <b>{r.totalOrder}</b> },
            { label: "Sejak", render: (r) => <span className="text-muted">{tanggal(r.bergabung)}</span> },
            { label: "Status", render: status },
          ]}
        />
      )}

      {modal && (
        <Modal judul={`${modal.id ? "Ubah" : "Tambah"} Pelanggan ${modal.jenis === "member" ? "Membership" : "Umum"}`} onClose={() => setModal(null)}>
          <form onSubmit={simpan} noValidate className="space-y-4">
            <Field label="Nama" required error={err.nama}>{(p) => <Input {...p} value={modal.nama} invalid={!!err.nama} onChange={(e) => setModal({ ...modal, nama: e.target.value })} />}</Field>
            {modal.jenis === "member" && <p className="text-xs text-muted">Email: <b>{modal.email}</b> (terhubung ke akun login, tidak diubah dari sini).</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nomor HP" required={modal.jenis === "umum"} error={err.hp}>{(p) => <Input {...p} type="tel" inputMode="tel" value={modal.hp} invalid={!!err.hp} onChange={(e) => setModal({ ...modal, hp: e.target.value })} />}</Field>
              <Field label="Kota">{(p) => <Select {...p} value={modal.kota ?? ""} onChange={(e) => setModal({ ...modal, kota: e.target.value })}>{modal.jenis === "member" && <option value="">-</option>}{kotaOpsi}</Select>}</Field>
            </div>
            {modal.jenis === "umum" && <Field label="Alamat" required error={err.alamat}>{(p) => <Textarea {...p} value={modal.alamat} invalid={!!err.alamat} onChange={(e) => setModal({ ...modal, alamat: e.target.value })} />}</Field>}
            {modal.jenis === "member" && (
              <Field label="Tier">{(p) => <Select {...p} value={modal.tier} onChange={(e) => setModal({ ...modal, tier: e.target.value })}><option>Bronze</option><option>Silver</option><option>Gold</option></Select>}</Field>
            )}
            <Field label="Status">{(p) => <Select {...p} value={modal.aktif ? "1" : "0"} onChange={(e) => setModal({ ...modal, aktif: e.target.value === "1" })}><option value="1">Aktif</option><option value="0">Nonaktif</option></Select>}</Field>
            <div className="flex justify-end gap-3 pt-2"><Button variant="ghost" onClick={() => setModal(null)} disabled={busy}>Batal</Button><Button type="submit" loading={busy}>Simpan</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
