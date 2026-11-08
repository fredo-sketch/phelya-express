import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

const HP_RE = /^(08|\+628)\d{8,11}$/;

/** Ubah profil sendiri (nama dan HP). Role dan tier tidak bisa diubah dari sini. */
export async function PATCH(request) {
  const g = await wajibMasuk();
  if (g.respon) return g.respon;
  const b = await bacaJson(request);
  const nama = String(b.nama ?? "").trim();
  const hp = String(b.hp ?? "").replace(/[\s-]/g, "");
  if (nama.length < 2 || nama.length > 100) return galat("Nama harus 2 sampai 100 karakter.", 422);
  if (!HP_RE.test(hp)) return galat("Nomor HP tidak valid. Contoh: 081234567890.", 422);

  const { error } = await g.supabase.from("profiles").update({ nama, hp }).eq("id", g.user.id);
  if (error) return dariDb(error);
  return sukses();
}

/** Profil pengguna yang sedang masuk. Dipakai setelah login untuk menentukan halaman tujuan. */
export async function GET() {
  const g = await wajibMasuk();
  if (g.respon) return g.respon;
  const p = g.profil;
  return sukses({ me: { id: p.id, role: p.role, nama: p.nama, email: p.email } });
}
