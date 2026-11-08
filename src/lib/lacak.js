import { supabaseAnon } from "@/lib/supabase/server";
import { petaLacak } from "@/lib/api/mappers";

/** Pelacakan publik via RPC lacak_resi (data pribadi sudah disamarkan di database). Mengembalikan null jika tidak ada. */
export async function ambilLacak(resi) {
  const kode = String(resi ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6,20}$/.test(kode)) return null;
  const { data, error } = await supabaseAnon().rpc("lacak_resi", { p_resi: kode });
  if (error || !data) return null;
  return petaLacak(data);
}
