import { rupiah } from "@/lib/format";

/**
 * Rincian biaya: ongkir + packing (+ jemput) (- diskon) = total.
 * Menerima angka yang SUDAH dihitung server; komponen ini hanya menampilkan.
 */
export default function RincianBiaya({ ongkir = 0, packing = 0, packingNama, jemput = 0, jemputKm = 0, tampilJemput = false, diskon = 0, total = 0 }) {
  const baris = [
    ["Ongkos kirim", ongkir],
    [`Packing${packingNama && packingNama !== "Tidak" ? ` (${packingNama})` : ""}`, packing],
    ...(tampilJemput ? [[`Biaya jemput${jemputKm ? ` (${jemputKm} km)` : ""}`, jemput]] : []),
    ...(diskon > 0 ? [["Diskon member", -diskon]] : []),
  ];
  return (
    <dl className="space-y-2 text-sm">
      {baris.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4">
          <dt className="text-muted">{k}</dt>
          <dd className="font-bold">{v < 0 ? `- ${rupiah(-v)}` : rupiah(v)}</dd>
        </div>
      ))}
      <div className="flex items-end justify-between gap-4 border-t border-line pt-3">
        <dt className="font-bold">Total</dt>
        <dd className="text-2xl font-black text-primary">{rupiah(total)}</dd>
      </div>
    </dl>
  );
}
