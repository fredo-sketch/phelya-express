import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

const HP_RE = /^(08|\+628)\d{8,11}$/;
const hp = (v) => String(v ?? "").replace(/[\s-]/g, "");
const teks = (v) => String(v ?? "").trim();
const angka = (v) => (v == null || v === "" ? null : Number(v));

/**
 * Tambah Order dari kantor (admin). Biaya TIDAK diterima dari browser: dihitung database (hitung_biaya),
 * termasuk diskon member. Untuk pelanggan membership, nama dan HP pengirim diambil dari profil di server.
 */
export async function POST(request) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const b = await bacaJson(request);

  const tipe = b.tipe === "member" ? "member" : b.tipe === "umum" ? "umum" : null;
  if (!tipe) return galat("Pilih jenis pelanggan.", 422);
  let pNama = teks(b.pNama);
  let pHp = hp(b.pHp);
  if (tipe === "member") {
    if (!b.memberId) return galat("Pilih pelanggan membership terlebih dahulu.", 422);
    const { data: m, error } = await g.supabase.from("profiles").select("nama, hp").eq("id", String(b.memberId)).eq("role", "pelanggan").maybeSingle();
    if (error) return dariDb(error);
    if (!m) return galat("Pelanggan membership tidak ditemukan.", 404);
    pNama = m.nama;
    pHp = hp(m.hp) || pHp;
  }

  const d = {
    rNama: teks(b.rNama), rHp: hp(b.rHp), rKota: teks(b.rKota), rAlamat: teks(b.rAlamat), pKota: teks(b.pKota), pAlamat: teks(b.pAlamat),
    isi: teks(b.isi), berat: Number(b.berat), catatan: teks(b.catatan), layanan: teks(b.layanan),
    packing: teks(b.packing) || "tidak", metode: teks(b.metode) || "antar_sendiri", bayar: teks(b.bayar) || "tunai",
    jAlamat: teks(b.jemputAlamat), jLat: angka(b.jemputLat), jLng: angka(b.jemputLng),
  };
  if (pNama.length < 2 || d.rNama.length < 2) return galat("Nama pengirim dan penerima minimal 2 karakter.", 422);
  if (!HP_RE.test(pHp) || !HP_RE.test(d.rHp)) return galat("Nomor HP pengirim atau penerima tidak valid.", 422);
  if (d.pAlamat.length < 5 || d.rAlamat.length < 5) return galat("Alamat pengirim dan penerima minimal 5 karakter.", 422);
  if (d.isi.length < 2) return galat("Isi paket wajib diisi.", 422);
  if (!Number.isFinite(d.berat) || d.berat <= 0) return galat("Berat harus lebih dari 0 kg.", 422);
  if (d.catatan.length > 300) return galat("Catatan maksimal 300 karakter.", 422);
  if (!["jemput", "antar_sendiri"].includes(d.metode)) return galat("Pilih cara paket sampai ke Phelya.", 422);
  if (!["tunai", "midtrans"].includes(d.bayar)) return galat("Pilih metode pembayaran.", 422);
  if (d.metode === "jemput" && (d.jAlamat.length < 5 || !Number.isFinite(d.jLat) || !Number.isFinite(d.jLng))) return galat("Alamat dan titik jemput wajib diisi.", 422);

  const { data, error } = await g.supabase.rpc("buat_order_admin", {
    p_tipe: tipe, p_member_id: tipe === "member" ? String(b.memberId) : null, p_umum_id: null,
    p_pengirim_nama: pNama, p_pengirim_hp: pHp, p_pengirim_kota: d.pKota, p_pengirim_alamat: d.pAlamat,
    p_penerima_nama: d.rNama, p_penerima_hp: d.rHp, p_penerima_kota: d.rKota, p_penerima_alamat: d.rAlamat,
    p_isi: d.isi, p_berat: d.berat, p_catatan: d.catatan || null, p_layanan: d.layanan,
    p_packing: d.packing, p_metode: d.metode,
    p_jemput_alamat: d.metode === "jemput" ? d.jAlamat : null, p_jemput_lat: d.metode === "jemput" ? d.jLat : null, p_jemput_lng: d.metode === "jemput" ? d.jLng : null,
    p_bayar: d.bayar,
  });
  if (error) return dariDb(error);
  return sukses({ resi: data.resi, total: data.total, bayar: data.bayar }, 201);
}
