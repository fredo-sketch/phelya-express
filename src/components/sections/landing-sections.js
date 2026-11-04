import Link from "next/link";
import {
  Truck, Zap, Clock, Boxes, ArrowRight, FilePenLine, Bike, Radar, BadgeCheck,
  MapPinned, BellRing, Wallet, Smile, Smartphone, Send,
} from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import Mascot from "@/components/ui/mascot";
import Button from "@/components/ui/button";
import { LAYANAN } from "@/lib/tariff";

const IKON_LAYANAN = { reguler: Truck, kilat: Zap, same_day: Clock, kargo: Boxes };
const TARIF_AWAL = { reguler: "Rp 8.000 / kg", kilat: "Rp 12.800 / kg", same_day: "Rp 19.200 / kg", kargo: "Rp 5.600 / kg" };

export function ServicesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Solusi kirim fleksibel"
        title="Pilihan Layanan Sesuai Kebutuhanmu"
        subtitle="Apapun paketnya, dari dokumen penting sampai barang niaga besar, kami antarkan dengan standar keamanan yang sama."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Object.values(LAYANAN).map((l) => {
          const Icon = IKON_LAYANAN[l.id];
          const populer = l.id === "kilat";
          return (
            <Card
              key={l.id}
              className={`relative flex flex-col p-6 transition hover:-translate-y-1 ${populer ? "border-2 border-accent" : ""}`}
            >
              {populer && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  Paling populer
                </span>
              )}
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-6" aria-hidden />
              </span>
              <div className="mt-5 flex items-center gap-2">
                <h3 className="text-lg font-extrabold">{l.nama}</h3>
              </div>
              <span className="mt-1 w-fit rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent-deep">{l.singkat}</span>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{l.deskripsi}</p>
              <div className="mt-5 border-t border-line pt-4 text-sm">
                <p className="text-muted">Tarif mulai</p>
                <p className="font-extrabold">{TARIF_AWAL[l.id]}</p>
              </div>
              <Link href={`/layanan#${l.id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-primary hover:text-accent">
                Pelajari tarif <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

const LANGKAH = [
  { icon: FilePenLine, judul: "Buat Pesanan", teks: "Isi detail alamat dan paket lewat web atau antar ke drop point terdekat." },
  { icon: Bike, judul: "Kurir Jemput", teks: "Mitra kurir terverifikasi datang menjemput paket tanpa minimum jumlah pengiriman." },
  { icon: Radar, judul: "Lacak Real-Time", teks: "Pantau posisi perjalanan kurir dan status transit langsung lewat peta akurat." },
  { icon: BadgeCheck, judul: "Paket Sampai", teks: "Penerima menerima barang dalam kondisi prima lengkap dengan bukti serah terima foto." },
];

export function StepsSection() {
  return (
    <section className="bg-surface2">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow="Alur praktis" title="Mudahnya Mengirim Paket Bersama Phelya" align="left" />
          <div className="flex items-end gap-2">
            <div className="relative rounded-2xl rounded-br-sm bg-surface px-4 py-3 text-sm font-semibold shadow-card ring-1 ring-line">
              “Tenang, Phely siap menjemput paketmu langsung di depan pintu!”
            </div>
            <Mascot pose="semangat" height={110} float />
          </div>
        </div>
        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          <span className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-0.5 border-t-2 border-dashed border-primary/40 md:block" aria-hidden />
          {LANGKAH.map((l, i) => (
            <li key={l.judul} className="relative flex flex-col items-center text-center">
              <span
                className={`relative z-10 flex size-16 items-center justify-center rounded-full text-white shadow-card ring-8 ring-surface2 ${i === 2 ? "bg-accent" : i === 3 ? "bg-accent-deep/70" : "bg-primary"}`}
              >
                <l.icon className="size-7" aria-hidden />
              </span>
              <span className="mt-4 text-[11px] font-extrabold uppercase tracking-widest text-muted">Langkah {i + 1}</span>
              <h3 className="mt-1 text-lg font-extrabold">{l.judul}</h3>
              <p className="mt-2 max-w-[230px] text-sm leading-relaxed text-muted">{l.teks}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const KEUNGGULAN = [
  { icon: MapPinned, judul: "Tracking Real-time Akurat", teks: "Tidak perlu menebak-nebak lagi. Setiap pergerakan kurir awal hingga tangan penerima bisa kamu pantau." },
  { icon: BellRing, judul: "Notifikasi Langsung", teks: "Pembaruan status dikirim ke browser lewat Web Push, jadi kamu tahu paketmu bergerak tanpa membuka aplikasi." },
  { icon: Wallet, judul: "Tarif Transparan & Pasti", teks: "Semua ongkos kirim dihitung transparan tanpa biaya tersembunyi. Tarif sepihak di kemudian hari tidak ada." },
  { icon: Smile, judul: "Kurir Ramah & Amanah", teks: "Seluruh mitra melewati seleksi dan pelatihan ketat agar barang titipanmu dirawat seperti milik sendiri." },
];

export function BenefitsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Keunggulan utama"
        title="Kenapa Jutaan Pelanggan Memilih Phelya?"
        subtitle="Dedikasi kami adalah menghadirkan ketenangan hati di setiap paket yang kamu percayakan."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KEUNGGULAN.map((k) => (
          <Card key={k.judul} className="p-6 transition hover:-translate-y-1">
            <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent-deep">
              <k.icon className="size-6" aria-hidden />
            </span>
            <h3 className="mt-5 text-lg font-extrabold leading-snug">{k.judul}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{k.teks}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

const STAT = [
  ["15.000.000+", "Paket terkirim sukses"],
  ["514", "Kota & kabupaten di Indonesia"],
  ["25.000+", "Mitra kurir handal"],
  ["99,8%", "Ketepatan waktu pengantaran"],
];

export function StatsSection() {
  return (
    <section className="route-pattern bg-primary text-white dark:bg-[#0c4a4d]">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 py-14 sm:px-6 md:grid-cols-4">
        {STAT.map(([n, l], i) => (
          <div key={l} className={`px-4 text-center ${i > 0 ? "md:border-l md:border-white/20" : ""}`}>
            <dt className="order-2 mt-1 text-sm text-white/80">{l}</dt>
            <dd className="text-3xl font-black md:text-4xl">{n}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-accent-soft to-soft p-8 md:p-14">
        <div className="relative z-10 max-w-xl">
          <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">Mulai pengiriman</span>
          <h2 className="mt-4 text-3xl font-black leading-tight text-balance md:text-4xl">Mulai kirim paket pertamamu bersama Phely!</h2>
          <p className="mt-3 text-muted">
            Dapatkan penjemputan paket gratis tanpa minimum order, jaminan perlindungan barang, serta potongan harga spesial untuk akun baru.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="/daftar" size="lg" icon={Send}>
              Kirim Sekarang
            </Button>
            <Button href="/bantuan" size="lg" variant="secondary" icon={Smartphone}>
              Pelajari Cara Kerja
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-6 right-4 hidden md:block lg:right-16">
          <div className="absolute inset-0 -z-0 scale-125 rounded-full bg-white/40 blur-2xl dark:bg-white/5" aria-hidden />
          <Mascot pose="sukses" height={300} float className="relative" />
        </div>
      </div>
    </section>
  );
}

