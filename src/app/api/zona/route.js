import { wajibMasuk, galat, sukses, dariDb, bacaJson } from "@/lib/api/guard";

function baca(b) {
  const nama = String(b.nama ?? "").trim();
  const perKg = Number(b.perKg);
  const maxKm = b.maxKm === "" || b.maxKm == null ? null : Number(b.maxKm);
  if (nama.length < 3) return { error: "Nama zona minimal 3 karakter." };
  if (!Number.isFinite(perKg) || perKg < 1000) return { error: "Tarif per kg minimal Rp 1.000." };
  if (maxKm !== null && (!Number.isFinite(maxKm) || maxKm <= 0)) return { error: "Jarak maksimal harus lebih dari 0 km." };
  return { nama, perKg: Math.round(perKg), maxKm: maxKm === null ? null : Math.round(maxKm) };
}

export async function POST(request) {
  const g = await wajibMasuk("admin");
  if (g.respon) return g.respon;
  const v = baca(await bacaJson(request));
  if (v.error) return galat(v.error, 422);
  const { data, error } = await g.supabase.from("zona_tarif").insert({ nama: v.nama, max_km: v.maxKm, per_kg: v.perKg }).select("id").single();
  if (error) return error.code === "23505" ? galat("Nama zona atau jarak maksimal sudah dipakai zona lain.", 409) : dariDb(error);
  return sukses({ id: data.id }, 201);
}
