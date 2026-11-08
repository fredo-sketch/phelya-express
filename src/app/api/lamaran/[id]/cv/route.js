import { wajibMasuk, galat, sukses, dariDb } from "@/lib/api/guard";

/** Tautan sementara (60 detik) untuk mengunduh CV. Hanya admin. */
export async function GET(_request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { id } = await params;
  const { data, error } = await g.supabase.from("lamaran").select("cv_path").eq("id", id).maybeSingle();
  if (error) return dariDb(error);
  if (!data) return galat("Lamaran tidak ditemukan.", 404);
  const { data: url, error: e2 } = await g.supabase.storage.from("cv").createSignedUrl(data.cv_path, 60);
  if (e2) return galat("Berkas CV tidak tersedia.", 404);
  return sukses({ url: url.signedUrl });
}
