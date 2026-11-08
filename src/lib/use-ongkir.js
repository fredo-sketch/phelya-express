"use client";

import { useEffect, useState } from "react";

/**
 * Menghitung ongkir lewat server (/api/tarif/hitung), sehingga angka yang tampil sama dengan
 * yang dipakai database saat pesanan dibuat. Mengembalikan:
 *  - hasil: bentuk { ok, error?, zona, jarak, tertagih, ongkir, estimasi, loading? } untuk layanan terpilih
 *  - semua: hasil untuk semua layanan { reguler: {...}, kilat: {...}, ... } (null saat memuat)
 */
export function useOngkir({ asal, tujuan, berat, layanan }) {
  const [state, setState] = useState({ key: "", semua: null, galat: "" });
  const key = `${asal}|${tujuan}|${berat}`;

  useEffect(() => {
    if (!asal || !tujuan) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/tarif/hitung", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ asal, tujuan, berat, layanan: "semua" }),
          signal: ctrl.signal,
        });
        const j = await res.json();
        setState({ key, semua: j.ok ? j.hasil : null, galat: j.ok ? "" : (j.error ?? "Gagal menghitung ongkir.") });
      } catch (e) {
        if (e.name !== "AbortError") setState({ key, semua: null, galat: "Tidak dapat menghitung ongkir. Periksa koneksi internetmu." });
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [asal, tujuan, berat, key]);

  const siap = state.key === key;
  const semua = siap ? state.semua : null;
  const hasil = !siap ? { ok: false, loading: true, error: "" } : (semua?.[layanan] ?? { ok: false, error: state.galat || "Layanan tidak tersedia." });
  return { hasil, semua, loading: !siap };
}
