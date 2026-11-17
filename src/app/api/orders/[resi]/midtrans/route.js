import { wajibMasuk, galat, sukses, dariDb } from "@/lib/api/guard";
import { buatTransaksiSnap, clientKey, hostSnap, midtransSiap } from "@/lib/midtrans";

/**
 * Mulai pembayaran Midtrans (pemilik pesanan atau admin). Nominal TIDAK dikirim dari browser:
 * diambil dari kolom `total` yang sudah dihitung database saat pesanan dibuat.
 */
export async function POST(_request, { params }) {
  const g = await wajibMasuk(["pelanggan", "admin"]);
  if (g.respon) return g.respon;
  if (!midtransSiap()) return galat("Pembayaran Midtrans belum dikonfigurasi di server.", 503);
  const { resi } = await params;

  const { data, error } = await g.supabase.rpc("midtrans_mulai", { p_resi: resi });
  if (error) return dariDb(error);
  const m = data?.[0];
  if (!m) return galat("Gagal menyiapkan pembayaran.", 500);
  const info = { clientKey: clientKey(), snapUrl: `${hostSnap()}/snap/snap.js` };
  if (m.token) return sukses({ token: m.token, ...info });

  const item = (id, name, price) => ({ id, name, price, quantity: 1 });
  const items = [item("ongkir", "Ongkos kirim", m.ongkir)];
  if (m.packing_biaya > 0) items.push(item("packing", "Packing tambahan", m.packing_biaya));
  if (m.jemput_biaya > 0) items.push(item("jemput", "Biaya jemput", m.jemput_biaya));
  if (m.diskon > 0) items.push(item("diskon", "Diskon member", -m.diskon));

  const snap = await buatTransaksiSnap({
    transaction_details: { order_id: m.order_id, gross_amount: m.total },
    item_details: items,
    customer_details: { first_name: String(m.nama).slice(0, 50), phone: m.hp, ...(m.email ? { email: m.email } : {}) },
  });
  if (!snap.ok) return galat("Gagal membuat transaksi di Midtrans. Coba lagi sebentar.", 502);

  const simpan = await g.supabase.rpc("midtrans_simpan_token", { p_resi: resi, p_order_id: m.order_id, p_token: snap.token });
  if (simpan.error) return dariDb(simpan.error);
  return sukses({ token: snap.token, ...info });
}
