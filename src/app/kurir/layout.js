import KurirShell from "@/components/dashboard/kurir-shell";

export const metadata = { title: { default: "Dashboard Kurir", template: "%s · Kurir Phelya" } };

export default function KurirLayout({ children }) {
  return <KurirShell>{children}</KurirShell>;
}
