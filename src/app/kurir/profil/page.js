import { Card } from "@/components/ui/card";
import Mascot from "@/components/ui/mascot";
import { KURIR, KURIR_AKTIF_ID } from "@/data/mock";

export const metadata = { title: "Profil" };

export default function ProfilKurir() {
  const k = KURIR.find((x) => x.id === KURIR_AKTIF_ID);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-black">Profil Kurir</h1>
      <Card className="flex items-center gap-5 p-6">
        <Mascot pose="antar" height={110} />
        <dl className="space-y-1.5 text-sm">
          <div><dt className="inline text-muted">Nama: </dt><dd className="inline font-extrabold">{k.nama}</dd></div>
          <div><dt className="inline text-muted">Kode kurir: </dt><dd className="inline font-extrabold">{k.kode}</dd></div>
          <div><dt className="inline text-muted">Hub: </dt><dd className="inline font-extrabold">{k.hub}</dd></div>
          <div><dt className="inline text-muted">Kendaraan: </dt><dd className="inline font-extrabold">{k.kendaraan} · {k.plat}</dd></div>
        </dl>
      </Card>
    </div>
  );
}
