"use client";

import { LayoutDashboard, PackagePlus, Search, Truck, User } from "lucide-react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/shell";
import Button from "@/components/ui/button";
import { useOrders } from "@/components/order-store";
import { PELANGGAN_AKTIF } from "@/data/mock";

const NAV = [
  { href: "/dashboard", label: "Ringkasan", short: "Ringkasan", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/pesanan", label: "Pesanan Saya", short: "Pesanan", icon: Truck },
  { href: "/dashboard/buat", label: "Buat Pesanan", short: "Buat", icon: PackagePlus },
  { href: "/dashboard/profil", label: "Profil", short: "Profil", icon: User },
];

/** Shell pelanggan; badge jumlah pesanan mengikuti data store. */
export default function PelangganShell({ children }) {
  const user = PELANGGAN_AKTIF;
  const roleLabel = PELANGGAN_AKTIF.tier;
  const nav = NAV;
  const { orders } = useOrders();
  const n = orders.filter((o) => o.ownerId === PELANGGAN_AKTIF.id).length;
  const navDenganBadge = nav.map((x) => (x.href === "/dashboard/pesanan" ? { ...x, badge: n } : x));
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
      {children}
    </DashboardShell>
  );
}
