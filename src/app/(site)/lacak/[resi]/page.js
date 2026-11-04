import ResiForm from "@/components/tracking/resi-form";
import TrackingView from "@/components/tracking/tracking-view";
import EmptyState from "@/components/ui/empty-state";
import Button from "@/components/ui/button";
import { getOrder } from "@/data/mock";

export async function generateMetadata({ params }) {
  const { resi } = await params;
  return { title: `Resi ${resi.toUpperCase()}` };
}

export default async function HasilLacak({ params }) {
  const { resi } = await params;
  const order = getOrder(resi);

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
