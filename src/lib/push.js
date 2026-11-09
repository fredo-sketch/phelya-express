"use client";

import { api } from "@/components/order-store";

/** Kunci publik VAPID (aman di browser). Kosong bila belum dikonfigurasi. */
export const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function pushDidukung() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function kunciKeBytes(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registrasi() {
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  return reg;
}

/** Perangkat ini sudah berlangganan? */
export async function sudahBerlangganan() {
  if (!pushDidukung()) return false;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return !!(reg && (await reg.pushManager.getSubscription()));
}

/**
 * Minta izin (harus dipanggil dari klik), berlangganan push, lalu daftarkan ke server.
 * `resi` diisi untuk langganan tamu satu paket; kosong untuk langganan akun.
 */
export async function aktifkanPush({ resi } = {}) {
  if (!pushDidukung()) return { ok: false, error: "Browser ini belum mendukung notifikasi." };
  if (!VAPID_PUBLIC) return { ok: false, error: "Notifikasi push belum dikonfigurasi di server." };
  const izin = await Notification.requestPermission();
  if (izin !== "granted") return { ok: false, izin, error: "Izin notifikasi ditolak. Ubah lewat pengaturan situs browser." };
  try {
    const reg = await registrasi();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: kunciKeBytes(VAPID_PUBLIC) });
    const j = await api("/api/push", { method: "POST", body: { subscription: sub.toJSON(), resi } });
    if (!j.ok) return { ok: false, error: j.error };
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal mengaktifkan notifikasi di perangkat ini." };
  }
}

export async function matikanPush() {
  if (!pushDidukung()) return { ok: true };
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = reg && (await reg.pushManager.getSubscription());
  if (!sub) return { ok: true };
  await api("/api/push", { method: "DELETE", body: { endpoint: sub.endpoint } });
  await sub.unsubscribe();
  return { ok: true };
}
