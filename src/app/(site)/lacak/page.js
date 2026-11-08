import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ResiForm from "@/components/tracking/resi-form";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import Button from "@/components/ui/button";
import { ambilLacak } from "@/lib/lacak";
import { kotaById } from "@/lib/tariff";

export const metadata = { title: "Lacak Paket" };

export default function LacakPage({ searchParams }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-12 sm:px-6" role="status"><h1 className="text-3xl font-black md:text-4xl">Lacak Paket</h1><p className="mt-2 text-muted">Memuat...</p></div>}>
      <Isi searchParams={searchParams} />
    </Suspense>
  );
}

async function Isi({ searchParams }) {
  const sp = await searchParams;
  const daftar = (sp?.resi ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean)
    .slice(0, 5);
  const hasil = await Promise.all(daftar.map(async (r) => ({ resi: r, order: await ambilLacak(r) })));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-black md:text-4xl">Lacak Paket</h1>
      <p className="mt-2 text-muted">Masukkan nomor resi untuk melihat posisi dan riwayat pengiriman paketmu.</p>
      <Card className="mt-6 p-4 sm:p-6">
        <ResiForm defaultValue={daftar.join(", ")} />
      </Card>

      {daftar.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {hasil.map(({ resi, order }) => (
            <li key={resi}>
              <Card className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                <div>
                  <p className="font-mono text-lg font-black">{resi}</p>
                  {order ? (
                    <p className="text-sm text-muted">
                      {kotaById(order.pengirim.kota)?.nama} → {kotaById(order.penerima.kota)?.nama}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-danger">Resi tidak ditemukan</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {order && <StatusBadge status={order.status} />}
                  {order && (
                    <Button href={`/lacak/${resi}`} size="sm" variant="secondary" iconRight={ArrowRight}>
                      Lihat
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          pose="jalan"
          title="Belum ada resi yang dicari"
          description="Coba resi contoh PEX2610310001 untuk melihat tampilan pelacakan lengkap dengan peta dan timeline."
          action={
            <Link href="/lacak/PEX2610310001" className="font-bold text-primary underline">
              Lihat contoh pelacakan
            </Link>
          }
        />
      )}
    </div>
  );
}
