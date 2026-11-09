import { supabaseServer } from "@/lib/supabase/server";
import { galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

/**
 * Daftarkan langganan Web Push perangkat ini.
 * - tanpa `resi`: langganan akun (wajib login), menerima notifikasi pesanan/tugas/admin
 * - dengan `resi`: langganan tamu untuk satu paket, tanpa akun
 * Validasi sebenarnya ada di fungsi database daftar_push.
 */
export async function POST(request) {
  const b = await bacaJson(request);
  const s = b.subscription ?? {};
  if (typeof s.endpoint !== "string" || typeof s.keys?.p256dh !== "string" || typeof s.keys?.auth !== "string") return galat("Data langganan tidak valid.", 422);
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("daftar_push", {
    p_endpoint: s.endpoint,
    p_p256dh: s.keys.p256dh,
    p_auth: s.keys.auth,
    p_ua: request.headers.get("user-agent") ?? null,
    p_resi: typeof b.resi === "string" ? b.resi : null,
  });
  if (error) return dariDb(error);
  return sukses();
}

/** Hentikan langganan perangkat ini. */
export async function DELETE(request) {
  const b = await bacaJson(request);
  if (typeof b.endpoint !== "string") return galat("Endpoint tidak valid.", 422);
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("batal_push", { p_endpoint: b.endpoint });
  if (error) return dariDb(error);
  return sukses();
}

