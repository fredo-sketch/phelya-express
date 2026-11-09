import { NextResponse } from "next/server";
import { wajibMasuk, galat } from "@/lib/api/guard";
import { buatLabelPdf } from "@/lib/label-pdf";
import { kotaById, LAYANAN } from "@/lib/tariff";

/**
 * Label resi PDF (100 x 150 mm) dengan QR ke halaman pelacakan.
 * Siapa yang boleh mengunduh ditentukan RLS: pemilik pesanan, kurir yang ditugaskan, atau admin.
 */
export async function GET(request, { params }) {
  const g = await wajibMasuk();
  if (g.respon) return g.respon;
  const { resi: mentah } = await params;
  const resi = String(mentah).toUpperCase();
  if (!/^[A-Z0-9]{6,20}$/.test(resi)) return galat("Resi tidak valid.", 422);

  const { data: o, error } = await g.supabase.from("orders").select("*").eq("resi", resi).maybeSingle();
  if (error) return galat("Terjadi kesalahan pada server.", 500);
  if (!o) return galat("Pesanan tidak ditemukan.", 404);

  const pdf = await buatLabelPdf({
    o,
    asal: kotaById(o.pengirim_kota)?.nama ?? o.pengirim_kota,
    tujuan: kotaById(o.penerima_kota)?.nama ?? o.penerima_kota,
    layanan: LAYANAN[o.layanan_id]?.nama ?? o.layanan_id,
    urlLacak: `${new URL(request.url).origin}/lacak/${resi}`,
  });
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="label-${resi}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
