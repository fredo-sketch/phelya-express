"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import Pagination from "@/components/dashboard/pagination";
import Modal from "@/components/admin/modal";

const PER = 8;

/**
 * Tabel CRUD generik: kolom cari, tombol Tambah, Edit, Hapus (dengan konfirmasi), dan paginasi.
 * `kolom`: [{ label, render(row) }]. `teksCari(row)`: teks yang dicocokkan dengan kolom cari.
 * `onHapus(row)` boleh async; konfirmasi tertutup setelah selesai.
 */
export default function CrudTable({ kolom, baris, memuat, galat, teksCari, tambahLabel = "Tambah", onTambah, onEdit, onHapus, kosong = "Belum ada data.", namaBaris = (r) => r.nama, cariLabel = "Cari" }) {
  const [q, setQ] = useState("");
  const [hal, setHal] = useState(1);
  const [hapus, setHapus] = useState(null);
  const [busy, setBusy] = useState(false);

  const hasil = useMemo(() => {
    const k = q.trim().toLowerCase();
    return k ? baris.filter((r) => teksCari(r).toLowerCase().includes(k)) : baris;
  }, [baris, q, teksCari]);

  const total = Math.max(1, Math.ceil(hasil.length / PER));
  const aktif = Math.min(hal, total);
  const tampil = hasil.slice((aktif - 1) * PER, aktif * PER);

  async function konfirmasiHapus() {
    setBusy(true);
    await onHapus(hapus);
    setBusy(false);
    setHapus(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="crud-cari" className="sr-only">{cariLabel}</label>
          <Input id="crud-cari" icon={Search} value={q} onChange={(e) => { setQ(e.target.value); setHal(1); }} placeholder={`${cariLabel}...`} />
        </div>
        {onTambah && <Button icon={Plus} onClick={onTambah}>{tambahLabel}</Button>}
      </div>

      {galat && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{galat}</p>}

      <Card className="overflow-x-auto">
        {memuat ? (
          <p className="px-5 py-8 text-center text-muted" role="status">Memuat data...</p>
        ) : tampil.length === 0 ? (
          <EmptyState compact pose="santai" title={q ? "Tidak ada hasil" : kosong} />
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
              <tr>
                {kolom.map((c) => <th key={c.label} scope="col" className="px-5 py-3.5">{c.label}</th>)}
                <th scope="col" className="px-5 py-3.5"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  {kolom.map((c) => <td key={c.label} className="px-5 py-4">{c.render(r)}</td>)}
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <div className="inline-flex gap-2">
                      {onEdit && <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(r)} aria-label={`Edit ${namaBaris(r)}`}>Edit</Button>}
                      {onHapus && <Button size="sm" variant="ghost" icon={Trash2} className="text-danger" onClick={() => setHapus(r)} aria-label={`Hapus ${namaBaris(r)}`}>Hapus</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!memuat && hasil.length > PER && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-line p-4 sm:flex-row">
            <p className="text-sm text-muted">Menampilkan {(aktif - 1) * PER + 1}–{(aktif - 1) * PER + tampil.length} dari {hasil.length} data</p>
            <Pagination page={aktif} total={total} onChange={setHal} label="Halaman data" />
          </div>
        )}
      </Card>

      {hapus && (
        <Modal judul="Hapus data?" onClose={() => !busy && setHapus(null)}>
          <p className="text-sm">Data <b>{namaBaris(hapus)}</b> akan dihapus. Bila sudah dipakai pesanan, data hanya dinonaktifkan agar riwayat tetap utuh.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setHapus(null)} disabled={busy}>Batal</Button>
            <Button className="!bg-danger" loading={busy} onClick={konfirmasiHapus}>Ya, hapus</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
