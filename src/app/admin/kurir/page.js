"use client";

import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/badge";
import { useOrders } from "@/components/order-store";
import { KURIR } from "@/data/mock";

export default function KurirAdmin() {
  const { orders } = useOrders();
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h1 className="text-3xl font-black">Kurir</h1>
        <p className="text-muted">{KURIR.filter((k) => k.aktif).length} kurir aktif dari {KURIR.length} terdaftar.</p>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
            <tr>{["Kode", "Nama", "Hub", "Kendaraan", "Tugas Aktif", "Status"].map((h) => <th key={h} scope="col" className="px-5 py-3.5">{h}</th>)}</tr>
          </thead>
          <tbody>
            {KURIR.map((k) => (
              <tr key={k.id} className="border-t border-line">
                <td className="px-5 py-4 font-mono font-bold text-primary">{k.kode}</td>
                <td className="px-5 py-4 font-bold">{k.nama}</td>
                <td className="px-5 py-4 text-muted">{k.hub}</td>
                <td className="px-5 py-4">{k.kendaraan} · {k.plat}</td>
                <td className="px-5 py-4 font-bold">{orders.filter((o) => o.kurirId === k.id && ["diambil", "dalam_perjalanan"].includes(o.status)).length} paket</td>
                <td className="px-5 py-4"><Pill tone={k.aktif ? "info" : "neutral"}>{k.aktif ? "Aktif" : "Nonaktif"}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
