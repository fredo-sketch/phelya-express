import { cacheLife, cacheTag } from "next/cache";
import { supabaseAnon } from "@/lib/supabase/server";
import { petaLowongan } from "@/lib/lowongan-data";

/** Lowongan aktif (publik). Di-cache beberapa menit karena jarang berubah. */
export async function ambilLowongan() {
  "use cache";
  cacheLife("minutes");
  cacheTag("lowongan");
  const { data, error } = await supabaseAnon().from("lowongan").select("*").eq("aktif", true).order("batas");
  if (error) throw new Error("Gagal memuat lowongan");
  return data.map(petaLowongan);
}
