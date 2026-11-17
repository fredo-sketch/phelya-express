import { NextResponse } from "next/server";
import { galat, bacaJson, peranOpsional } from "@/lib/api/guard";

function petaHasil(h) {
  return {
    ok: true,
    zona: { id: h.zona_id, nama: h.zona_nama },
    jarak: h.jarak_km,
    tertagih: h.tertagih,
    ongkir: h.ongkir,
    estimasi: h.estimasi,
    packing: h.packing_biaya,
    jemput: { jarakKm: Number(h.jemput_jarak_km), biaya: h.jemput_biaya },
    diskon: h.diskon,
    total: h.total,
  };
}

/**
 * Hitung biaya (publik) memakai fungsi database yang sama dengan saat pesanan dibuat (hitung_biaya).
 * `layanan: "semua"` menghitung ongkir dasar semua layanan aktif (tanpa packing/jemput) untuk daftar pilihan.
 * Untuk satu layanan, packing dan cara serah ikut dihitung. Angka ini hanya pratinjau: harga resmi
 * dihitung ulang di server saat pesanan disimpan.
 */
export async function POST(request) {
  const b = await bacaJson(request);
  const berat = Number(b.berat);
  if (!b.asal || !b.tujuan || !b.layanan) return galat("Pilih kota asal, kota tujuan, dan layanan.", 422);
  if (!Number.isFinite(berat) || berat <= 0) return galat("Berat harus lebih dari 0 kg.", 422);

  const { supabase, peran } = await peranOpsional();
  // Admin boleh menghitung atas nama pelanggan membership (form Tambah Order); tamu tidak pernah dihitung sebagai member
  const member = peran === "pelanggan" || (peran === "admin" && b.member === true);
  const lat = b.jemputLat === "" || b.jemputLat == null ? null : Number(b.jemputLat);
  const lng = b.jemputLng === "" || b.jemputLng == null ? null : Number(b.jemputLng);

  const hitung = async (layanan, ekstra = {}) => {
    const { data, error } = await supabase.rpc("hitung_biaya", {
      p_asal: String(b.asal),
      p_tujuan: String(b.tujuan),
      p_berat: berat,
      p_layanan: layanan,
      p_packing: ekstra.packing ?? "tidak",
      p_metode: ekstra.metode ?? "antar_sendiri",
      p_jemput_lat: ekstra.lat ?? null,
      p_jemput_lng: ekstra.lng ?? null,
      p_member: member,
    });
    if (error) return { ok: false, error: error.code === "22023" ? error.message : "Gagal menghitung ongkir." };
    return data?.[0] ? petaHasil(data[0]) : { ok: false, error: "Gagal menghitung ongkir." };
  };

  if (b.layanan === "semua") {
    const { data: daftar, error } = await supabase.from("layanan").select("id").eq("aktif", true);
    if (error) return galat("Gagal memuat layanan.", 500);
    const hasil = Object.fromEntries(await Promise.all(daftar.map(async (l) => [l.id, await hitung(l.id)])));
    return NextResponse.json({ ok: true, hasil });
  }

  const h = await hitung(String(b.layanan), {
    packing: String(b.packing ?? "tidak"),
    metode: String(b.metode ?? "antar_sendiri"),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  });
  return h.ok ? NextResponse.json(h) : galat(h.error, 422);
}
