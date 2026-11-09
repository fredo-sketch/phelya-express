import { wajibMasuk, sukses, dariDb } from "@/lib/api/guard";

/** Inbox notifikasi milik pengguna yang sedang masuk (30 terbaru) beserta jumlah yang belum dibaca. */
export async function GET() {
  const g = await wajibMasuk();
  if (g.respon) return g.respon;
  const [daftar, belum] = await Promise.all([
    g.supabase.from("notifications").select("id, tipe, judul, isi, url, resi, dibaca_at, created_at").order("created_at", { ascending: false }).limit(30),
    g.supabase.from("notifications").select("id", { count: "exact", head: true }).is("dibaca_at", null),
  ]);
  if (daftar.error) return dariDb(daftar.error);
  return sukses({
    belumDibaca: belum.count ?? 0,
    notifikasi: daftar.data.map((n) => ({ id: n.id, tipe: n.tipe, judul: n.judul, isi: n.isi, url: n.url, resi: n.resi, dibaca: !!n.dibaca_at, waktu: n.created_at })),
  });
}
