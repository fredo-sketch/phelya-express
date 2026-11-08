import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

const HP_RE = /^(08|\+628)\d{8,11}$/;
const hp = (v) => String(v ?? "").replace(/[\s-]/g, "");
const teks = (v) => String(v ?? "").trim();

/** Buat pesanan. Ongkir, zona, resi, dan estimasi dihitung di database, bukan dari data browser. */
export async function POST(request) {
  const g = await wajibMasuk("pelanggan");
  if (g.respon) return g.respon;
  const b = await bacaJson(request);

  const d = {
    pNama: teks(b.pNama), pHp: hp(b.pHp), pKota: teks(b.pKota), pAlamat: teks(b.pAlamat),
    rNama: teks(b.rNama), rHp: hp(b.rHp), rKota: teks(b.rKota), rAlamat: teks(b.rAlamat),
    isi: teks(b.isi), berat: Number(b.berat), catatan: teks(b.catatan), layanan: teks(b.layanan), cod: b.cod === true,
  };
  if (d.pNama.length < 2 || d.rNama.length < 2) return galat("Nama pengirim dan penerima minimal 2 karakter.", 422);
  if (!HP_RE.test(d.pHp) || !HP_RE.test(d.rHp)) return galat("Nomor HP pengirim atau penerima tidak valid.", 422);
  if (d.pAlamat.length < 5 || d.rAlamat.length < 5) return galat("Alamat pengirim dan penerima minimal 5 karakter.", 422);
  if (d.isi.length < 2) return galat("Isi paket wajib diisi.", 422);
  if (!Number.isFinite(d.berat) || d.berat <= 0) return galat("Berat harus lebih dari 0 kg.", 422);
  if (d.catatan.length > 300) return galat("Catatan maksimal 300 karakter.", 422);

  const { data, error } = await g.supabase.rpc("buat_order", {
    p_pengirim_nama: d.pNama, p_pengirim_hp: d.pHp, p_pengirim_kota: d.pKota, p_pengirim_alamat: d.pAlamat,
    p_penerima_nama: d.rNama, p_penerima_hp: d.rHp, p_penerima_kota: d.rKota, p_penerima_alamat: d.rAlamat,
    p_isi: d.isi, p_berat: d.berat, p_catatan: d.catatan || null, p_layanan: d.layanan, p_cod: d.cod,
  });
  if (error) return dariDb(error);
  return sukses({ resi: data.resi, ongkir: data.ongkir }, 201);
}
