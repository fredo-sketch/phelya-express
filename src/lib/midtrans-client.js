"use client";

import { api } from "@/components/order-store";

let muatSnap = null;
function pasangSnap(url, clientKey) {
  if (typeof window !== "undefined" && window.snap) return Promise.resolve();
  if (muatSnap) return muatSnap;
  muatSnap = new Promise((ok, gagal) => {
    const s = document.createElement("script");
    s.src = url;
    s.setAttribute("data-client-key", clientKey);
    s.onload = ok;
    s.onerror = () => {
      muatSnap = null;
      gagal(new Error("Gagal memuat Midtrans. Periksa koneksi internetmu."));
    };
    document.head.appendChild(s);
  });
  return muatSnap;
}

/**
 * Buka pop-up pembayaran Midtrans Snap. Status "lunas" yang sah tetap ditentukan server (webhook / sinkron),
 * bukan callback browser ini; callback hanya untuk memperbarui tampilan.
 */
export async function bayarMidtrans(resi, { onSukses, onPending, onTutup, onGalat } = {}) {
  const j = await api(`/api/orders/${encodeURIComponent(resi)}/midtrans`, { method: "POST" });
  if (!j.ok) return onGalat?.(j.error);
  try {
    await pasangSnap(j.snapUrl, j.clientKey);
  } catch (e) {
    return onGalat?.(e.message);
  }
  window.snap.pay(j.token, {
    onSuccess: () => onSukses?.(),
    onPending: () => onPending?.(),
    onError: () => onGalat?.("Pembayaran gagal. Silakan coba lagi."),
    onClose: () => onTutup?.(),
  });
}

/** Minta server memeriksa status ke Midtrans (cadangan bila webhook terlambat). */
export const sinkronMidtrans = (resi) => api(`/api/orders/${encodeURIComponent(resi)}/midtrans/sinkron`, { method: "POST" });
