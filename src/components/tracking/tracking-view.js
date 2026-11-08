import { Package, Scale, Truck, CalendarClock, ShieldCheck, Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import Mascot from "@/components/ui/mascot";
import Timeline from "@/components/tracking/timeline";
import TrackMapLoader from "@/components/tracking/track-map-loader";
import { CopyResi, NotifButton, ShareButton } from "@/components/tracking/resi-actions";
import { kotaById, LAYANAN } from "@/lib/tariff";
import { tanggal, tanggalJam } from "@/lib/format";

function Info({ icon: Icon, label, children }) {
  return (
    <div className="rounded-xl bg-surface2 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
        <Icon className="size-3.5" aria-hidden /> {label}
      </p>
      <p className="mt-1 text-sm font-extrabold">{children}</p>
    </div>
  );
}

/** Tampilan hasil pelacakan publik. Data pribadi disamarkan. */
export default function TrackingView({ order }) {
  const asal = kotaById(order.pengirim.kota);
  const tujuan = kotaById(order.penerima.kota);
  const kurir = order.kurir;
  const svc = LAYANAN[order.layanan];
  const selesai = order.status === "sampai";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Nomor Resi</p>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="font-mono text-xl font-black sm:text-2xl">{order.resi}</h1>
                <CopyResi resi={order.resi} />
              </div>
            </div>
            <StatusBadge status={order.status} className="text-sm" />
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-primary-soft p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-muted">Asal</p>
              <p className="truncate text-lg font-extrabold">{asal?.nama}</p>
            </div>
            <Truck className="size-6 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1 text-right">
              <p className="text-xs font-bold text-muted">Tujuan</p>
              <p className="truncate text-lg font-extrabold">{tujuan?.nama}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Info icon={Package} label="Layanan">{svc.nama.replace("Phelya ", "")}</Info>
            <Info icon={Scale} label="Berat">{order.barang.berat} kg</Info>
            <Info icon={CalendarClock} label={selesai ? "Tiba" : "Estimasi tiba"}>{selesai ? tanggal(order.timeline[0].waktu) : tanggal(order.estimasi)}</Info>
            <Info icon={ShieldCheck} label="Pengirim">{order.pengirim.nama}</Info>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <NotifButton />
            <ShareButton resi={order.resi} />
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold">Peta Perjalanan Paket</h2>
          <TrackMapLoader asal={order.pengirim.kota} tujuan={order.penerima.kota} status={order.status} />
          <p className="mt-3 text-xs text-muted">Posisi pada peta adalah simulasi berdasarkan status terakhir paket.</p>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-5 text-lg font-extrabold">Riwayat Pengiriman</h2>
          <Timeline events={order.timeline} status={order.status} />
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold">Penerima & Kurir</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Penerima</dt>
              <dd className="text-right font-bold">{order.penerima.nama}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">No. HP</dt>
              <dd className="font-mono font-bold">{order.penerima.hp}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Dikirim</dt>
              <dd className="font-bold">{tanggalJam(order.dibuat)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Kurir</dt>
              <dd className="font-bold">{kurir ? `${kurir.nama} (${kurir.kode})` : "Belum ditugaskan"}</dd>
            </div>
          </dl>
        </Card>

        {selesai && (
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
              <Camera className="size-5 text-primary" aria-hidden /> Bukti Serah Terima
            </h2>
            <div className="flex items-center gap-4 rounded-2xl bg-surface2 p-4">
              <Mascot pose="sukses" height={92} />
              <div>
                <p className="font-extrabold">Paket diterima</p>
                <p className="text-sm text-muted">Diterima oleh {order.diterimaOleh ?? "penerima"}.</p>
                <p className="mt-1 text-xs text-muted">Foto bukti hanya dapat dilihat oleh pengirim dan penerima yang masuk ke akun.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
