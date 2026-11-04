"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import Button from "@/components/ui/button";
import { useOrders } from "@/components/order-store";
import { KURIR_AKTIF_ID } from "@/data/mock";
import { tanggalJam } from "@/lib/format";

export default function Riwayat() {
  const { orders } = useOrders();
  const selesai = orders.filter((o) => o.kurirId === KURIR_AKTIF_ID && ["sampai", "gagal"].includes(o.status));
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-black">Riwayat</h1>
      {selesai.length === 0 ? (
        <Card><EmptyState pose="santai" title="Belum ada riwayat" description="Tugas yang selesai atau gagal kirim muncul di sini." /></Card>
      ) : (
        <ul className="space-y-3">
          {selesai.map((o) => (
            <li key={o.resi}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-mono font-black">{o.resi}</p>
                  <p className="truncate text-sm text-muted">{o.penerima.nama}</p>
                  <p className="text-xs text-muted">{tanggalJam(o.timeline[0].waktu)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge status={o.status} />
                  <Button href={`/kurir/tugas/${o.resi}`} size="sm" variant="secondary">Detail</Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
