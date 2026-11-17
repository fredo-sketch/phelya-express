"use client";

import { useState } from "react";
import Modal from "@/components/admin/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useOrders } from "@/components/order-store";

const HP_RE = /^(08|\+628)\d{8,11}$/;
const bersih = (v) => String(v ?? "").replace(/[\s-]/g, "");

/** Admin mengubah kontak, alamat, isi paket, dan catatan. Harga, rute, berat, layanan terkunci di database. */
export default function UbahOrderModal({ order: o, onClose }) {
  const { toast } = useToast();
  const { ubahOrder } = useOrders();
  const [f, setF] = useState({
    pNama: o.pengirim.nama, pHp: o.pengirim.hp, pAlamat: o.pengirim.alamat,
    rNama: o.penerima.nama, rHp: o.penerima.hp, rAlamat: o.penerima.alamat, isi: o.barang.isi, catatan: o.catatan ?? "",
  });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function simpan(e) {
    e.preventDefault();
    if (busy) return;
    const n = {};
    if (f.pNama.trim().length < 2) n.pNama = "Minimal 2 karakter.";
    if (f.rNama.trim().length < 2) n.rNama = "Minimal 2 karakter.";
    if (!HP_RE.test(bersih(f.pHp))) n.pHp = "Nomor HP tidak valid.";
    if (!HP_RE.test(bersih(f.rHp))) n.rHp = "Nomor HP tidak valid.";
    if (f.pAlamat.trim().length < 5) n.pAlamat = "Minimal 5 karakter.";
    if (f.rAlamat.trim().length < 5) n.rAlamat = "Minimal 5 karakter.";
    if (f.isi.trim().length < 2) n.isi = "Isi paket wajib diisi.";
    if (f.catatan.length > 300) n.catatan = "Maksimal 300 karakter.";
    setErr(n);
    if (Object.keys(n).length) return;
    setBusy(true);
    const j = await ubahOrder(o.resi, f);
    setBusy(false);
    if (!j.ok) return toast({ type: "error", title: "Perubahan belum tersimpan", description: j.error });
    toast({ type: "success", title: "Data pesanan diperbarui", description: o.resi });
    onClose();
  }

  return (
    <Modal judul={`Ubah ${o.resi}`} onClose={() => !busy && onClose()} lebar="max-w-2xl">
      <form onSubmit={simpan} noValidate className="space-y-4">
        <p className="rounded-xl bg-accent-soft/50 px-4 py-3 text-xs text-accent-deep">Harga, rute, berat, dan layanan tidak bisa diubah setelah pesanan dibuat. Untuk mengubahnya, batalkan lalu buat pesanan baru.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama pengirim" required error={err.pNama}>{(p) => <Input {...p} value={f.pNama} invalid={!!err.pNama} onChange={set("pNama")} />}</Field>
          <Field label="HP pengirim" required error={err.pHp}>{(p) => <Input {...p} type="tel" value={f.pHp} invalid={!!err.pHp} onChange={set("pHp")} />}</Field>
        </div>
        <Field label="Alamat pengirim" required error={err.pAlamat}>{(p) => <Textarea {...p} value={f.pAlamat} invalid={!!err.pAlamat} onChange={set("pAlamat")} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama penerima" required error={err.rNama}>{(p) => <Input {...p} value={f.rNama} invalid={!!err.rNama} onChange={set("rNama")} />}</Field>
          <Field label="HP penerima" required error={err.rHp}>{(p) => <Input {...p} type="tel" value={f.rHp} invalid={!!err.rHp} onChange={set("rHp")} />}</Field>
        </div>
        <Field label="Alamat penerima" required error={err.rAlamat}>{(p) => <Textarea {...p} value={f.rAlamat} invalid={!!err.rAlamat} onChange={set("rAlamat")} />}</Field>
        <Field label="Isi paket" required error={err.isi}>{(p) => <Input {...p} value={f.isi} invalid={!!err.isi} onChange={set("isi")} />}</Field>
        <Field label="Catatan" error={err.catatan}>{(p) => <Textarea {...p} value={f.catatan} invalid={!!err.catatan} onChange={set("catatan")} />}</Field>
        <div className="flex justify-end gap-3 pt-2"><Button variant="ghost" onClick={onClose} disabled={busy}>Batal</Button><Button type="submit" loading={busy}>Simpan</Button></div>
      </form>
    </Modal>
  );
}
