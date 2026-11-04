import { Phone, Mail, ShieldAlert, FileText, MessageCircleQuestion } from "lucide-react";
import { Card } from "@/components/ui/card";
import Mascot from "@/components/ui/mascot";

export const metadata = { title: "Bantuan" };

const FAQ = [
  ["Bagaimana cara melacak paket?", "Buka halaman Lacak Paket, masukkan nomor resi berawalan PEX diikuti 10 angka, lalu tekan Lacak."],
  ["Kapan paket saya dijemput?", "Kurir menjemput di hari yang sama untuk pesanan sebelum pukul 15.00 WIB, selebihnya keesokan hari."],
  ["Apakah saya bisa membatalkan pesanan?", "Bisa, selama status masih Menunggu Kurir. Setelah paket diambil kurir, pesanan tidak dapat dibatalkan."],
  ["Bagaimana jika paket gagal diantar?", "Kurir akan mencatat alasannya. Paket kembali ke hub dan kamu bisa menjadwalkan ulang pengantaran."],
];

export default function BantuanPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-3xl font-black md:text-4xl">Pusat Bantuan</h1>
          <p className="mt-2 text-muted">Pertanyaan umum dan cara menghubungi tim Phelya Express.</p>
        </div>
        <Mascot pose="sapa" height={120} float className="hidden sm:block" />
      </div>

      <section className="mt-10" aria-labelledby="faq">
        <h2 id="faq" className="flex items-center gap-2 text-xl font-black"><MessageCircleQuestion className="size-5 text-primary" aria-hidden /> Pertanyaan Umum</h2>
        <div className="mt-4 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-line bg-surface p-5 open:shadow-card">
              <summary className="cursor-pointer list-none font-extrabold marker:hidden">{q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card id="kontak" className="scroll-mt-28 p-6">
          <h2 className="text-xl font-black">Hubungi Kami</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-3"><Phone className="size-4 text-primary" aria-hidden /> CS 24/7: 021-3020-5050</li>
            <li className="flex items-center gap-3"><Mail className="size-4 text-primary" aria-hidden /> bantuan@phelya.id</li>
          </ul>
          <p className="mt-4 text-xs text-muted">Nomor dan email pada halaman ini adalah data simulasi.</p>
        </Card>
        <Card id="penipuan" className="scroll-mt-28 border-accent/40 p-6">
          <h2 className="flex items-center gap-2 text-xl font-black"><ShieldAlert className="size-5 text-accent" aria-hidden /> Waspada Penipuan</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">Phelya Express tidak pernah meminta transfer, kode OTP, atau scan QR lewat chat pribadi. Jika ada yang mengaku dari Phelya dan meminta hal tersebut, abaikan dan laporkan ke CS.</p>
        </Card>
      </div>

      <Card id="syarat" className="mt-6 scroll-mt-28 p-6">
        <h2 className="flex items-center gap-2 text-xl font-black"><FileText className="size-5 text-primary" aria-hidden /> Syarat & Ketentuan Singkat</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li>Barang yang dilarang: bahan peledak, zat berbahaya, dan barang ilegal.</li>
          <li>Berat dan dimensi dihitung berdasarkan berat tertagih.</li>
          <li>Pembatalan hanya dapat dilakukan sebelum paket diambil kurir.</li>
          <li>Ini adalah aplikasi simulasi untuk tugas, bukan layanan ekspedisi sungguhan.</li>
        </ul>
      </Card>
    </div>
  );
}
