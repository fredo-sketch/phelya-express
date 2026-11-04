import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/badge";
import { PELANGGAN } from "@/data/mock";
import { tanggal } from "@/lib/format";

export const metadata = { title: "Pelanggan" };

export default function PelangganAdmin() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <h1 className="text-3xl font-black">Pelanggan</h1>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted"><tr>{["Nama", "Email", "Kota", "Tier", "Total Order", "Bergabung"].map((h) => <th key={h} scope="col" className="px-5 py-3.5">{h}</th>)}</tr></thead>
          <tbody>
            {PELANGGAN.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-5 py-4 font-bold">{p.nama}</td>
                <td className="px-5 py-4 text-muted">{p.email}</td>
                <td className="px-5 py-4">{p.kota}</td>
                <td className="px-5 py-4"><Pill tone={p.tier === "Gold" ? "amber" : "neutral"}>{p.tier}</Pill></td>
                <td className="px-5 py-4 font-bold">{p.totalOrder}</td>
                <td className="px-5 py-4 text-muted">{tanggal(p.bergabung)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
