export const KATEGORI_LOWONGAN = ["Semua Posisi", "Kurir & Driver", "Gudang & Hub", "Customer Service", "Teknologi & IT", "Operasional"];

export function petaLowongan(l) {
  return {
    slug: l.slug, judul: l.judul, divisi: l.divisi, kategori: l.kategori, tipe: l.tipe, lokasi: l.lokasi,
    batas: l.batas, gaji: l.gaji ?? "Kompetitif", urgent: l.urgent, deskripsi: l.deskripsi, tanggung: l.tanggung, kualifikasi: l.kualifikasi,
  };
}
