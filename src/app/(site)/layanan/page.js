import { Check } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Mascot from "@/components/ui/mascot";
import { LAYANAN, ZONA } from "@/lib/tariff";
import { rupiah } from "@/lib/format";

export const metadata = { title: "Layanan" };

const FITUR = {
  reguler: ["Tarif paling hemat", "Lacak resi real-time", "Asuransi dasar"],
  kilat: ["Garansi sampai besok (kota utama)", "Prioritas sortir di hub", "Notifikasi tiap perubahan status"],
  same_day: ["Dijemput dan diantar di hari yang sama", "Khusus Zona 1 dan 2", "Kurir khusus"],
  kargo: ["Mulai 10 kg, hingga 100 kg", "Diangkut truk khusus", "Cocok untuk furnitur dan komoditas"],
};

export default function LayananPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
        <SectionHeading eyebrow="Layanan" title="Pilih Layanan yang Pas untuk Paketmu" subtitle="Empat layanan dengan tarif yang dihitung otomatis dari berat dan zona tujuan." align="left" className="flex-1" />
        <Mascot pose="paket" height={170} float />
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {Object.values(LAYANAN).map((l) => (
          <Card key={l.id} id={l.id} className="scroll-mt-28 p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-black">{l.nama}</h2>
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-extrabold text-accent-deep">{l.singkat}</span>
            </div>
            <p className="mt-2 text-muted">{l.deskripsi}</p>
            <ul className="mt-4 space-y-2">
              {FITUR[l.id].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-primary" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted">Minimal berat: <b className="text-fg">{l.minBerat} kg</b></p>
            <Button href={`/cek-tarif?layanan=${l.id}`} variant="secondary" size="sm" className="mt-4">Hitung ongkir</Button>
          </Card>
        ))}
      </div>

      <div className="mt-14">
        <h2 className="text-2xl font-black">Tarif Dasar per Zona</h2>
        <p className="mt-1 text-sm text-muted">Tarif per kg untuk Phelya Reguler. Layanan lain dikalikan pengali sesuai jenisnya.</p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Zona</th>
                <th className="px-5 py-3">Jarak</th>
                <th className="px-5 py-3 text-right">Tarif / kg</th>
              </tr>
            </thead>
            <tbody>
              {ZONA.map((z, i) => (
                <tr key={z.id} className="border-t border-line">
                  <td className="px-5 py-3.5 font-bold">{z.nama}</td>
                  <td className="px-5 py-3.5 text-muted">{i === 0 ? `≤ ${z.maxKm} km` : z.maxKm === Infinity ? `> ${ZONA[i - 1].maxKm} km` : `${ZONA[i - 1].maxKm + 1} – ${z.maxKm} km`}</td>
                  <td className="px-5 py-3.5 text-right font-extrabold">{rupiah(z.perKg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
