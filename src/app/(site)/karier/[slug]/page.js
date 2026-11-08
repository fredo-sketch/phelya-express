import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CircleDollarSign, MapPin } from "lucide-react";
import ApplyForm from "@/components/career/apply-form";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/badge";
import { ambilLowongan } from "@/lib/lowongan";
import { tanggal } from "@/lib/format";

async function getLowongan(slug) {
  return (await ambilLowongan()).find((l) => l.slug === slug);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const l = await getLowongan(slug);
  return { title: l ? l.judul : "Lowongan" };
}

export default function DetailLowongan({ params }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" role="status">Memuat lowongan...</div>}>
      <Isi params={params} />
    </Suspense>
  );
}

async function Isi({ params }) {
  const { slug } = await params;
  const l = await getLowongan(slug);
  if (!l) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/karier#lowongan" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent">
        <ArrowLeft className="size-4" aria-hidden /> Semua lowongan
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="info" className="uppercase">{l.divisi}</Pill>
            <Pill tone="amber" className="uppercase">{l.tipe}</Pill>
            {l.urgent && <Pill tone="orange">Cepat dibutuhkan</Pill>}
          </div>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">{l.judul}</h1>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{l.lokasi}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden />Batas lamaran {tanggal(l.batas)}</span>
            <span className="inline-flex items-center gap-1.5"><CircleDollarSign className="size-4" aria-hidden />{l.gaji}</span>
          </p>

          <section className="mt-8">
            <h2 className="text-xl font-black">Deskripsi Pekerjaan</h2>
            <p className="mt-2 leading-relaxed text-muted">{l.deskripsi}</p>
          </section>
          <section className="mt-8">
            <h2 className="text-xl font-black">Tanggung Jawab</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">{l.tanggung.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>
          <section className="mt-8">
            <h2 className="text-xl font-black">Kualifikasi</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">{l.kualifikasi.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <h2 className="text-xl font-black">Lamar Sekarang</h2>
            <p className="mb-5 mt-1 text-sm text-muted">Isi data dan unggah CV untuk posisi ini.</p>
            <ApplyForm posisi={l.judul} slug={l.slug} />
          </Card>
        </aside>
      </div>
    </div>
  );
}
