// Tarif & zona (data dummy untuk frontend).
// Nantinya dipindah ke tabel database dan dikelola admin.

export const KOTA = [
  { id: "semarang", nama: "Semarang", lat: -6.9667, lng: 110.4167 },
  { id: "jakarta", nama: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { id: "bandung", nama: "Bandung", lat: -6.9175, lng: 107.6191 },
  { id: "surabaya", nama: "Surabaya", lat: -7.2575, lng: 112.7521 },
  { id: "yogyakarta", nama: "Yogyakarta", lat: -7.7956, lng: 110.3695 },
  { id: "solo", nama: "Surakarta", lat: -7.5755, lng: 110.8243 },
  { id: "cirebon", nama: "Cirebon", lat: -6.7063, lng: 108.557 },
  { id: "tegal", nama: "Tegal", lat: -6.8694, lng: 109.1402 },
  { id: "malang", nama: "Malang", lat: -7.9666, lng: 112.6326 },
  { id: "bogor", nama: "Bogor", lat: -6.5971, lng: 106.806 },
  { id: "denpasar", nama: "Denpasar", lat: -8.6705, lng: 115.2126 },
];

export const kotaById = (id) => KOTA.find((k) => k.id === id);

export const ZONA = [
  { id: 1, nama: "Zona 1 · Dalam Kota", maxKm: 40, perKg: 8000 },
  { id: 2, nama: "Zona 2 · Antar Kota Dekat", maxKm: 250, perKg: 11000 },
  { id: 3, nama: "Zona 3 · Antar Provinsi", maxKm: 700, perKg: 15000 },
  { id: 4, nama: "Zona 4 · Jarak Jauh", maxKm: Infinity, perKg: 21000 },
];

export const LAYANAN = {
  reguler: {
    id: "reguler",
    nama: "Phelya Reguler",
    singkat: "Hemat",
    deskripsi: "Pilihan paling hemat untuk kiriman harian tanpa terburu-buru.",
    pengali: 1,
    minBerat: 1,
    estimasi: { 1: "1 hari", 2: "2 hari", 3: "3 hari", 4: "4 – 6 hari" },
  },
  kilat: {
    id: "kilat",
    nama: "Phelya Kilat",
    singkat: "Besok Sampai",
    deskripsi: "Garansi sampai esok hari untuk kota-kota utama. Prioritas di hub.",
    pengali: 1.6,
    minBerat: 1,
    estimasi: { 1: "Hari ini", 2: "1 hari", 3: "1 – 2 hari", 4: "2 – 3 hari" },
  },
  same_day: {
    id: "same_day",
    nama: "Phelya Same Day",
    singkat: "Dalam Kota",
    deskripsi: "Dijemput dan diantar di hari yang sama, khusus dalam kota atau kota dekat.",
    pengali: 2.4,
    minBerat: 1,
    maxZona: 2,
    estimasi: { 1: "6 – 8 jam", 2: "Hari ini" },
  },
  kargo: {
    id: "kargo",
    nama: "Phelya Kargo",
    singkat: "> 10 kg",
    deskripsi: "Muatan besar dan berat, mulai 10 kg, via truk khusus.",
    pengali: 0.7,
    minBerat: 10,
    estimasi: { 1: "1 – 2 hari", 2: "2 – 3 hari", 3: "3 – 5 hari", 4: "5 – 8 hari" },
  },
};

function haversine(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function jarakKm(asalId, tujuanId) {
  const a = kotaById(asalId);
  const b = kotaById(tujuanId);
  if (!a || !b) return 0;
  return Math.round(haversine(a, b));
}

export function zonaUntuk(km) {
  return ZONA.find((z) => km <= z.maxKm) ?? ZONA[ZONA.length - 1];
}

/**
 * Hitung ongkir. Mengembalikan { ok, error?, zona, jarak, ongkir, estimasi }.
 * Rumus: berat tertagih (dibulatkan ke atas) x tarif/kg zona x pengali layanan.
 */
export function hitungOngkir({ asal, tujuan, berat, layanan }) {
  const svc = LAYANAN[layanan];
  if (!svc) return { ok: false, error: "Pilih layanan terlebih dahulu." };
  if (!asal || !tujuan) return { ok: false, error: "Pilih kota asal dan kota tujuan." };
  const kg = Number(berat);
  if (!Number.isFinite(kg) || kg <= 0) return { ok: false, error: "Berat harus lebih dari 0 kg." };
  if (kg > 100) return { ok: false, error: "Berat maksimal 100 kg per paket." };
  if (kg < svc.minBerat)
    return { ok: false, error: `${svc.nama} minimal ${svc.minBerat} kg.` };

  const jarak = jarakKm(asal, tujuan);
  const zona = zonaUntuk(jarak);
  if (svc.maxZona && zona.id > svc.maxZona)
    return { ok: false, error: `${svc.nama} hanya tersedia untuk Zona 1 dan 2.` };

  const tertagih = Math.ceil(kg);
  const ongkir = Math.round((tertagih * zona.perKg * svc.pengali) / 500) * 500;
  return {
    ok: true,
    zona,
    jarak,
    tertagih,
    ongkir,
    estimasi: svc.estimasi[zona.id] ?? "-",
  };
}
