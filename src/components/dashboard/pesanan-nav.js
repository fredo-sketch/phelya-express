"use client";

import { LayoutDashboard, PackagePlus, Search, Truck, User } from "lucide-react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/shell";
import Button from "@/components/ui/button";
import { DataGate, useOrders } from "@/components/order-store";

const NAV = [
  { href: "/dashboard", label: "Ringkasan", short: "Ringkasan", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/pesanan", label: "Pesanan Saya", short: "Pesanan", icon: Truck },
  { href: "/dashboard/buat", label: "Buat Pesanan", short: "Buat", icon: PackagePlus },
  { href: "/dashboard/profil", label: "Profil", short: "Profil", icon: User },
];

/** Shell pelanggan; badge jumlah pesanan mengikuti data dari server. */
export default function PelangganShell({ children }) {
  const { orders, me } = useOrders();
  const user = { nama: me?.nama ?? "" };
  const roleLabel = me ? `Pelanggan ${me.tier}` : "Memuat...";
  const navDenganBadge = NAV.map((x) => (x.href === "/dashboard/pesanan" && me ? { ...x, badge: orders.length } : x));
  return (
    <DashboardShell
      nav={navDenganBadge}
      user={user}
      roleLabel={roleLabel}
      bottomNav
      sidebarNote="Kurir siap jemput paketmu hari ini."
      topAction={
        <div className="flex items-center gap-3">
          <Link href="/lacak" className="hidden max-w-sm flex-1 items-center gap-2 rounded-xl border border-line bg-surface2 px-4 py-2.5 text-sm text-muted md:flex">
            <Search className="size-4" aria-hidden /> Cari nomor resi atau nama penerima...
          </Link>
          <Button href="/dashboard/buat" size="sm" className="ml-auto">
            + Buat Pesanan Baru
          </Button>
        </div>
      }
    >
      <DataGate>{children}</DataGate>
    </DashboardShell>
  );
}
