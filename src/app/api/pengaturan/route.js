import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/server";
import { galat, sukses, dariDb, bacaJson, wajibMasuk } from "@/lib/api/guard";

/** Pengaturan publik: lokasi kantor, aturan jemput, dan nomor WhatsApp admin. */
export async function GET() {
  const { data, error } = await supabaseAnon().from("pengaturan").select("*").eq("id", 1).single();
  if (error) return galat("Gagal memuat pengaturan.", 500);
  return NextResponse.json({
    ok: true,
    pengaturan: {
      kantorNama: data.kantor_nama,
      kantorAlamat: data.kantor_alamat,
      kantorLat: Number(data.kantor_lat),
      kantorLng: Number(data.kantor_lng),
      jemputMaksKm: data.jemput_maks_km,
      jemputBiayaDasar: data.jemput_biaya_dasar,
      jemputBiayaPerKm: data.jemput_biaya_per_km,
      jemputMinBerat: Number(data.jemput_min_berat),
      diskonMemberPersen: Number(data.diskon_member_persen),
      waAdmin: data.wa_admin,
    },
  });
}

/** Admin mengubah lokasi kantor, aturan dan tarif jemput, serta nomor WhatsApp admin. */
export async function PATCH(request) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const b = await bacaJson(request);
  const n = (v) => Number(v);
  const lat = n(b.kantorLat);
  const lng = n(b.kantorLng);
  const maks = n(b.jemputMaksKm);
  const dasar = n(b.jemputBiayaDasar);
  const perKm = n(b.jemputBiayaPerKm);
  const minBerat = n(b.jemputMinBerat);
  const diskon = n(b.diskonMemberPersen ?? 0);
  const wa = String(b.waAdmin ?? "").replace(/[\s+-]/g, "").replace(/^0/, "62");
  const nama = String(b.kantorNama ?? "").trim();
  const alamat = String(b.kantorAlamat ?? "").trim();
  if (nama.length < 3 || alamat.length < 5) return galat("Nama dan alamat kantor wajib diisi.", 422);
  if (!(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180)) return galat("Koordinat kantor tidak valid.", 422);
  if (!Number.isInteger(maks) || maks < 1 || maks > 100) return galat("Jarak jemput maksimal harus 1 sampai 100 km.", 422);
  if (!Number.isInteger(dasar) || dasar < 0 || !Number.isInteger(perKm) || perKm < 0) return galat("Biaya jemput harus bilangan bulat, minimal Rp 0.", 422);
  if (!(minBerat > 0)) return galat("Berat minimal jemput harus lebih dari 0 kg.", 422);
  if (!(diskon >= 0 && diskon <= 100)) return galat("Diskon member harus 0 sampai 100 persen.", 422);
  if (!/^62[0-9]{8,13}$/.test(wa)) return galat("Nomor WhatsApp harus berformat 62xxxxxxxxxx.", 422);
  const { error } = await g.supabase.from("pengaturan").update({
    kantor_nama: nama, kantor_alamat: alamat, kantor_lat: lat, kantor_lng: lng,
    jemput_maks_km: maks, jemput_biaya_dasar: dasar, jemput_biaya_per_km: perKm, jemput_min_berat: minBerat,
    diskon_member_persen: diskon, wa_admin: wa, updated_at: new Date().toISOString(),
  }).eq("id", 1);
  if (error) return dariDb(error);
  return sukses();
}
