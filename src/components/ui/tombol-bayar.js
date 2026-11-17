"use client";

import { useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useOrders } from "@/components/order-store";
import { bayarMidtrans, sinkronMidtrans } from "@/lib/midtrans-client";

/**
 * Bayar via Midtrans Snap (pop-up) + "Cek status" sebagai cadangan bila webhook terlambat.
 * Nominal tidak dikirim dari sini: server memakai total yang tersimpan di database.
 */
export default function TombolBayar({ resi, size = "md", className }) {
  const { toast } = useToast();
  const { muat } = useOrders();
  const [busy, setBusy] = useState(false);
  const [cek, setCek] = useState(false);

  async function periksa({ senyap = false } = {}) {
    setCek(true);
    const j = await sinkronMidtrans(resi);
    setCek(false);
    if (!j.ok) return !senyap && toast({ type: "error", title: "Gagal memeriksa pembayaran", description: j.error });
    await muat({ senyap: true });
    if (j.bayar === "lunas") toast({ type: "success", title: "Pembayaran berhasil", description: `Pesanan ${resi} sudah lunas.` });
    else if (!senyap) toast({ type: "info", title: "Belum ada pembayaran masuk", description: `Status di Midtrans: ${j.status}.` });
  }

  async function bayar() {
    if (busy) return;
    setBusy(true);
    await bayarMidtrans(resi, {
      onSukses: () => { setBusy(false); periksa({ senyap: true }); },
      onPending: () => { setBusy(false); toast({ type: "info", title: "Menunggu pembayaran", description: "Selesaikan pembayaran, lalu tekan Cek status." }); },
      onTutup: () => { setBusy(false); periksa({ senyap: true }); },
      onGalat: (pesan) => { setBusy(false); toast({ type: "error", title: "Pembayaran tidak bisa dimulai", description: pesan }); },
    });
  }

  return (
    <div className={className ?? "flex flex-wrap gap-2"}>
      <Button size={size} icon={CreditCard} loading={busy} onClick={bayar}>Bayar dengan Midtrans</Button>
      <Button size={size} variant="secondary" icon={RefreshCw} loading={cek} onClick={() => periksa()}>Cek status</Button>
    </div>
  );
}
