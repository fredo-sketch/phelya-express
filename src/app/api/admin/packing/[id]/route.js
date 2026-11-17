import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";
import { bacaPacking } from "../route";

export async function PATCH(request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { id } = await params;
  const b = await bacaJson(request);
  const v = bacaPacking(b);
  if (v.error) return galat(v.error, 422);
  const { data, error } = await g.supabase
    .from("packing_options")
    .update({ nama: v.nama, deskripsi: v.deskripsi, harga: v.harga, urutan: v.urutan, aktif: b.aktif !== false })
    .eq("id", id)
    .select("id");
  if (error) return error.code === "23505" ? galat("Nama packing sudah dipakai.", 409) : dariDb(error);
  if (!data?.length) return galat("Pilihan packing tidak ditemukan.", 404);
  return sukses();
}

/** Hapus. Bila sudah dipakai pesanan, dinonaktifkan saja agar riwayat pesanan tetap utuh. */
export async function DELETE(_request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { id } = await params;
  const { data, error } = await g.supabase.from("packing_options").delete().eq("id", id).select("id");
  if (error?.code === "23503") {
    const u = await g.supabase.from("packing_options").update({ aktif: false }).eq("id", id);
    if (u.error) return dariDb(u.error);
    return sukses({ dinonaktifkan: true });
  }
  if (error) return dariDb(error);
  if (!data?.length) return galat("Pilihan packing tidak ditemukan.", 404);
  return sukses({ dinonaktifkan: false });
}
