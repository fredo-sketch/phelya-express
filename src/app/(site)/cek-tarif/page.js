import TariffCalculator from "@/components/sections/tariff-calculator";

export const metadata = { title: "Cek Tarif" };

export default async function CekTarifPage({ searchParams }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-black md:text-4xl">Cek Tarif Pengiriman</h1>
      <p className="mt-2 mb-8 text-muted">Hitung ongkos kirim otomatis berdasarkan kota, berat, dan layanan. Tarif bersifat estimasi.</p>
      <TariffCalculator initial={{ asal: sp?.asal, tujuan: sp?.tujuan, berat: sp?.berat, layanan: sp?.layanan }} />
    </div>
  );
}
