import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/** Helper Midtrans (server saja). Kunci rahasia hanya dibaca dari env server. */
const produksi = () => process.env.MIDTRANS_IS_PRODUCTION === "true";
export const hostSnap = () => (produksi() ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com");
const hostApi = () => (produksi() ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com");
export const clientKey = () => process.env.MIDTRANS_CLIENT_KEY ?? "";
export const midtransSiap = () => Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY);
const auth = () => "Basic " + Buffer.from(`${process.env.MIDTRANS_SERVER_KEY}:`).toString("base64");

/** Verifikasi signature notifikasi: SHA512(order_id + status_code + gross_amount + server_key). */
export function signatureValid(n) {
  const kunci = process.env.MIDTRANS_SERVER_KEY;
  if (!kunci || !n?.signature_key) return false;
  const hitung = createHash("sha512").update(`${n.order_id}${n.status_code}${n.gross_amount}${kunci}`).digest("hex");
  const a = Buffer.from(hitung);
  const b = Buffer.from(String(n.signature_key));
  return a.length === b.length && timingSafeEqual(a, b);
}

async function panggil(url, opsi) {
  const res = await fetch(url, { ...opsi, headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: auth() }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  const j = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, j };
}

/** Buat transaksi Snap. Mengembalikan { ok, token }. */
export async function buatTransaksiSnap(body) {
  const r = await panggil(`${hostSnap()}/snap/v1/transactions`, { method: "POST", body: JSON.stringify(body) });
  if (!r.ok || !r.j.token) {
    console.error("[midtrans] snap gagal", r.status, JSON.stringify(r.j).slice(0, 300));
    return { ok: false };
  }
  return { ok: true, token: r.j.token };
}

/** Status transaksi langsung dari Midtrans (dipakai sebagai cadangan bila webhook belum sampai). */
export async function statusTransaksi(orderId) {
  const r = await panggil(`${hostApi()}/v2/${encodeURIComponent(orderId)}/status`, { method: "GET" });
  return r.ok && r.j.transaction_status ? { ok: true, data: r.j } : { ok: false, status: r.status };
}
