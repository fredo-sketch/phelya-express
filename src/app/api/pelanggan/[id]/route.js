import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";
import { HP_RE, bersihHp } from "../route";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function PATCH(request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { id } = await params;
  if (!UUID.test(id)) return galat("ID pelanggan tidak valid.", 422);
  const b = await bacaJson(request);

  if (b.jenis === "member") {
    const { error } = await g.supabase.rpc("admin_ubah_member", {
      p_id: id, p_nama: String(b.nama ?? ""), p_hp: bersihHp(b.hp), p_kota: String(b.kota ?? ""), p_tier: String(b.tier ?? ""), p_aktif: b.aktif !== false,
    });
    if (error) return dariDb(error);
    return sukses();
  }

  const nama = String(b.nama ?? "").trim();
  const hp = bersihHp(b.hp);
  const alamat = String(b.alamat ?? "").trim();
  if (nama.length < 2) return galat("Nama minimal 2 karakter.", 422);
  if (!HP_RE.test(hp)) return galat("Nomor HP tidak valid.", 422);
  if (alamat.length < 5) return galat("Alamat minimal 5 karakter.", 422);
  const { data, error } = await g.supabase.from("pelanggan_umum").update({ nama, hp, alamat, kota_id: String(b.kota ?? ""), aktif: b.aktif !== false }).eq("id", id).select("id");
  if (error) return error.code === "23505" ? galat("Nomor HP sudah dipakai pelanggan umum lain.", 409) : dariDb(error);
  if (!data?.length) return galat("Pelanggan tidak ditemukan.", 404);
  return sukses();
}

/**
 * Hapus. Pelanggan umum yang sudah punya pesanan dinonaktifkan saja (riwayat tetap utuh).
 * Akun membership tidak dihapus dari sini (terhubung ke akun login): hanya dinonaktifkan.
 */
export async function DELETE(request, { params }) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { id } = await params;
  if (!UUID.test(id)) return galat("ID pelanggan tidak valid.", 422);
  const jenis = new URL(request.url).searchParams.get("jenis");

  if (jenis === "member") {
    const { data: p, error: e1 } = await g.supabase.from("profiles").select("nama, hp, kota_id, tier").eq("id", id).eq("role", "pelanggan").maybeSingle();
    if (e1) return dariDb(e1);
    if (!p) return galat("Pelanggan tidak ditemukan.", 404);
    const { error } = await g.supabase.rpc("admin_ubah_member", { p_id: id, p_nama: p.nama, p_hp: p.hp ?? "", p_kota: p.kota_id ?? "", p_tier: p.tier, p_aktif: false });
    if (error) return dariDb(error);
    return sukses({ dinonaktifkan: true });
  }

  const { data, error } = await g.supabase.from("pelanggan_umum").delete().eq("id", id).select("id");
  if (error?.code === "23503") {
    const u = await g.supabase.from("pelanggan_umum").update({ aktif: false }).eq("id", id);
    if (u.error) return dariDb(u.error);
    return sukses({ dinonaktifkan: true });
  }
  if (error) return dariDb(error);
  if (!data?.length) return galat("Pelanggan tidak ditemukan.", 404);
  return sukses({ dinonaktifkan: false });
}
