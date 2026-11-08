import { wajibMasuk, sukses, dariDb } from "@/lib/api/guard";

/** Admin mengonfirmasi pembayaran. */
export async function POST(_request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { resi } = await params;
  const { error } = await g.supabase.rpc("konfirmasi_bayar", { p_resi: resi });
  if (error) return dariDb(error);
  return sukses();
}
