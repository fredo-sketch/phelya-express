"use client";

import { useState } from "react";
import { Mail, Phone, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { NotifButton } from "@/components/tracking/resi-actions";
import { useOrders } from "@/components/order-store";

export default function Profil() {
  const { toast } = useToast();
  const { me, ubahProfil } = useOrders();
  const [f, setF] = useState({ nama: me.nama, hp: me.hp });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);

  async function simpan(e) {
    e.preventDefault();
    if (loading) return;
    const n = {};
    if (f.nama.trim().length < 3) n.nama = "Nama minimal 3 karakter.";
    if (!/^(08|\+628)\d{8,11}$/.test(f.hp.replace(/[\s-]/g, ""))) n.hp = "Nomor HP tidak valid.";
    setErr(n);
    if (Object.keys(n).length) return;
    setLoading(true);
    const h = await ubahProfil({ nama: f.nama.trim(), hp: f.hp.replace(/[\s-]/g, "") });
    setLoading(false);
    if (h.ok) toast({ type: "success", title: "Profil disimpan" });
    else toast({ type: "error", title: "Gagal menyimpan profil", description: h.error });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-black">Profil</h1>
      <Card className="p-6">
        <form onSubmit={simpan} noValidate className="space-y-4">
          <Field label="Nama lengkap" required error={err.nama}>{(p) => <Input {...p} icon={UserRound} value={f.nama} invalid={!!err.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} />}</Field>
          <Field label="Email" hint="Email tidak dapat diubah."> {(p) => <Input {...p} icon={Mail} value={me.email} disabled />}</Field>
          <Field label="Nomor HP" required error={err.hp}>{(p) => <Input {...p} icon={Phone} type="tel" value={f.hp} invalid={!!err.hp} onChange={(e) => setF({ ...f, hp: e.target.value })} />}</Field>
          <Button type="submit" loading={loading}>Simpan Perubahan</Button>
        </form>
      </Card>
      <Card className="p-6">
        <h2 className="text-lg font-black">Notifikasi Status Paket</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Aktifkan notifikasi browser supaya kamu tahu saat status paket berubah.</p>
        <NotifButton />
      </Card>
    </div>
  );
}
