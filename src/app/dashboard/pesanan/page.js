"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { StatusBadge, BayarBadge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import Pagination from "@/components/dashboard/pagination";
import { useOrders } from "@/components/order-store";
import { kotaById, LAYANAN } from "@/lib/tariff";
import { STATUS } from "@/lib/status";
import { rupiah, tanggal } from "@/lib/format";

const PER = 5;

export default function PesananSaya() {
  const { orders, me } = useOrders();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("semua");
  const [urut, setUrut] = useState("terbaru");
  const [hal, setHal] = useState(1);

  const saya = useMemo(() => orders.filter((o) => o.ownerId === me.id), [orders, me.id]);
  const hasil = useMemo(() => {
    const k = q.trim().toLowerCase();
    return saya
      .filter((o) => (status === "semua" || o.status === status) && (!k || o.resi.toLowerCase().includes(k) || o.penerima.nama.toLowerCase().includes(k)))
      .sort((a, b) => (urut === "terbaru" ? new Date(b.dibuat) - new Date(a.dibuat) : new Date(a.dibuat) - new Date(b.dibuat)));
  }, [saya, q, status, urut]);

  const total = Math.max(1, Math.ceil(hasil.length / PER));
  const aktif = Math.min(hal, total);
  const tampil = hasil.slice((aktif - 1) * PER, aktif * PER);
  const reset = () => setHal(1);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Pesanan Saya</h1>
          <p className="text-muted">{saya.length} pesanan tercatat di akunmu.</p>
        </div>
        <Button href="/dashboard/buat">+ Buat Pesanan</Button>
      </div>

      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_200px_180px]">
        <Input icon={Search} value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="Cari resi atau nama penerima" aria-label="Cari pesanan" />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); reset(); }} aria-label="Filter status">
          <option value="semua">Semua status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        <Select value={urut} onChange={(e) => setUrut(e.target.value)} aria-label="Urutkan">
          <option value="terbaru">Terbaru dulu</option>
          <option value="terlama">Terlama dulu</option>
        </Select>
      </Card>

      {tampil.length === 0 ? (
        <Card>
          <EmptyState pose="santai" title="Belum ada pesanan" description={q || status !== "semua" ? "Tidak ada pesanan yang cocok dengan filter." : "Yuk, mulai kirim paket pertamamu."} action={<Button href="/dashboard/buat">Buat Pesanan</Button>} />
        </Card>
      ) : (
        <>
          {/* tabel desktop */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
                <tr>
                  {["Resi", "Penerima", "Tujuan", "Layanan", "Berat", "Ongkir", "Status", "Tanggal", ""].map((h) => <th key={h} scope="col" className="px-4 py-3.5">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {tampil.map((o) => (
                  <tr key={o.resi} className="border-t border-line">
                    <td className="px-4 py-4 font-mono font-bold text-primary">{o.resi}</td>
                    <td className="px-4 py-4 font-bold">{o.penerima.nama}</td>
                    <td className="px-4 py-4 text-muted">{kotaById(o.penerima.kota)?.nama}</td>
                    <td className="px-4 py-4">{LAYANAN[o.layanan].nama.replace("Phelya ", "")}</td>
                    <td className="px-4 py-4">{o.barang.berat} kg</td>
                    <td className="px-4 py-4 font-bold">{rupiah(o.ongkir)}</td>
                    <td className="px-4 py-4"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-4 text-muted">{tanggal(o.dibuat)}</td>
                    <td className="px-4 py-4"><Button href={`/dashboard/pesanan/${o.resi}`} size="sm" variant="secondary">Lihat Detail</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* kartu mobile */}
          <ul className="space-y-3 md:hidden">
            {tampil.map((o) => (
              <li key={o.resi}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono font-black text-primary">{o.resi}</p>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-2 font-bold">{o.penerima.nama}</p>
                  <p className="text-sm text-muted">{kotaById(o.penerima.kota)?.nama} · {LAYANAN[o.layanan].nama.replace("Phelya ", "")} · {o.barang.berat} kg</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-extrabold">{rupiah(o.ongkir)}</span>
                    <BayarBadge bayar={o.bayar} />
                  </div>
                  <Button href={`/dashboard/pesanan/${o.resi}`} size="sm" variant="secondary" className="mt-3 w-full">Lihat Detail</Button>
                </Card>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted">Menampilkan {(aktif - 1) * PER + 1}–{(aktif - 1) * PER + tampil.length} dari {hasil.length} pesanan</p>
            <Pagination page={aktif} total={total} onChange={setHal} label="Halaman pesanan" />
          </div>
        </>
      )}
    </div>
  );
}
