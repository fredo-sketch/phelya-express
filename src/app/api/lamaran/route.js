import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { wajibMasuk, galat, sukses, dariDb } from "@/lib/api/guard";

const MAKS = 2 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HP_RE = /^(08|\+628)\d{8,11}$/;

/** Kirim lamaran (tamu boleh). CV divalidasi dari isi berkas (harus PDF asli, maks. 2 MB). */
export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return galat("Permintaan tidak valid.", 400);
  }
  const t = (k) => String(form.get(k) ?? "").trim();
  const d = { slug: t("slug"), nama: t("nama"), email: t("email").toLowerCase(), hp: t("hp").replace(/[\s-]/g, ""), kota: t("kota"), pesan: t("pesan") };
  if (d.nama.length < 2) return galat("Nama lengkap wajib diisi.", 422);
  if (!EMAIL_RE.test(d.email)) return galat("Format email tidak valid.", 422);
  if (!HP_RE.test(d.hp)) return galat("Nomor HP tidak valid. Contoh: 081234567890.", 422);
  if (d.kota.length < 2) return galat("Domisili wajib diisi.", 422);
  if (d.pesan.length > 1000) return galat("Pesan maksimal 1000 karakter.", 422);

  const cv = form.get("cv");
  if (!cv || typeof cv === "string") return galat("Unggah CV dalam format PDF.", 422);
  if (cv.size > MAKS) return galat("Ukuran CV maksimal 2 MB.", 422);
  const buf = Buffer.from(await cv.arrayBuffer());
  if (buf.length < 5 || buf.toString("ascii", 0, 5) !== "%PDF-") return galat("CV harus berformat PDF.", 422);

  const supabase = await supabaseServer();
  const path = `cv/${randomUUID()}.pdf`;
  const up = await supabase.storage.from("cv").upload(path, buf, { contentType: "application/pdf", upsert: false });
  if (up.error) return galat("Gagal mengunggah CV. Coba lagi.", 500);

  const { data, error } = await supabase.rpc("kirim_lamaran", {
    p_slug: d.slug, p_nama: d.nama, p_email: d.email, p_hp: d.hp, p_kota: d.kota, p_pesan: d.pesan || null, p_cv_path: path, p_cv_ukuran: buf.length,
  });
  if (error) return dariDb(error);
  return sukses({ id: data }, 201);
}

/** Daftar lamaran (admin). */
export async function GET() {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const { data, error } = await g.supabase
    .from("lamaran")
    .select("id, lowongan_slug, nama, email, hp, kota, pesan, cv_ukuran, status, created_at, lowongan(judul)")
    .order("created_at", { ascending: false });
  if (error) return dariDb(error);
  return NextResponse.json({
    ok: true,
    lamaran: data.map((l) => ({ id: l.id, slug: l.lowongan_slug, posisi: l.lowongan?.judul ?? l.lowongan_slug, nama: l.nama, email: l.email, hp: l.hp, kota: l.kota, pesan: l.pesan, ukuran: l.cv_ukuran, status: l.status, dibuat: l.created_at })),
  });
}
