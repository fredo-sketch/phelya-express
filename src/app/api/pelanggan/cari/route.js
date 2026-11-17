import { NextResponse } from "next/server";
import { wajibMasuk, dariDb } from "@/lib/api/guard";

/** Cari pelanggan membership aktif berdasarkan nama, nomor HP, atau email (untuk form Tambah Order). */
export async function GET(request) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  // Hanya huruf, angka, spasi, dan @ . + - supaya aman dipakai di filter PostgREST
  const q = (new URL(request.url).searchParams.get("q") ?? "").replace(/[^\p{L}\p{N}@.+\s-]/gu, "").trim().slice(0, 50);
  if (q.length < 2) return NextResponse.json({ ok: true, hasil: [] });
  const { data, error } = await g.supabase
    .from("profiles")
    .select("id, nama, email, hp, kota_id, tier")
    .eq("role", "pelanggan")
    .eq("aktif", true)
    .or(`nama.ilike.%${q}%,email.ilike.%${q}%,hp.ilike.%${q}%`)
    .order("nama")
    .limit(8);
  if (error) return dariDb(error);
  return NextResponse.json({ ok: true, hasil: data.map((x) => ({ id: x.id, nama: x.nama, email: x.email, hp: x.hp ?? "", kota: x.kota_id, tier: x.tier })) });
}
