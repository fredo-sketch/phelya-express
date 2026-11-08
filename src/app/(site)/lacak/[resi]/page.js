import { Suspense } from "react";
import ResiForm from "@/components/tracking/resi-form";
import TrackingView from "@/components/tracking/tracking-view";
import EmptyState from "@/components/ui/empty-state";
import Button from "@/components/ui/button";
import { ambilLacak } from "@/lib/lacak";

export async function generateMetadata({ params }) {
  const { resi } = await params;
  return { title: `Resi ${resi.toUpperCase()}` };
}

export default function HasilLacak({ params }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" role="status">Memuat...</div>}>
      <Isi params={params} />
    </Suspense>
  );
}

async function Isi({ params }) {
  const { resi } = await params;
  const order = await ambilLacak(resi);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <ResiForm defaultValue={resi.toUpperCase()} compact />
      </div>
      {order ? (
        <TrackingView order={order} />
      ) : (
        <EmptyState
          pose="santai"
          title="Resi tidak ditemukan"
          description={`Nomor resi ${resi.toUpperCase()} belum terdaftar. Periksa kembali penulisan atau hubungi pengirim.`}
          action={<Button href="/lacak">Cari resi lain</Button>}
        />
      )}
    </div>
  );
}
