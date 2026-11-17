"use client";

import { useEffect, useState } from "react";

async function panggil(body, signal) {
  const res = await fetch("/api/tarif/hitung", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  return res.json();
}

/**
 * Menghitung biaya lewat server (/api/tarif/hitung), sehingga angka yang tampil sama dengan
 * yang dipakai database saat pesanan dibuat. Angka di layar hanya pratinjau.
 * Mengembalikan:
 *  - semua: ongkir dasar semua layanan { reguler: {...}, kilat: {...}, ... } (null saat memuat)
 *  - hasil: untuk layanan terpilih tanpa biaya tambahan (kompatibel dengan kalkulator tarif publik)
 *  - rincian: layanan terpilih + packing + cara serah { ok, error?, ongkir, packing, jemput, diskon, total, ... }
 */
export function useOngkir({ asal, tujuan, berat, layanan, packing = "tidak", metode = "antar_sendiri", jemputLat = null, jemputLng = null, member = false }) {
  const [state, setState] = useState({ key: "", semua: null, rincian: null, galat: "" });
  const key = `${asal}|${tujuan}|${berat}|${layanan}|${packing}|${metode}|${jemputLat}|${jemputLng}|${member}`;

  useEffect(() => {
    if (!asal || !tujuan) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const dasar = { asal, tujuan, berat };
        const [a, b] = await Promise.all([
          panggil({ ...dasar, layanan: "semua", member }, ctrl.signal),
          layanan ? panggil({ ...dasar, layanan, packing, metode, jemputLat, jemputLng, member }, ctrl.signal) : Promise.resolve(null),
        ]);
        setState({
          key,
          semua: a.ok ? a.hasil : null,
          rincian: b ? (b.ok ? b : { ok: false, error: b.error ?? "Gagal menghitung ongkir." }) : null,
          galat: a.ok ? "" : (a.error ?? "Gagal menghitung ongkir."),
        });
      } catch (e) {
        if (e.name !== "AbortError") setState({ key, semua: null, rincian: null, galat: "Tidak dapat menghitung ongkir. Periksa koneksi internetmu." });
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [asal, tujuan, berat, layanan, packing, metode, jemputLat, jemputLng, member, key]);

  const siap = state.key === key;
  const semua = siap ? state.semua : null;
  const hasil = !siap ? { ok: false, loading: true, error: "" } : (semua?.[layanan] ?? { ok: false, error: state.galat || "Layanan tidak tersedia." });
  const rincian = !siap ? { ok: false, loading: true, error: "" } : (state.rincian ?? { ok: false, error: state.galat || "Layanan tidak tersedia." });
  return { hasil, semua, rincian, loading: !siap };
}
