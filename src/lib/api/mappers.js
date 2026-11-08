// Memetakan baris database ke bentuk data yang dipakai UI (sama dengan bentuk data dummy lama).

export function petaOrder(r, events = r.tracking_events ?? []) {
  const timeline = [...events]
    .sort((a, b) => new Date(b.waktu) - new Date(a.waktu) || (b.id ?? 0) - (a.id ?? 0))
    .map((e) => ({ waktu: e.waktu, judul: e.judul, lokasi: e.lokasi ?? "-", deskripsi: e.deskripsi ?? "" }));
  return {
    resi: r.resi,
    ownerId: r.owner_id,
    pengirim: { nama: r.pengirim_nama, hp: r.pengirim_hp, kota: r.pengirim_kota, alamat: r.pengirim_alamat },
    penerima: { nama: r.penerima_nama, hp: r.penerima_hp, kota: r.penerima_kota, alamat: r.penerima_alamat },
    barang: { isi: r.isi, berat: Number(r.berat) },
    catatan: r.catatan ?? undefined,
    layanan: r.layanan_id,
    ongkir: r.ongkir,
    bayar: r.bayar,
    status: r.status,
    kurirId: r.kurir_id,
    dibuat: r.dibuat,
    estimasi: r.estimasi,
    alasanGagal: r.alasan_gagal ?? undefined,
    diterimaOleh: r.diterima_oleh ?? undefined,
    adaBukti: !!r.bukti_path,
    timeline,
  };
}

export function petaKurir(k) {
  return { id: k.id, nama: k.nama, kode: k.kode, kendaraan: k.kendaraan, plat: k.plat, hub: k.hub, hp: k.hp, aktif: k.aktif, userId: k.user_id };
}

export function petaProfil(p) {
  return { id: p.id, role: p.role, nama: p.nama, email: p.email, hp: p.hp ?? "", kota: p.kota_id ?? null, tier: p.tier };
}

/** Pelacakan publik: respons fungsi lacak_resi dipetakan ke bentuk `order` untuk TrackingView. */
export function petaLacak(j) {
  if (!j) return null;
  return {
    resi: j.resi,
    status: j.status,
    layanan: j.layanan_id,
    barang: { berat: Number(j.berat) },
    pengirim: { nama: j.pengirim_samar, kota: j.asal_id },
    penerima: { nama: j.penerima_samar, hp: j.hp_penerima_samar, kota: j.tujuan_id },
    kurir: j.kurir ? { nama: j.kurir.nama, kode: j.kurir.kode } : null,
    dibuat: j.dibuat,
    estimasi: j.estimasi,
    diterimaOleh: j.diterima_oleh ?? undefined,
    alasanGagal: j.alasan_gagal ?? undefined,
    timeline: j.timeline ?? [],
  };
}
