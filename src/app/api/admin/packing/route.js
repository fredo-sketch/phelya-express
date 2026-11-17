import { NextResponse } from "next/server";
import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

export const petaPacking = (p) => ({ id: p.id, nama: p.nama, deskripsi: p.deskripsi ?? "", harga: p.harga, urutan: p.urutan, aktif: p.aktif });

/** Validasi bersama POST dan PATCH. */
export function bacaPacking(b) {
  const nama = String(b.nama ?? "").trim();
  const harga = Number(b.harga);
  const urutan = b.urutan === "" || b.urutan == null ? 0 : Number(b.urutan);
  if (nama.length < 3) return { error: "Nama packing minimal 3 karakter." };
  if (!Number.isInteger(harga) || harga < 0) return { error: "Harga harus bilangan bulat, minimal Rp 0." };
  if (!Number.isInteger(urutan) || urutan < 0 || urutan > 100) return { error: "Urutan tampil harus antara 0 dan 100." };
  return { nama, harga, urutan, deskripsi: String(b.deskripsi ?? "").trim() || null };
}

/** Semua pilihan packing, termasuk yang nonaktif (admin). */
export async function GET() {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { data, error } = await g.supabase.from("packing_options").select("*").order("urutan");
  if (error) return dariDb(error);
  return NextResponse.json({ ok: true, packing: data.map(petaPacking) });
}

export async function POST(request) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const v = bacaPacking(await bacaJson(request));
  if (v.error) return galat(v.error, 422);
  const id = v.nama.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!id) return galat("Nama packing tidak valid.", 422);
  const { error } = await g.supabase.from("packing_options").insert({ id, nama: v.nama, deskripsi: v.deskripsi, harga: v.harga, urutan: v.urutan });
  if (error) return error.code === "23505" ? galat("Nama packing sudah dipakai.", 409) : dariDb(error);
  return sukses({ id }, 201);
}
