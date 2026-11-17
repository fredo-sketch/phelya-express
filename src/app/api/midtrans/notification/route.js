import { NextResponse } from "next/server";
import { midtransSiap, signatureValid } from "@/lib/midtrans";
import { supabaseService } from "@/lib/supabase/server";

/**
 * Webhook Midtrans (HTTP Notification). Tanpa sesi pengguna, jadi keamanannya bertumpu pada:
 * 1) verifikasi signature SHA512 dengan server key, 2) pemeriksaan nominal terhadap total di database,
 * 3) idempotensi (order_id + status) di fungsi midtrans_terapkan, yang hanya bisa dipanggil service_role.
 * Daftarkan URL ini di Midtrans Dashboard: Settings > Configuration > Payment Notification URL.
 */
export async function POST(request) {
  if (!midtransSiap()) return NextResponse.json({ ok: false }, { status: 503 });
  let n;
  try {
    n = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!signatureValid(n)) return NextResponse.json({ ok: false, error: "Signature tidak valid." }, { status: 403 });

  const { data, error } = await supabaseService().rpc("midtrans_terapkan", {
    p_order_id: String(n.order_id ?? ""), p_status: String(n.transaction_status ?? ""), p_fraud: n.fraud_status ?? null,
    p_payment_type: n.payment_type ?? null, p_gross: Number(n.gross_amount), p_raw: n,
  });
  if (error) {
    console.error("[midtrans] webhook", error.code, error.message);
    return NextResponse.json({ ok: false }, { status: 500 }); // 5xx: Midtrans akan mengirim ulang
  }
  return NextResponse.json({ ok: true, hasil: data });
}
