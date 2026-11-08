import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

/** Admin menugaskan kurir ke pesanan. */
export async function POST(request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { resi } = await params;
  const b = await bacaJson(request);
  if (typeof b.kurirId !== "string") return galat("Pilih kurir terlebih dahulu.", 422);

  const { error } = await g.supabase.rpc("tugaskan_kurir", { p_resi: resi, p_kurir_id: b.kurirId });
  if (error) return dariDb(error);
  return sukses();
}
