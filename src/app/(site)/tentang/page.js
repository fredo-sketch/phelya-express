import Link from "next/link";

export const metadata = {
  title: "Tentang Kami | Phelya Express",
  description:
    "Kenali Phelya Express, layanan pengiriman paket untuk pelanggan, kurir, dan admin.",
};

const nilai = [
  {
    judul: "Tarif transparan",
    isi: "Ongkir dihitung otomatis berdasarkan jarak, berat, dan jenis layanan.",
  },
  {
    judul: "Pelacakan paket",
    isi: "Pantau status paket kapan saja hanya dengan nomor resi.",
  },
  {
    judul: "Notifikasi langsung",
    isi: "Setiap perubahan status paket diberitahukan lewat notifikasi.",
  },
];

export default function TentangPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Tentang Phelya Express</h1>

      <p className="mt-4 opacity-80">
        Phelya Express adalah aplikasi web pengiriman paket yang menghubungkan
        pelanggan, kurir, dan admin dalam satu platform. Kirim, lacak, antar,
        dan kelola paket dengan mudah.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {nilai.map((item) => (
          <div
            key={item.judul}
            className="rounded-xl border border-current/20 p-4"
          >
            <h2 className="font-semibold">{item.judul}</h2>
            <p className="mt-2 text-sm opacity-80">{item.isi}</p>
          </div>
        ))}
      </div>

      <Link
        href="/lacak"
        className="mt-10 inline-block font-semibold underline"
      >
        Lacak paketmu sekarang
      </Link>
    </main>
  );
}