import PelangganShell from "@/components/dashboard/pesanan-nav";

export const metadata = { title: { default: "Dashboard", template: "%s · Phelya Express" } };

export default function DashboardLayout({ children }) {
  return <PelangganShell>{children}</PelangganShell>;
}
