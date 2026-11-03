"use client";

import { CircleCheck, Hourglass, Package, Truck, Wallet } from "lucide-react";
import StatCard from "@/components/dashboard/stat-card";
import { LineChart, Donut } from "@/components/dashboard/charts";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useOrders } from "@/components/order-store";
import { kotaById } from "@/lib/tariff";
import { rupiah, tanggalJam } from "@/lib/format";

const PERIODE = { labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"], order: [42, 55, 49, 71, 64, 88, 60] };

export default function AdminDashboard() {
  const { orders } = useOrders();
  const hitung = (s) => orders.filter((o) => o.status === s).length;
  const pendapatan = orders.filter((o) => o.bayar === "lunas").reduce((a, o) => a + o.ongkir, 0);

  const donut = [
    { label: "Menunggu Kurir", value: hitung("menunggu_kurir"), color: "#B6ACAD" },
    { label: "Diambil Kurir", value: hitung("diambil"), color: "#F6C0A6" },
    { label: "Dalam Perjalanan", value: hitung("dalam_perjalanan"), color: "#E57734" },
    { label: "Sampai Tujuan", value: hitung("sampai"), color: "#01757A" },
    { label: "Gagal / Batal", value: hitung("gagal") + hitung("dibatalkan"), color: "#C0392B" },
  ].filter((d) => d.value > 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Dashboard</h1>
          <p className="text-muted">Ringkasan operasional dari seluruh order.</p>
        </div>
        <Button href="/admin/order" variant="secondary">Buka Order Tracking</Button>
      </div>

      <section aria-label="Statistik" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Order" value={orders.length} icon={Package} tone="neutral" />
        <StatCard label="Menunggu Kurir" value={hitung("menunggu_kurir")} icon={Hourglass} />
        <StatCard label="Dalam Perjalanan" value={hitung("dalam_perjalanan") + hitung("diambil")} icon={Truck} />
        <StatCard label="Selesai" value={hitung("sampai")} icon={CircleCheck} tone="teal" />
        <StatCard label="Pendapatan" value={rupiah(pendapatan)} icon={Wallet} tone="teal" className="col-span-2 lg:col-span-1" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-black">Order per Hari (7 hari terakhir)</h2>
          <p className="mb-3 text-sm text-muted">Data simulasi.</p>
          <LineChart data={PERIODE.order} labels={PERIODE.labels} />
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-black">Distribusi Status</h2>
          <Donut items={donut} />
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <div className="p-5 pb-2"><h2 className="text-lg font-black">Order Terbaru</h2></div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
            <tr>{["Resi", "Penerima", "Tujuan", "Status", "Waktu"].map((h) => <th key={h} scope="col" className="px-5 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {[...orders].sort((a, b) => new Date(b.dibuat) - new Date(a.dibuat)).slice(0, 5).map((o) => (
              <tr key={o.resi} className="border-t border-line">
                <td className="px-5 py-3.5 font-mono font-bold text-primary">{o.resi}</td>
                <td className="px-5 py-3.5 font-bold">{o.penerima.nama}</td>
                <td className="px-5 py-3.5 text-muted">{kotaById(o.penerima.kota)?.nama}</td>
                <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3.5 text-muted">{tanggalJam(o.dibuat)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
