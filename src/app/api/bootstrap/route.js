import { NextResponse } from "next/server";
import { wajibMasuk, galat, dariDb } from "@/lib/api/guard";
import { petaOrder, petaKurir, petaProfil } from "@/lib/api/mappers";

/** Data awal dashboard: profil, pesanan yang boleh dilihat (dibatasi RLS), dan daftar kurir. */
export async function GET() {
  const g = await wajibMasuk();
  if (g.respon) return g.respon;
  const { supabase, profil } = g;

  const [orders, kurir] = await Promise.all([
    supabase.from("orders").select("*, tracking_events(id, waktu, judul, lokasi, deskripsi)").order("dibuat", { ascending: false }).limit(300),
    supabase.from("kurir").select("*").order("kode"),
  ]);
  if (orders.error) return dariDb(orders.error);
  if (kurir.error) return dariDb(kurir.error);

  const daftarKurir = kurir.data.map(petaKurir);
  return NextResponse.json(
    {
      ok: true,
      me: petaProfil(profil),
      kurirSaya: profil.role === "kurir" ? (daftarKurir.find((k) => k.userId === profil.id) ?? null) : null,
      kurir: daftarKurir,
      orders: orders.data.map((o) => petaOrder(o)),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
