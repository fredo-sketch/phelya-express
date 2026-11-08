"use client";

import { ClipboardList, History, UserRound } from "lucide-react";
import DashboardShell from "@/components/dashboard/shell";
import { DataGate, useOrders } from "@/components/order-store";

const NAV = [
  { href: "/kurir", label: "Tugas", icon: ClipboardList, exact: true },
  { href: "/kurir/riwayat", label: "Riwayat", icon: History },
  { href: "/kurir/profil", label: "Profil", icon: UserRound },
];

export default function KurirShell({ children }) {
  const { orders, me, kurirSaya } = useOrders();
  const aktif = orders.filter((o) => ["diambil", "dalam_perjalanan", "gagal"].includes(o.status)).length;
  const navB = NAV.map((n) => (n.href === "/kurir" && aktif ? { ...n, badge: aktif } : n));
  return (
    <DashboardShell
      nav={navB}
      user={{ nama: kurirSaya?.nama ?? me?.nama ?? "" }}
      roleLabel={kurirSaya ? `Kurir · ${kurirSaya.kode}` : "Kurir"}
      bottomNav
      topAction={
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-extrabold text-primary-strong">
            <span className="size-2 rounded-full bg-primary" aria-hidden /> Online
          </span>
          <span className="hidden text-sm text-muted sm:inline">{kurirSaya?.hub}</span>
        </div>
      }
    >
      <DataGate>{children}</DataGate>
    </DashboardShell>
  );
}
