import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tandai satu notifikasi ({ id }) atau semuanya ({ semua: true }) sebagai sudah dibaca. RLS membatasi ke milik sendiri. */
export async function POST(request) {
  const g = await wajibMasuk();
  if (g.respon) return g.respon;
  const b = await bacaJson(request);
  let q = g.supabase.from("notifications").update({ dibaca_at: new Date().toISOString() }).is("dibaca_at", null);
  if (b.semua === true) q = q.eq("user_id", g.user.id);
  else if (typeof b.id === "string" && UUID.test(b.id)) q = q.eq("id", b.id);
  else return galat("Notifikasi tidak valid.", 422);
  const { error } = await q;
  if (error) return dariDb(error);
  return sukses();
}
