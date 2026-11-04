// Konfigurasi status pengiriman + validasi transisi.
// Dipisah dari UI supaya nanti bisa dipakai ulang juga oleh backend (route handler / Supabase function).

export const STATUS = {
  menunggu_kurir: { label: "Menunggu Kurir", tone: "neutral", step: 0 },
  diambil: { label: "Diambil Kurir", tone: "amber", step: 1 },
  dalam_perjalanan: { label: "Dalam Perjalanan", tone: "orange", step: 2 },
  sampai: { label: "Sampai Tujuan", tone: "teal", step: 3 },
  gagal: { label: "Gagal Kirim", tone: "red", step: 3 },
  dibatalkan: { label: "Dibatalkan", tone: "red", step: 0 },
};

// Transisi yang diizinkan. Kurir hanya boleh maju satu langkah.
export const TRANSISI = {
  menunggu_kurir: ["diambil", "dibatalkan"],
  diambil: ["dalam_perjalanan", "gagal"],
  dalam_perjalanan: ["sampai", "gagal"],
  sampai: [],
  gagal: ["dalam_perjalanan"],
  dibatalkan: [],
};

export function bolehTransisi(dari, ke) {
  return (TRANSISI[dari] ?? []).includes(ke);
}

// Pembatalan hanya selama status masih awal.
export function bisaDibatalkan(status) {
  return status === "menunggu_kurir";
}

export const NEXT_ACTION = {
  menunggu_kurir: null,
  diambil: { ke: "dalam_perjalanan", label: "Mulai Antar" },
  dalam_perjalanan: { ke: "sampai", label: "Konfirmasi Sampai & Serah Terima" },
  gagal: { ke: "dalam_perjalanan", label: "Coba Antar Lagi" },
  sampai: null,
  dibatalkan: null,
};

export const BAYAR = {
  lunas: { label: "Lunas", tone: "teal" },
  menunggu: { label: "Menunggu Pembayaran", tone: "amber" },
  cod: { label: "COD (Bayar di Tempat)", tone: "orange" },
};

export const TONE_CLASS = {
  neutral: "bg-soft text-muted",
  amber: "bg-accent-soft text-accent-deep",
  orange: "bg-accent text-white",
  teal: "bg-primary text-white",
  red: "bg-danger-soft text-danger",
  info: "bg-primary-soft text-primary-strong",
};
