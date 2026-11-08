import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/server";
import { galat } from "@/lib/api/guard";
import { petaLowongan } from "@/lib/lowongan-data";

export async function GET() {
  const { data, error } = await supabaseAnon().from("lowongan").select("*").eq("aktif", true).order("batas");
  if (error) return galat("Gagal memuat lowongan.", 500);
  return NextResponse.json({ ok: true, lowongan: data.map(petaLowongan) });
}
