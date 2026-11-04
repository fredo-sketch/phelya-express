import Link from "next/link";
import Logo from "@/components/ui/logo";

const KOLOM = [
  {
    judul: "Layanan",
    link: [
      ["Phelya Reguler", "/layanan#reguler"],
      ["Phelya Kilat (Next Day)", "/layanan#kilat"],
      ["Phelya Same Day", "/layanan#same_day"],
      ["Phelya Kargo (>10kg)", "/layanan#kargo"],
    ],
  },
  {
    judul: "Perusahaan",
    link: [
      ["Cek Resi & Tarif", "/lacak"],
      ["Cek Tarif Pengiriman", "/cek-tarif"],
      ["Karier di Phelya", "/karier"],
      ["Masuk / Daftar", "/masuk"],
    ],
  },
  {
    judul: "Bantuan",
    link: [
      ["Pusat Bantuan", "/bantuan"],
      ["Hubungi CS 24/7", "/bantuan#kontak"],
      ["Waspada Penipuan", "/bantuan#penipuan"],
      ["Syarat & Ketentuan", "/bantuan#syarat"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface2">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            PT Phelya Ekspedisi Indonesia hadir menghubungkan jutaan kebahagiaan dari Sabang sampai Merauke lewat
            logistik yang modern, tepat waktu, dan penuh keramahan.
          </p>
        </div>
        {KOLOM.map((k) => (
          <div key={k.judul}>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary">{k.judul}</h3>
            <ul className="mt-4 space-y-2.5">
              {k.link.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted transition hover:text-accent">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted sm:px-6">
          © 2026 PT Phelya Ekspedisi Indonesia. Seluruh data pada aplikasi ini adalah data simulasi untuk keperluan tugas.
        </p>
      </div>
    </footer>
  );
}
