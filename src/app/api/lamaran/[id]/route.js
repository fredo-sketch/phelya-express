import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

const STATUS = ["baru", "diproses", "wawancara", "diterima", "ditolak"];

export async function PATCH(request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { id } = await params;
  const b = await bacaJson(request);
  if (!STATUS.includes(b.status)) return galat("Status lamaran tidak valid.", 422);
  const { data, error } = await g.supabase.from("lamaran").update({ status: b.status }).eq("id", id).select("id");
  if (error) return dariDb(error);
  if (!data?.length) return galat("Lamaran tidak ditemukan.", 404);
  return sukses();
}
