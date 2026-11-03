"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ORDER } from "@/data/mock";
import { STATUS, bolehTransisi, bisaDibatalkan } from "@/lib/status";

/**
 * Store order in-memory untuk simulasi frontend.
 * Semua aturan (validasi transisi, batal hanya di status awal) sengaja memakai fungsi dari lib/status
 * supaya logika yang sama bisa dipindah ke server nanti. Di versi final, validasi WAJIB di server.
 */
const Ctx = createContext(null);

const sekarang = () => new Date().toISOString();

export function OrderStoreProvider({ children }) {
  const [orders, setOrders] = useState(ORDER);
  const [tarif, setTarif] = useState(null);

  const ubah = useCallback((resi, fn) => setOrders((p) => p.map((o) => (o.resi === resi ? fn(o) : o))), []);

  const ubahStatus = useCallback(
    (resi, ke, { lokasi = "Lokasi kurir", deskripsi, alasan } = {}) => {
      let hasil = { ok: false, error: "Order tidak ditemukan." };
      setOrders((p) =>
        p.map((o) => {
          if (o.resi !== resi) return o;
          if (!bolehTransisi(o.status, ke)) {
            hasil = { ok: false, error: `Transisi ${STATUS[o.status].label} → ${STATUS[ke].label} tidak diizinkan.` };
            return o;
          }
          hasil = { ok: true };
          return {
            ...o,
            status: ke,
            alasanGagal: ke === "gagal" ? alasan : undefined,
            diterimaOleh: ke === "sampai" ? "Yang Bersangkutan" : o.diterimaOleh,
            timeline: [{ waktu: sekarang(), judul: STATUS[ke].label, lokasi, deskripsi: deskripsi ?? alasan ?? "Status diperbarui oleh kurir." }, ...o.timeline],
          };
        }),
      );
      return hasil;
    },
    [],
  );

  const batalkan = useCallback(
    (resi) => {
      const o = orders.find((x) => x.resi === resi);
      if (!o) return { ok: false, error: "Order tidak ditemukan." };
      if (!bisaDibatalkan(o.status)) return { ok: false, error: "Pesanan sudah diproses dan tidak bisa dibatalkan." };
      ubah(resi, (x) => ({
        ...x,
        status: "dibatalkan",
        timeline: [{ waktu: sekarang(), judul: "Pesanan dibatalkan", lokasi: "-", deskripsi: "Dibatalkan oleh pengirim sebelum diambil kurir." }, ...x.timeline],
      }));
      return { ok: true };
    },
    [orders, ubah],
  );

  const assignKurir = useCallback(
    (resi, kurirId) => {
      ubah(resi, (o) => ({
        ...o,
        kurirId,
        timeline: [{ waktu: sekarang(), judul: "Kurir ditugaskan", lokasi: "Hub", deskripsi: "Admin menugaskan kurir untuk penjemputan." }, ...o.timeline],
      }));
    },
    [ubah],
  );

  const konfirmasiBayar = useCallback((resi) => ubah(resi, (o) => ({ ...o, bayar: "lunas" })), [ubah]);

  const tambahOrder = useCallback((order) => setOrders((p) => [order, ...p]), []);

  const value = useMemo(
    () => ({ orders, tarif, setTarif, ubahStatus, batalkan, assignKurir, konfirmasiBayar, tambahOrder }),
    [orders, tarif, ubahStatus, batalkan, assignKurir, konfirmasiBayar, tambahOrder],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrders() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOrders harus dipakai di dalam OrderStoreProvider");
  return v;
}
