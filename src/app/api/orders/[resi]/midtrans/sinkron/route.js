import { wajibMasuk, galat, sukses, dariDb } from "@/lib/api/guard";
import { midtransSiap, statusTransaksi } from "@/lib/midtrans";
import { supabaseService } from "@/lib/supabase/server";

/**
 * Cadangan bila webhook belum sampai (mis. URL notifikasi belum diatur): tanya status ke Midtrans,
 * lalu terapkan lewat fungsi database yang sama dengan webhook (idempotent).
 * Siapa yang boleh memanggil ditentukan RLS: hanya pemilik pesanan atau admin yang bisa membaca ordernya.
 */
export async function POST(_request, { params }) {
  const g = await wajibMasuk(["pelanggan", "admin"]);
  if (g.respon) return g.respon;
  if (!midtransSiap()) return galat("Pembayaran Midtrans belum dikonfigurasi di server.", 503);
  const { resi } = await params;
  const { data: o, error } = await g.supabase.from("orders").select("resi, bayar, midtrans_order_id").eq("resi", String(resi).toUpperCase()).maybeSingle();
  if (error) return dariDb(error);
  if (!o) return galat("Pesanan tidak ditemukan.", 404);
  if (o.bayar === "lunas") return sukses({ bayar: "lunas" });
  if (!o.midtrans_order_id) return galat("Pembayaran belum dimulai.", 422);

  const s = await statusTransaksi(o.midtrans_order_id);
  if (!s.ok) return galat("Transaksi belum ditemukan di Midtrans.", 404);
  const d = s.data;
  const { data: hasil, error: e2 } = await supabaseService().rpc("midtrans_terapkan", {
    p_order_id: o.midtrans_order_id, p_status: d.transaction_status, p_fraud: d.fraud_status ?? null,
    p_payment_type: d.payment_type ?? null, p_gross: Number(d.gross_amount), p_raw: d,
  });
  if (e2) {
    console.error("[midtrans] sinkron", e2.code, e2.message);
    return galat("Gagal memperbarui status pembayaran.", 500);
  }
  return sukses({ bayar: hasil === "lunas" || hasil === "sudah_lunas" ? "lunas" : "menunggu", status: d.transaction_status });
}
