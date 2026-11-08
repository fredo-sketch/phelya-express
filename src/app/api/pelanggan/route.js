import { NextResponse } from "next/server";
import { wajibMasuk, dariDb } from "@/lib/api/guard";

/** Daftar pelanggan beserta jumlah pesanan (admin). */
export async function GET() {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const [p, o] = await Promise.all([
    g.supabase.from("profiles").select("id, nama, email, kota_id, tier, created_at").eq("role", "pelanggan").order("created_at"),
    g.supabase.from("orders").select("owner_id"),
  ]);
  if (p.error) return dariDb(p.error);
  if (o.error) return dariDb(o.error);
  const hitung = {};
  o.data.forEach((x) => (hitung[x.owner_id] = (hitung[x.owner_id] ?? 0) + 1));
  return NextResponse.json({
    ok: true,
    pelanggan: p.data.map((x) => ({ id: x.id, nama: x.nama, email: x.email, kota: x.kota_id, tier: x.tier, totalOrder: hitung[x.id] ?? 0, bergabung: x.created_at })),
  });
}
