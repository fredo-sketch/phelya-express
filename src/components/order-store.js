"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/button";
import Mascot from "@/components/ui/mascot";

/**
 * Store data dashboard. Sumber datanya adalah Route Handlers (/api/*), yang memakai sesi pengguna
 * sehingga RLS di database ikut membatasi data yang terlihat. Semua aksi (ubah status, batalkan,
 * tugaskan kurir, dst.) divalidasi ulang di server dan database; store ini hanya memuat ulang hasilnya.
 */
const Ctx = createContext(null);
const AREA = /^\/(dashboard|kurir|admin)(\/|$)/;

/** Pemanggil API: selalu mengembalikan { ok, error?, ...data } dan tidak melempar error. */
export async function api(url, { method = "GET", body, form } = {}) {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: form ?? (body ? JSON.stringify(body) : undefined),
      cache: "no-store",
    });
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 && typeof window !== "undefined" && AREA.test(window.location.pathname)) {
      // Muat ulang penuh (bukan router.push) agar cookie sesi & state klien bersih
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/masuk?next=${encodeURIComponent(window.location.pathname)}`);
    }
    if (!res.ok || j.ok === false) return { ok: false, status: res.status, error: j.error ?? "Terjadi kesalahan. Coba lagi." };
    return j;
  } catch {
    return { ok: false, status: 0, error: "Tidak dapat terhubung ke server. Periksa koneksi internetmu." };
  }
}

/**
 * usePathname() adalah data runtime, jadi dibaca di dalam <Suspense> agar halaman tetap bisa
 * di-prerender. Fallback memakai provider yang sama (tanpa pathname) sehingga konteks selalu tersedia.
 */
export function OrderStoreProvider({ children }) {
  return (
    <Suspense fallback={<Store pathname="">{children}</Store>}>
      <DenganPath>{children}</DenganPath>
    </Suspense>
  );
}

function DenganPath({ children }) {
  return <Store pathname={usePathname()}>{children}</Store>;
}

function Store({ pathname, children }) {
  const dalamArea = AREA.test(pathname);
  const [state, setState] = useState({ status: "idle", me: null, kurirSaya: null, kurir: [], orders: [], error: "" });
  const sedangMuat = useRef(false);

  const ambil = useCallback(async ({ senyap = false } = {}) => {
    if (sedangMuat.current) return;
    sedangMuat.current = true;
    const j = await api("/api/bootstrap");
    sedangMuat.current = false;
    if (!j.ok) {
      setState((s) => (senyap && s.status === "ready" ? s : { ...s, status: "error", error: j.error }));
      return;
    }
    setState({ status: "ready", me: j.me, kurirSaya: j.kurirSaya, kurir: j.kurir, orders: j.orders, error: "" });
  }, []);

  /** Muat ulang dengan tampilan "memuat" (mis. tombol Coba lagi). */
  const muat = useCallback(
    async ({ senyap = false } = {}) => {
      if (!senyap) setState((s) => ({ ...s, status: "loading", error: "" }));
      await ambil({ senyap });
    },
    [ambil],
  );

  // Muat pertama: status "idle" sudah ditampilkan sebagai memuat, jadi cukup ambil data.
  useEffect(() => {
    // setState di dalam ambil() terjadi setelah await (bukan sinkron), jadi aman dari render berantai.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (dalamArea && state.status === "idle") ambil();
  }, [dalamArea, state.status, ambil]);

  /** Jalankan aksi tulis lalu muat ulang data dari server. */
  const aksi = useCallback(
    async (promise) => {
      const j = await promise;
      if (j.ok) await muat({ senyap: true });
      return j;
    },
    [muat],
  );

  const ubahStatus = useCallback(
    (resi, ke, { lokasi, deskripsi, alasan, buktiPath } = {}) =>
      aksi(api(`/api/orders/${encodeURIComponent(resi)}/status`, { method: "POST", body: { ke, lokasi, deskripsi, alasan, buktiPath } })),
    [aksi],
  );
  const batalkan = useCallback((resi) => ubahStatus(resi, "dibatalkan", { lokasi: "-", deskripsi: "Dibatalkan oleh pengirim sebelum diambil kurir." }), [ubahStatus]);
  const assignKurir = useCallback((resi, kurirId) => aksi(api(`/api/orders/${encodeURIComponent(resi)}/kurir`, { method: "POST", body: { kurirId } })), [aksi]);
  const konfirmasiBayar = useCallback((resi) => aksi(api(`/api/orders/${encodeURIComponent(resi)}/bayar`, { method: "POST" })), [aksi]);
  const tambahOrder = useCallback((data) => aksi(api("/api/orders", { method: "POST", body: data })), [aksi]);
  const uploadBukti = useCallback((resi, file) => {
    const form = new FormData();
    form.append("file", file);
    return api(`/api/orders/${encodeURIComponent(resi)}/bukti`, { method: "POST", form });
  }, []);
  const ubahProfil = useCallback((data) => aksi(api("/api/me", { method: "PATCH", body: data })), [aksi]);

  const value = useMemo(() => {
    const kurirById = new Map(state.kurir.map((k) => [k.id, k]));
    return {
      ready: state.status === "ready",
      loading: state.status === "idle" || state.status === "loading",
      error: state.error,
      me: state.me,
      kurirSaya: state.kurirSaya,
      kurir: state.kurir,
      orders: state.orders,
      getKurir: (id) => (id ? (kurirById.get(id) ?? null) : null),
      muat,
      ubahStatus,
      batalkan,
      assignKurir,
      konfirmasiBayar,
      tambahOrder,
      uploadBukti,
      ubahProfil,
    };
  }, [state, muat, ubahStatus, batalkan, assignKurir, konfirmasiBayar, tambahOrder, uploadBukti, ubahProfil]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrders() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOrders harus dipakai di dalam OrderStoreProvider");
  return v;
}

/** Menahan tampilan halaman sampai data siap, dengan keadaan memuat dan galat (bisa dicoba lagi). */
export function DataGate({ children }) {
  const { loading, error, ready, muat } = useOrders();
  if (ready) return children;
  if (loading)
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center" role="status" aria-live="polite">
        <Mascot pose="terbang" height={110} float />
        <p className="mt-3 text-lg font-extrabold">Memuat datamu...</p>
      </div>
    );
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center" role="alert">
      <Mascot pose="santai" height={110} />
      <p className="mt-3 text-lg font-extrabold">Data belum bisa dimuat</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{error || "Terjadi kesalahan."}</p>
      <Button className="mt-4" onClick={() => muat()}>
        Coba lagi
      </Button>
    </div>
  );
}
