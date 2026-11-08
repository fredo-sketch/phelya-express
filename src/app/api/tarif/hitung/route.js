import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/server";
import { galat, bacaJson } from "@/lib/api/guard";

function petaHasil(h) {
  return { ok: true, zona: { id: h.zona_id, nama: h.zona_nama }, jarak: h.jarak_km, tertagih: h.tertagih, ongkir: h.ongkir, estimasi: h.estimasi };
}

/**
 * Hitung ongkir (publik) memakai fungsi database yang sama dengan saat pesanan dibuat.
 * `layanan: "semua"` menghitung semua layanan aktif sekaligus (untuk daftar pilihan layanan).
 */
export async function POST(request) {
  const b = await bacaJson(request);
  const berat = Number(b.berat);
  if (!b.asal || !b.tujuan || !b.layanan) return galat("Pilih kota asal, kota tujuan, dan layanan.", 422);
  if (!Number.isFinite(berat) || berat <= 0) return galat("Berat harus lebih dari 0 kg.", 422);

  const db = supabaseAnon();
  const hitung = async (layanan) => {
    const { data, error } = await db.rpc("hitung_ongkir", { p_asal: String(b.asal), p_tujuan: String(b.tujuan), p_berat: berat, p_layanan: layanan });
    if (error) return { ok: false, error: error.code === "22023" ? error.message : "Gagal menghitung ongkir." };
    return data?.[0] ? petaHasil(data[0]) : { ok: false, error: "Gagal menghitung ongkir." };
  };

  if (b.layanan === "semua") {
    const { data: daftar, error } = await db.from("layanan").select("id").eq("aktif", true);
    if (error) return galat("Gagal memuat layanan.", 500);
    const hasil = Object.fromEntries(await Promise.all(daftar.map(async (l) => [l.id, await hitung(l.id)])));
    return NextResponse.json({ ok: true, hasil });
  }

  const h = await hitung(String(b.layanan));
  return h.ok ? NextResponse.json(h) : galat(h.error, 422);
}
