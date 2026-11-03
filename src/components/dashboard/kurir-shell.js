"use client";

import { ClipboardList, History, UserRound } from "lucide-react";
import DashboardShell from "@/components/dashboard/shell";
import { useOrders } from "@/components/order-store";
import { KURIR_AKTIF_ID, getKurir } from "@/data/mock";

const NAV = [
  { href: "/kurir", label: "Tugas", icon: ClipboardList, exact: true },
  { href: "/kurir/riwayat", label: "Riwayat", icon: History },
  { href: "/kurir/profil", label: "Profil", icon: UserRound },
];

export default function KurirShell({ children }) {
  const { orders } = useOrders();
  const kurir = getKurir(KURIR_AKTIF_ID);
  const aktif = orders.filter((o) => o.kurirId === KURIR_AKTIF_ID && ["diambil", "dalam_perjalanan", "gagal"].includes(o.status)).length;
  const navB = NAV.map((n) => (n.href === "/kurir" && aktif ? { ...n, badge: aktif } : n));
  return (
    <DashboardShell
      nav={navB}
      user={{ nama: kurir.nama }}
      roleLabel={`Kurir · ${kurir.kode}`}
      bottomNav
      topAction={
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-extrabold text-primary-strong">
            <span className="size-2 rounded-full bg-primary" aria-hidden /> Online
          </span>
          <span className="hidden text-sm text-muted sm:inline">{kurir.hub}</span>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
