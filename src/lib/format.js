const TZ = "Asia/Jakarta";

export function rupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function angka(n) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export function tanggal(iso) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function tanggalJam(iso) {
  const d = new Date(iso);
  const t = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(d);
  const j = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  })
    .format(d)
    .replace(".", ":");
  return `${t}, ${j} WIB`;
}

export function jam(iso) {
  return (
    new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TZ,
    })
      .format(new Date(iso))
      .replace(".", ":") + " WIB"
  );
}

// Samarkan nomor telepon / nama untuk halaman publik.
export function samarkanHp(hp) {
  if (!hp || hp.length < 8) return hp;
  return hp.slice(0, 4) + "••••" + hp.slice(-3);
}

export function samarkanNama(nama) {
  return nama
    .split(" ")
    .map((k, i) => (i === 0 ? k : k[0] + "•".repeat(Math.max(k.length - 1, 1))))
    .join(" ");
}

export function inisial(nama) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((k) => k[0])
    .join("")
    .toUpperCase();
}

export function cn(...c) {
  return c.filter(Boolean).join(" ");
}
