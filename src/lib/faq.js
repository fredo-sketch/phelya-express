import { rupiah } from "@/lib/format";

/**
 * Basis pengetahuan chatbot (lapis 1, tanpa AI): pertanyaan dasar dijawab dari aturan + data live.
 * Murah, cepat, dan tidak bisa mengarang. `ctx` berisi layanan, packing, dan pengaturan dari database.
 */
const daftar = (arr) => arr.map((x) => `- ${x}`).join("\n");

export const FAQ = [
  {
    id: "resi",
    kunci: ["cek resi", "lacak", "tracking", "track", "resi", "posisi paket", "paket saya dimana", "status paket"],
    jawab: () => "Kamu bisa melacak paket di menu Lacak Paket. Masukkan nomor resi (format PEX + 10 angka). Atau ketik nomor resimu langsung di chat ini, nanti aku cek statusnya.",
    tautan: [{ label: "Buka Lacak Paket", href: "/lacak" }],
  },
  {
    id: "tarif",
    kunci: ["cek tarif", "ongkir", "ongkos kirim", "biaya kirim", "tarif", "berapa biaya", "harga kirim"],
    jawab: () => "Ongkir dihitung dari berat (dibulatkan ke atas per kg) × tarif per kg sesuai zona jarak × pengali layanan. Hitung perkiraannya di menu Cek Tarif. Total resmi dihitung server saat pesanan dibuat, jadi tidak bisa diubah-ubah.",
    tautan: [{ label: "Buka Cek Tarif", href: "/cek-tarif" }],
  },
  {
    id: "layanan",
    kunci: ["layanan", "jenis layanan", "reguler", "kilat", "same day", "sameday", "kargo", "pilihan pengiriman"],
    jawab: (c) => `Layanan Phelya Express yang tersedia:\n${daftar(c.layanan.map((l) => `${l.nama}: ${l.deskripsi} (berat minimal ${l.min_berat} kg)`))}`,
    tautan: [{ label: "Lihat Layanan", href: "/layanan" }],
  },
  {
    id: "packing",
    kunci: ["packing", "bubble", "kardus", "kayu", "bungkus", "mudah pecah", "barang pecah", "aman dikirim"],
    jawab: (c) => `Kamu bisa menambah packing agar paket lebih aman. Biayanya otomatis masuk ke total:\n${daftar(c.packing.map((p) => `${p.nama}: ${p.harga ? rupiah(p.harga) : "gratis"}`))}`,
  },
  {
    id: "jemput",
    kunci: ["jemput", "dijemput", "antar sendiri", "diantar sendiri", "drop point", "alamat kantor", "kantor phelya", "kurir ambil", "pickup"],
    jawab: (c) => {
      const p = c.pengaturan;
      return `Ada dua cara paket sampai ke Phelya:\n- Antar sendiri ke ${p.kantor_nama} (${p.kantor_alamat}): gratis.\n- Dijemput kurir (khusus member): paket minimal ${Number(p.jemput_min_berat)} kg, maksimal ${p.jemput_maks_km} km dari kantor. Biaya jemput ${rupiah(p.jemput_biaya_dasar)} + ${rupiah(p.jemput_biaya_per_km)} per km.`;
    },
  },
  {
    id: "bayar",
    kunci: ["bayar", "pembayaran", "qris", "transfer", "virtual account", "e-wallet", "ewallet", "gopay", "cod", "tunai", "midtrans"],
    jawab: () => "Pembayaran bisa lewat Midtrans (QRIS, transfer bank/virtual account, e-wallet) atau tunai langsung di kantor. Setelah dibayar, status pesananmu otomatis berubah menjadi Lunas.",
  },
  {
    id: "kirim",
    kunci: ["cara kirim", "cara buat pesanan", "buat pesanan", "mau kirim paket", "cara pesan", "kirim paket"],
    jawab: () => "Cara kirim paket: 1) Daftar atau masuk ke akunmu. 2) Buka Dashboard lalu Buat Pesanan. 3) Isi data pengirim, penerima, detail barang, lalu pilih layanan, packing, dan cara serah paket. 4) Bayar, lalu simpan nomor resimu. Pelanggan tanpa akun bisa datang langsung ke kantor dan dibantu admin.",
    tautan: [{ label: "Daftar / Masuk", href: "/masuk" }],
  },
  {
    id: "member",
    kunci: ["membership", "member", "daftar akun", "keuntungan", "riwayat pengiriman", "akun"],
    jawab: () => "Pelanggan membership punya akun: bisa dijemput kurir, melihat riwayat pengiriman, dan memantau notifikasi status paket. Pelanggan umum cukup datang ke kantor untuk kirim sekali jalan.",
    tautan: [{ label: "Daftar Akun", href: "/daftar" }],
  },
  {
    id: "batal",
    kunci: ["batal", "membatalkan", "cancel", "salah isi"],
    jawab: () => "Pesanan bisa dibatalkan selama belum diambil kurir (status Menunggu Diantar atau Menunggu Kurir). Buka detail pesanan di dashboard lalu pilih Batalkan Pesanan. Bila sudah diproses, hubungi admin via WhatsApp.",
  },
  {
    id: "estimasi",
    kunci: ["estimasi", "berapa lama", "sampai kapan", "lama pengiriman", "kapan sampai"],
    jawab: () => "Estimasi tergantung layanan dan jarak (zona). Cek di menu Cek Tarif, estimasi muncul bersama ongkirnya. Phelya Kilat dan Same Day paling cepat.",
    tautan: [{ label: "Buka Cek Tarif", href: "/cek-tarif" }],
  },
  {
    id: "karier",
    kunci: ["karier", "lowongan", "kerja di phelya", "melamar", "loker"],
    jawab: () => "Lowongan terbuka ada di halaman Karier. Pilih posisi, isi formulir, dan unggah CV (PDF, maks. 2 MB).",
    tautan: [{ label: "Lihat Karier", href: "/karier" }],
  },
  {
    id: "salam",
    kunci: ["halo", "hai", "hi ", "selamat pagi", "selamat siang", "selamat sore", "selamat malam", "permisi", "assalamualaikum"],
    jawab: () => "Halo! Aku Phely, asisten Phelya Express. Aku bisa bantu soal cek resi, tarif, layanan, packing, jemput atau antar sendiri, dan pembayaran. Mau tanya apa?",
    pendek: true,
  },
];

export const SARAN_AWAL = ["Cara cek resi", "Jenis layanan", "Biaya packing", "Dijemput atau antar sendiri?", "Cara bayar"];

const normal = (t) => ` ${String(t).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim()} `;

/** Cari entri FAQ terbaik. Mengembalikan null bila tidak ada kata kunci yang cocok. */
export function cocokkanFaq(pesan) {
  const t = normal(pesan);
  let terbaik = null;
  let skor = 0;
  for (const e of FAQ) {
    // Sapaan hanya dianggap bila pesan pendek, supaya "halo, bagaimana cara klaim" tidak berhenti di sapaan
    if (e.pendek && t.split(" ").length > 5) continue;
    const s = e.kunci.reduce((n, k) => n + (t.includes(e.pendek ? ` ${k.trim()} ` : k) ? k.split(" ").length : 0), 0);
    if (s > skor) {
      skor = s;
      terbaik = e;
    }
  }
  return terbaik;
}
