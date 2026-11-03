import AdminShell from "@/components/dashboard/admin-shell";

export const metadata = { title: { default: "Admin", template: "%s · Admin Phelya" } };

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
