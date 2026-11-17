import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

const HP_RE = /^(08|\+628)\d{8,11}$/;
const hp = (v) => String(v ?? "").replace(/[\s-]/g, "");
const teks = (v) => String(v ?? "").trim();

/** Buat pesanan. Ongkir, packing, biaya jemput, total, resi, dan estimasi dihitung di database, bukan dari data browser. */
export async function POST(request) {
  const g = await wajibMasuk("pelanggan");
  if (g.respon) return g.respon;
  const b = await bacaJson(request);

  const d = {
    pNama: teks(b.pNama), pHp: hp(b.pHp), pKota: teks(b.pKota), pAlamat: teks(b.pAlamat),
    rNama: teks(b.rNama), rHp: hp(b.rHp), rKota: teks(b.rKota), rAlamat: teks(b.rAlamat),
    isi: teks(b.isi), berat: Number(b.berat), catatan: teks(b.catatan), layanan: teks(b.layanan), cod: b.cod === true,
    packing: teks(b.packing) || "tidak", metode: teks(b.metode) || "antar_sendiri",
    jAlamat: teks(b.jemputAlamat), jLat: b.jemputLat == null || b.jemputLat === "" ? null : Number(b.jemputLat), jLng: b.jemputLng == null || b.jemputLng === "" ? null : Number(b.jemputLng),
  };
  if (d.pNama.length < 2 || d.rNama.length < 2) return galat("Nama pengirim dan penerima minimal 2 karakter.", 422);
  if (!HP_RE.test(d.pHp) || !HP_RE.test(d.rHp)) return galat("Nomor HP pengirim atau penerima tidak valid.", 422);
  if (d.pAlamat.length < 5 || d.rAlamat.length < 5) return galat("Alamat pengirim dan penerima minimal 5 karakter.", 422);
  if (d.isi.length < 2) return galat("Isi paket wajib diisi.", 422);
  if (!Number.isFinite(d.berat) || d.berat <= 0) return galat("Berat harus lebih dari 0 kg.", 422);
  if (d.catatan.length > 300) return galat("Catatan maksimal 300 karakter.", 422);
  if (!["jemput", "antar_sendiri"].includes(d.metode)) return galat("Pilih cara paket sampai ke Phelya.", 422);
  if (d.metode === "jemput") {
    if (d.jAlamat.length < 5) return galat("Alamat jemput minimal 5 karakter.", 422);
    if (!Number.isFinite(d.jLat) || !Number.isFinite(d.jLng)) return galat("Tandai titik jemput di peta.", 422);
  }

  const { data, error } = await g.supabase.rpc("buat_order", {
    p_pengirim_nama: d.pNama, p_pengirim_hp: d.pHp, p_pengirim_kota: d.pKota, p_pengirim_alamat: d.pAlamat,
    p_penerima_nama: d.rNama, p_penerima_hp: d.rHp, p_penerima_kota: d.rKota, p_penerima_alamat: d.rAlamat,
    p_isi: d.isi, p_berat: d.berat, p_catatan: d.catatan || null, p_layanan: d.layanan, p_cod: d.cod,
    p_packing: d.packing, p_metode: d.metode,
    p_jemput_alamat: d.metode === "jemput" ? d.jAlamat : null, p_jemput_lat: d.metode === "jemput" ? d.jLat : null, p_jemput_lng: d.metode === "jemput" ? d.jLng : null,
  });
  if (error) return dariDb(error);
  return sukses({ resi: data.resi, ongkir: data.ongkir, total: data.total }, 201);
}
