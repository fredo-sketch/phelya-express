"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { BayarBadge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useOrders } from "@/components/order-store";
import { rupiah, tanggalJam } from "@/lib/format";

export default function Pembayaran() {
  const { orders, konfirmasiBayar } = useOrders();
  const { toast } = useToast();
  const [busy, setBusy] = useState(null);
  const tertunda = orders.filter((o) => o.bayar !== "lunas" && o.status !== "dibatalkan");
  const lunas = orders.filter((o) => o.bayar === "lunas");

  async function konfirmasi(o) {
    if (busy) return;
    setBusy(o.resi);
    await new Promise((r) => setTimeout(r, 600));
    konfirmasiBayar(o.resi);
    setBusy(null);
    toast({ type: "success", title: "Pembayaran dikonfirmasi", description: o.resi });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h1 className="text-3xl font-black">Pembayaran</h1>
        <p className="text-muted">Pencatatan dan konfirmasi pembayaran oleh admin. Total lunas: <b className="text-primary">{rupiah(lunas.reduce((a, o) => a + o.ongkir, 0))}</b></p>
      </div>
      <Card className="overflow-x-auto">
        <div className="p-5 pb-2"><h2 className="text-lg font-black">Menunggu Konfirmasi ({tertunda.length})</h2></div>
        {tertunda.length === 0 ? (
          <EmptyState compact pose="sukses" title="Semua pembayaran sudah lunas" />
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted"><tr>{["Resi", "Pengirim", "Jumlah", "Metode", "Dibuat", ""].map((h) => <th key={h} scope="col" className="px-5 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {tertunda.map((o) => (
                <tr key={o.resi} className="border-t border-line">
                  <td className="px-5 py-3.5 font-mono font-bold text-primary">{o.resi}</td>
                  <td className="px-5 py-3.5 font-bold">{o.pengirim.nama}</td>
                  <td className="px-5 py-3.5 font-extrabold">{rupiah(o.ongkir)}</td>
                  <td className="px-5 py-3.5"><BayarBadge bayar={o.bayar} /></td>
                  <td className="px-5 py-3.5 text-muted">{tanggalJam(o.dibuat)}</td>
                  <td className="px-5 py-3.5"><Button size="sm" loading={busy === o.resi} onClick={() => konfirmasi(o)}>Konfirmasi</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
