// Membuat jalur peta dummy antara dua kota dan posisi paket berdasarkan status.
import { kotaById } from "@/lib/tariff";

const WAYPOINTS = {
  "semarang>jakarta": [
    [-6.9667, 110.4167],
    [-6.9, 110.2],
    [-6.89, 109.67],
    [-6.87, 109.14],
    [-6.71, 108.56],
    [-6.35, 107.3],
    [-6.2088, 106.8456],
  ],
  "jakarta>semarang": null,
  "jakarta>bandung": [
    [-6.2088, 106.8456],
    [-6.3, 107.15],
    [-6.55, 107.45],
    [-6.9175, 107.6191],
  ],
  "bandung>jakarta": null,
  "semarang>surabaya": [
    [-6.9667, 110.4167],
    [-6.95, 111.2],
    [-7.1, 111.9],
    [-7.2575, 112.7521],
  ],
  "jakarta>bogor": [
    [-6.2088, 106.8456],
    [-6.4, 106.82],
    [-6.5971, 106.806],
  ],
  "semarang>yogyakarta": [
    [-6.9667, 110.4167],
    [-7.3, 110.45],
    [-7.7956, 110.3695],
  ],
};

export function jalurPeta(asalId, tujuanId) {
  const key = `${asalId}>${tujuanId}`;
  const rev = `${tujuanId}>${asalId}`;
  if (WAYPOINTS[key]) return WAYPOINTS[key];
  if (WAYPOINTS[rev]) return [...WAYPOINTS[rev]].reverse();
  const a = kotaById(asalId);
  const b = kotaById(tujuanId);
  if (!a || !b) return [];
  const mid = [(a.lat + b.lat) / 2 + 0.15, (a.lng + b.lng) / 2];
  return [
    [a.lat, a.lng],
    mid,
    [b.lat, b.lng],
  ];
}

const PROGRES = {
  menunggu_kurir: 0,
  diambil: 0.06,
  dalam_perjalanan: 0.55,
  sampai: 1,
  gagal: 0.9,
  dibatalkan: 0,
};

export function posisiPaket(jalur, status) {
  if (!jalur.length) return null;
  const p = PROGRES[status] ?? 0;
  if (p <= 0) return jalur[0];
  if (p >= 1) return jalur[jalur.length - 1];
  const idx = p * (jalur.length - 1);
  const i = Math.floor(idx);
  const t = idx - i;
  const a = jalur[i];
  const b = jalur[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
