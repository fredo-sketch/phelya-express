import { NextResponse } from "next/server";
import { wajibMasuk, dariDb } from "@/lib/api/guard";

/** Semua layanan termasuk yang nonaktif (admin). */
export async function GET() {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { data, error } = await g.supabase.from("layanan").select("id, nama, singkat, deskripsi, pengali, min_berat, max_zona, aktif").order("pengali");
  if (error) return dariDb(error);
  return NextResponse.json({
    ok: true,
    layanan: data.map((l) => ({ id: l.id, nama: l.nama, singkat: l.singkat, deskripsi: l.deskripsi, pengali: Number(l.pengali), minBerat: Number(l.min_berat), maxZona: l.max_zona, aktif: l.aktif })),
  });
}
