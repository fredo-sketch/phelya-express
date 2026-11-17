import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

/**
 * Ubah tarif layanan. Layanan baru tidak dibuat dari sini karena nama layanan dipakai langsung
 * oleh tampilan (src/lib/tariff.js); yang bisa diatur admin adalah pengali, berat minimal, deskripsi, dan status aktif.
 */
export async function PATCH(request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { id } = await params;
  const b = await bacaJson(request);
  const pengali = Number(b.pengali);
  const minBerat = Number(b.minBerat);
  const singkat = String(b.singkat ?? "").trim();
  const deskripsi = String(b.deskripsi ?? "").trim();
  if (!Number.isFinite(pengali) || pengali <= 0 || pengali > 99) return galat("Pengali tarif harus lebih dari 0 dan maksimal 99.", 422);
  if (!Number.isFinite(minBerat) || minBerat <= 0 || minBerat > 100) return galat("Berat minimal harus antara 0 dan 100 kg.", 422);
  if (singkat.length < 2) return galat("Label singkat minimal 2 karakter.", 422);
  if (deskripsi.length < 5) return galat("Deskripsi minimal 5 karakter.", 422);
  const { data, error } = await g.supabase.from("layanan").update({ pengali, min_berat: minBerat, singkat, deskripsi, aktif: b.aktif !== false }).eq("id", id).select("id");
  if (error) return dariDb(error);
  if (!data?.length) return galat("Layanan tidak ditemukan.", 404);
  return sukses();
}
