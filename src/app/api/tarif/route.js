import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/server";
import { galat } from "@/lib/api/guard";

/** Zona tarif aktif (publik). Diurutkan dari jarak terdekat; zona terakhir tanpa batas jarak. */
export async function GET() {
  const { data, error } = await supabaseAnon().from("zona_tarif").select("id, nama, max_km, per_kg");
  if (error) return galat("Gagal memuat tarif.", 500);
  const zona = data
    .map((z) => ({ id: z.id, nama: z.nama, maxKm: z.max_km, perKg: z.per_kg }))
    .sort((a, b) => (a.maxKm ?? Infinity) - (b.maxKm ?? Infinity));
  return NextResponse.json({ ok: true, zona });
}
