"use client";

import { LayoutDashboard, Radar, Bike, Wallet, Scale, Users, Briefcase } from "lucide-react";
import DashboardShell from "@/components/dashboard/shell";
import { DataGate, useOrders } from "@/components/order-store";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/order", label: "Order Tracking", icon: Radar },
  { href: "/admin/kurir", label: "Kurir", icon: Bike },
  { href: "/admin/pembayaran", label: "Pembayaran", icon: Wallet },
  { href: "/admin/tarif", label: "Tarif dan Zona", icon: Scale },
  { href: "/admin/pelanggan", label: "Pelanggan", icon: Users },
  { href: "/admin/karier", label: "Karier", icon: Briefcase },
];

export default function AdminShell({ children }) {
  const { orders, me } = useOrders();
  const menunggu = orders.filter((o) => o.status === "menunggu_kurir").length;
  const navB = NAV.map((n) => (n.href === "/admin/order" ? { ...n, badge: menunggu } : n));
  return (
    <DashboardShell nav={navB} user={{ nama: me?.nama ?? "" }} roleLabel="Admin Operasional" topAction={<p className="truncate text-sm font-bold text-muted">Operasional · Hub JKT-01</p>}>
      <DataGate>{children}</DataGate>
    </DashboardShell>
  );
}
