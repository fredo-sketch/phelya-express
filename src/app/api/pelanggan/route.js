import { NextResponse } from "next/server";
import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

export const HP_RE = /^(08|\+628)\d{8,11}$/;
export const bersihHp = (v) => String(v ?? "").replace(/[\s-]/g, "");

/** Daftar pelanggan membership dan pelanggan umum beserta jumlah pesanan (admin). */
export async function GET() {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const [p, u, o] = await Promise.all([
    g.supabase.from("profiles").select("id, nama, email, hp, kota_id, tier, aktif, created_at").eq("role", "pelanggan").order("created_at"),
    g.supabase.from("pelanggan_umum").select("*").order("created_at", { ascending: false }),
    g.supabase.from("orders").select("owner_id, pelanggan_umum_id"),
  ]);
  for (const r of [p, u, o]) if (r.error) return dariDb(r.error);
  const hitungMember = {};
  const hitungUmum = {};
  o.data.forEach((x) => {
    if (x.pelanggan_umum_id) hitungUmum[x.pelanggan_umum_id] = (hitungUmum[x.pelanggan_umum_id] ?? 0) + 1;
    else if (x.owner_id) hitungMember[x.owner_id] = (hitungMember[x.owner_id] ?? 0) + 1;
  });
  return NextResponse.json({
    ok: true,
    member: p.data.map((x) => ({ id: x.id, nama: x.nama, email: x.email, hp: x.hp ?? "", kota: x.kota_id, tier: x.tier, aktif: x.aktif, totalOrder: hitungMember[x.id] ?? 0, bergabung: x.created_at })),
    umum: u.data.map((x) => ({ id: x.id, nama: x.nama, hp: x.hp, alamat: x.alamat, kota: x.kota_id, aktif: x.aktif, totalOrder: hitungUmum[x.id] ?? 0, bergabung: x.created_at })),
  });
}

/** Tambah pelanggan umum. Akun membership dibuat sendiri oleh pelanggan lewat halaman daftar. */
export async function POST(request) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const b = await bacaJson(request);
  const nama = String(b.nama ?? "").trim();
  const hp = bersihHp(b.hp);
  const alamat = String(b.alamat ?? "").trim();
  if (nama.length < 2) return galat("Nama minimal 2 karakter.", 422);
  if (!HP_RE.test(hp)) return galat("Nomor HP tidak valid.", 422);
  if (alamat.length < 5) return galat("Alamat minimal 5 karakter.", 422);
  if (!b.kota) return galat("Pilih kota.", 422);
  const { data, error } = await g.supabase.from("pelanggan_umum").insert({ nama, hp, alamat, kota_id: String(b.kota), dibuat_oleh: g.user.id }).select("id").single();
  if (error) return error.code === "23505" ? galat("Nomor HP sudah terdaftar sebagai pelanggan umum.", 409) : dariDb(error);
  return sukses({ id: data.id }, 201);
}
