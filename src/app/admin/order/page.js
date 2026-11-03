"use client";

import { useMemo, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { StatusBadge, BayarBadge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import Pagination from "@/components/dashboard/pagination";
import OrderDrawer from "@/components/dashboard/order-drawer";
import { useOrders } from "@/components/order-store";
import { KURIR, getKurir } from "@/data/mock";
import { LAYANAN, kotaById } from "@/lib/tariff";
import { STATUS } from "@/lib/status";
import { tanggalJam } from "@/lib/format";

const PER = 6;
const AWAL = { q: "", status: "semua", kurir: "semua", layanan: "semua" };

export default function OrderTracking() {
  const { orders } = useOrders();
  const [flt, setFlt] = useState(AWAL);
  const [hal, setHal] = useState(1);
  const [buka, setBuka] = useState(null);
  const [pilih, setPilih] = useState(new Set());

  const set = (k) => (e) => { setFlt((f) => ({ ...f, [k]: e.target.value })); setHal(1); };

  const hasil = useMemo(() => {
    const k = flt.q.trim().toLowerCase();
    return orders
      .filter((o) => (flt.status === "semua" || o.status === flt.status) && (flt.layanan === "semua" || o.layanan === flt.layanan) && (flt.kurir === "semua" || (flt.kurir === "none" ? !o.kurirId : o.kurirId === flt.kurir)))
      .filter((o) => !k || `${o.resi} ${o.pengirim.nama} ${o.penerima.nama} ${kotaById(o.penerima.kota)?.nama}`.toLowerCase().includes(k))
      .sort((a, b) => new Date(b.dibuat) - new Date(a.dibuat));
  }, [orders, flt]);

  const total = Math.max(1, Math.ceil(hasil.length / PER));
  const aktif = Math.min(hal, total);
  const tampil = hasil.slice((aktif - 1) * PER, aktif * PER);
  const semuaDipilih = tampil.length > 0 && tampil.every((o) => pilih.has(o.resi));

  function toggleSemua() {
    setPilih((p) => {
      const n = new Set(p);
      tampil.forEach((o) => (semuaDipilih ? n.delete(o.resi) : n.add(o.resi)));
      return n;
    });
  }
  function toggle(resi) {
    setPilih((p) => {
      const n = new Set(p);
      n.has(resi) ? n.delete(resi) : n.add(resi);
      return n;
    });
  }

  const quick = [
    ["menunggu_kurir", `${orders.filter((o) => o.status === "menunggu_kurir").length} Menunggu Kurir`],
    ["dalam_perjalanan", `${orders.filter((o) => o.status === "dalam_perjalanan").length} Sedang Diantar`],
    ["gagal", `${orders.filter((o) => o.status === "gagal").length} Gagal Kirim`],
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent-deep">Operasional / Order Tracking</p>
        <h1 className="text-3xl font-black">Monitoring & Tracking Pengiriman</h1>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div><label className="mb-1.5 block text-xs font-bold text-muted" htmlFor="f-q">Cari Resi / Nama / Kota</label><Input id="f-q" icon={Search} value={flt.q} onChange={set("q")} placeholder="Contoh: PEX26…, Dewi, Surabaya" /></div>
          <div><label className="mb-1.5 block text-xs font-bold text-muted" htmlFor="f-s">Status</label><Select id="f-s" value={flt.status} onChange={set("status")}><option value="semua">Semua Status</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></div>
          <div><label className="mb-1.5 block text-xs font-bold text-muted" htmlFor="f-k">Kurir</label><Select id="f-k" value={flt.kurir} onChange={set("kurir")}><option value="semua">Semua Kurir</option><option value="none">Belum ditugaskan</option>{KURIR.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}</Select></div>
          <div><label className="mb-1.5 block text-xs font-bold text-muted" htmlFor="f-l">Layanan</label><Select id="f-l" value={flt.layanan} onChange={set("layanan")}><option value="semua">Semua Layanan</option>{Object.values(LAYANAN).map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}</Select></div>
          <Button variant="secondary" icon={RotateCcw} className="self-end" onClick={() => { setFlt(AWAL); setHal(1); }}>Reset</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Filter cepat:</span>
          {quick.map(([k, l]) => (
            <button key={k} onClick={() => { setFlt({ ...AWAL, status: k }); setHal(1); }} className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent-deep hover:bg-accent hover:text-white">{l}</button>
          ))}
        </div>
      </Card>

      {tampil.length === 0 ? (
        <Card><EmptyState pose="santai" title="Tidak ada order" description="Ubah filter pencarian untuk melihat order lain." action={<Button variant="secondary" onClick={() => setFlt(AWAL)}>Reset filter</Button>} /></Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="w-10 px-4 py-3.5"><input type="checkbox" checked={semuaDipilih} onChange={toggleSemua} aria-label="Pilih semua di halaman ini" className="size-4 accent-[var(--accent)]" /></th>
                {["No. Resi", "Pengirim", "Penerima & Tujuan", "Layanan", "Kurir", "Pembayaran", "Status", "Waktu Masuk"].map((h) => <th key={h} scope="col" className="px-4 py-3.5">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {tampil.map((o) => (
                <tr key={o.resi} className="cursor-pointer border-t border-line align-top transition hover:bg-surface2" onClick={() => setBuka(o.resi)}>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={pilih.has(o.resi)} onChange={() => toggle(o.resi)} aria-label={`Pilih ${o.resi}`} className="size-4 accent-[var(--accent)]" /></td>
                  <td className="px-4 py-4"><button onClick={() => setBuka(o.resi)} className="font-mono font-bold text-primary hover:underline">{o.resi}</button></td>
                  <td className="px-4 py-4 font-semibold">{o.pengirim.nama}<span className="block text-xs font-normal text-muted">{kotaById(o.pengirim.kota)?.nama}</span></td>
                  <td className="px-4 py-4 font-semibold">{o.penerima.nama}<span className="block text-xs font-normal text-muted">{kotaById(o.penerima.kota)?.nama}</span></td>
                  <td className="px-4 py-4">{LAYANAN[o.layanan].nama.replace("Phelya ", "")}</td>
                  <td className="px-4 py-4">{getKurir(o.kurirId)?.nama ?? <span className="text-muted">Belum ditugaskan</span>}</td>
                  <td className="px-4 py-4"><BayarBadge bayar={o.bayar} /></td>
                  <td className="px-4 py-4"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-4 text-muted">{tanggalJam(o.dibuat)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-line p-4 sm:flex-row">
            <p className="text-sm text-muted">Menampilkan {(aktif - 1) * PER + 1}–{(aktif - 1) * PER + tampil.length} dari {hasil.length} order{pilih.size > 0 && ` · ${pilih.size} dipilih`}</p>
            <Pagination page={aktif} total={total} onChange={setHal} label="Halaman order" />
          </div>
        </Card>
      )}

      {buka && <OrderDrawer resi={buka} onClose={() => setBuka(null)} />}
    </div>
  );
}
