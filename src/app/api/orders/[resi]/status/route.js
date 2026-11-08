import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

const STATUS_SAH = ["diambil", "dalam_perjalanan", "sampai", "gagal", "dibatalkan"];

/** Ubah status pesanan. Hak akses dan aturan transisi diperiksa ulang oleh fungsi database. */
export async function POST(request, { params }) {
  const g = await wajibMasuk();
  if (g.respon) return g.respon;
  const { resi } = await params;
  const b = await bacaJson(request);
  if (!STATUS_SAH.includes(b.ke)) return galat("Status tujuan tidak valid.", 422);

  const { error } = await g.supabase.rpc("ubah_status_order", {
    p_resi: resi,
    p_ke: b.ke,
    p_lokasi: b.lokasi ? String(b.lokasi).slice(0, 120) : null,
    p_deskripsi: b.deskripsi ? String(b.deskripsi).slice(0, 300) : null,
    p_alasan: b.alasan ? String(b.alasan).slice(0, 200) : null,
    p_bukti_path: b.buktiPath ? String(b.buktiPath).slice(0, 200) : null,
  });
  if (error) return dariDb(error);
  return sukses();
}
