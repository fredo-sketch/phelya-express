import { Users, TrendingUp, ShieldPlus, CircleDollarSign, BadgeCheck, Briefcase } from "lucide-react";
import JobList from "@/components/career/job-list";
import { Card, SectionHeading } from "@/components/ui/card";
import Mascot from "@/components/ui/mascot";
import Button from "@/components/ui/button";
import { LOWONGAN } from "@/data/mock";

export const metadata = { title: "Karier" };

const BENEFIT = [
  { icon: Users, judul: "Lingkungan Kerja Suportif & Ramah", teks: "Kolaborasi terbuka, saling peduli, dan budaya tanpa sekat antar rekan kerja layaknya keluarga.", tag: "Inklusif & Empatis" },
  { icon: TrendingUp, judul: "Jenjang Karier & Pelatihan Terstruktur", teks: "Program akselerasi kompetensi logistik, sertifikasi operasional, serta jalur karier dari staf hingga supervisor.", tag: "Akselerasi Berkala" },
  { icon: ShieldPlus, judul: "Asuransi Kesehatan & Jaminan Hari Tua", teks: "Perlindungan lengkap BPJS Ketenagakerjaan (JKK, JKM, JHT), BPJS Kesehatan, dan fasilitas klaim rawat inap.", tag: "Proteksi Terjamin" },
  { icon: CircleDollarSign, judul: "Bonus Kinerja & Insentif Kompetitif", teks: "Penghargaan produktivitas pengantaran paket, bonus ketepatan SLA, serta subsidi bahan bakar dan servis kendaraan.", tag: "Reward Transparan" },
];

export default function KarierPage() {
  return (
    <>
      <section className="route-pattern bg-linear-to-b from-accent-soft/50 to-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_0.8fr] md:py-20">
          <div>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-accent-deep">● Rekrutmen resmi 2026</span>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              Bangun Kariermu <span className="block text-accent-deep">Bersama Phelya Express</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">Bergabunglah dengan tim yang amanah, gesit, dan berdedikasi mengantarkan kebahagiaan ke seluruh pelosok Nusantara.</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Button href="#lowongan" size="lg">Cari Lowongan</Button>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-primary"><BadgeCheck className="size-5" aria-hidden /> Proses seleksi transparan, tanpa biaya apapun</span>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute inset-4 rounded-full bg-white/50 blur-2xl dark:bg-white/5" aria-hidden />
            <Mascot pose="semangat" height={300} float priority className="relative" />
            <div className="absolute right-0 top-0 flex items-center gap-2 rounded-2xl bg-surface px-4 py-2.5 shadow-card ring-1 ring-line">
              <Briefcase className="size-5 text-accent-deep" aria-hidden />
              <div><p className="text-sm font-black leading-none">{LOWONGAN.length}+ Posisi Aktif</p><p className="mt-0.5 text-[10px] font-bold uppercase text-muted">Di berbagai kota</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionHeading eyebrow="Nilai & budaya kerja" title="Budaya & Benefit di Phelya Express" subtitle="Prinsip utama yang menjadikan Phelya rumah yang nyaman untuk bertumbuh, berprestasi, dan saling merangkul." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFIT.map((b) => (
            <Card key={b.judul} className="flex flex-col p-6">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary"><b.icon className="size-6" aria-hidden /></span>
              <h3 className="mt-5 text-lg font-extrabold leading-snug">{b.judul}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{b.teks}</p>
              <p className="mt-4 border-t border-line pt-3 text-[11px] font-extrabold uppercase tracking-wider text-primary">{b.tag}</p>
            </Card>
          ))}
        </div>
      </section>

      <JobList />
    </>
  );
}
