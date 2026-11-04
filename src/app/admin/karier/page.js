import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { LOWONGAN } from "@/data/mock";
import { tanggal } from "@/lib/format";

export const metadata = { title: "Karier" };

export default function KarierAdmin() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-black">Karier</h1><p className="text-muted">{LOWONGAN.length} lowongan aktif.</p></div>
        <Button href="/karier" variant="secondary">Lihat halaman publik</Button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted"><tr>{["Posisi", "Divisi", "Lokasi", "Tipe", "Batas"].map((h) => <th key={h} scope="col" className="px-5 py-3.5">{h}</th>)}</tr></thead>
          <tbody>
            {LOWONGAN.map((l) => (
              <tr key={l.slug} className="border-t border-line">
                <td className="px-5 py-4 font-bold">{l.judul}</td>
                <td className="px-5 py-4 text-muted">{l.divisi}</td>
                <td className="px-5 py-4">{l.lokasi}</td>
                <td className="px-5 py-4"><Pill tone="amber">{l.tipe}</Pill></td>
                <td className="px-5 py-4 text-muted">{tanggal(l.batas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
