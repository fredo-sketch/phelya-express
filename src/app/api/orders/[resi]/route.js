import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

const hp = (v) => String(v ?? "").replace(/[\s-]/g, "");
const teks = (v) => String(v ?? "").trim();

/** Admin mengubah data kontak/isi paket. Harga, rute, berat, dan layanan dikunci oleh database. */
export async function PATCH(request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { resi } = await params;
  const b = await bacaJson(request);
  const { error } = await g.supabase.rpc("admin_ubah_order", {
    p_resi: resi,
    p_pengirim_nama: teks(b.pNama), p_pengirim_hp: hp(b.pHp), p_pengirim_alamat: teks(b.pAlamat),
    p_penerima_nama: teks(b.rNama), p_penerima_hp: hp(b.rHp), p_penerima_alamat: teks(b.rAlamat),
    p_isi: teks(b.isi), p_catatan: teks(b.catatan) || null,
  });
  if (error) return dariDb(error);
  return sukses();
}

/** Admin menghapus pesanan yang sudah dibatalkan. */
export async function DELETE(_request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { resi } = await params;
  const { error } = await g.supabase.rpc("admin_hapus_order", { p_resi: resi });
  if (error) return dariDb(error);
  return sukses();
}
