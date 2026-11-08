import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

export async function PATCH(request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { id } = await params;
  const b = await bacaJson(request);
  const nama = String(b.nama ?? "").trim();
  const perKg = Number(b.perKg);
  const maxKm = b.maxKm === "" || b.maxKm == null ? null : Number(b.maxKm);
  if (nama.length < 3) return galat("Nama zona minimal 3 karakter.", 422);
  if (!Number.isFinite(perKg) || perKg < 1000) return galat("Tarif per kg minimal Rp 1.000.", 422);
  if (maxKm !== null && (!Number.isFinite(maxKm) || maxKm <= 0)) return galat("Jarak maksimal harus lebih dari 0 km.", 422);

  const { data, error } = await g.supabase
    .from("zona_tarif")
    .update({ nama, max_km: maxKm === null ? null : Math.round(maxKm), per_kg: Math.round(perKg) })
    .eq("id", Number(id))
    .select("id");
  if (error) return error.code === "23505" ? galat("Nama zona atau jarak maksimal sudah dipakai zona lain.", 409) : dariDb(error);
  if (!data?.length) return galat("Zona tidak ditemukan.", 404);
  return sukses();
}

export async function DELETE(_request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { id } = await params;
  const { data, error } = await g.supabase.from("zona_tarif").delete().eq("id", Number(id)).select("id");
  if (error) return error.code === "23503" ? galat("Zona sudah dipakai pesanan dan tidak bisa dihapus.", 409) : dariDb(error);
  if (!data?.length) return galat("Zona tidak ditemukan.", 404);
  return sukses();
}
