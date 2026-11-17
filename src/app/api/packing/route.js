import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/server";
import { galat } from "@/lib/api/guard";

/** Pilihan packing aktif (publik), diurutkan sesuai urutan tampil. */
export async function GET() {
  const { data, error } = await supabaseAnon().from("packing_options").select("id, nama, deskripsi, harga, urutan").eq("aktif", true).order("urutan");
  if (error) return galat("Gagal memuat pilihan packing.", 500);
  return NextResponse.json({ ok: true, packing: data.map((p) => ({ id: p.id, nama: p.nama, deskripsi: p.deskripsi ?? "", harga: p.harga })) });
}
