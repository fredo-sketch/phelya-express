import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const galat = (pesan, status = 400) => NextResponse.json({ ok: false, error: pesan }, { status });
export const sukses = (data = {}, status = 200) => NextResponse.json({ ok: true, ...data }, { status });

/** Memetakan kode error PostgreSQL dari fungsi database ke status HTTP + pesan yang aman ditampilkan. */
export function dariDb(error) {
  const kode = error?.code;
  if (kode === "42501") return galat(error.message?.startsWith("permission denied") ? "Anda tidak berhak melakukan aksi ini." : error.message, 403);
  if (kode === "28000") return galat("Silakan masuk terlebih dahulu.", 401);
  if (kode === "P0002") return galat(error.message, 404);
  if (kode === "23505") return galat(error.message?.includes("duplicate key") ? "Data sudah ada." : error.message, 409);
  if (["23514", "22023", "23502", "23503", "22P02"].includes(kode)) return galat(error.message?.startsWith("new row") || error.message?.startsWith("null value") || error.message?.startsWith("insert or update") || error.message?.startsWith("invalid input") ? "Data yang dikirim tidak valid." : error.message, 422);
  console.error("[db]", kode, error?.message);
  return galat("Terjadi kesalahan pada server.", 500);
}

/**
 * Mengambil pengguna dari sesi cookie. `peran` (opsional) membatasi akses ke peran tertentu.
 * Mengembalikan { supabase, user, profil } atau { respon } (401/403) yang langsung dikembalikan handler.
 */
export async function wajibMasuk(peran) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { respon: galat("Silakan masuk terlebih dahulu.", 401) };
  const { data: profil } = await supabase.from("profiles").select("id, role, nama, email, hp, kota_id, tier").eq("id", user.id).maybeSingle();
  if (!profil) return { respon: galat("Profil tidak ditemukan.", 403) };
  if (peran && !(Array.isArray(peran) ? peran : [peran]).includes(profil.role)) return { respon: galat("Anda tidak berhak melakukan aksi ini.", 403) };
  return { supabase, user, profil };
}

/** Membaca body JSON dengan aman. */
export async function bacaJson(request) {
  try {
    const b = await request.json();
    return b && typeof b === "object" ? b : {};
  } catch {
    return {};
  }
}
