# Phelya Express

Aplikasi web pengiriman paket (pelanggan, kurir, admin). Tahap saat ini: **frontend dengan data dummy**. Backend (Supabase/PostgreSQL) menyusul.

## Tech stack
- Next.js (App Router) + JavaScript
- Tailwind CSS v4
- ESLint
- Tambahan: `motion` (animasi hero), `lucide-react` (ikon), `leaflet` + `react-leaflet` (peta)

## Menjalankan
```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Akun uji (data simulasi)
| Peran | Email | Kata sandi |
|---|---|---|
| Pelanggan | pelanggan@phelya.id | Phelya123! |
| Kurir | kurir@phelya.id | Phelya123! |
| Admin | admin@phelya.id | Phelya123! |

Resi contoh: `PEX2610310001`, `PEX2610309887`, `PEX2610308333`.

## Struktur
- `src/app/(site)` halaman publik: beranda, layanan, cek tarif, lacak resi, karier, bantuan
- `src/app/(auth)` masuk dan daftar
- `src/app/dashboard` pelanggan, `src/app/kurir`, `src/app/admin`
- `src/components/order-store.js` store order in-memory (simulasi; diganti database nanti)
- `src/lib/status.js` aturan status dan validasi transisi
- `src/lib/tariff.js` perhitungan ongkir per berat, zona, dan layanan
- `src/data/mock.js` data dummy
- `public/mascot`, `public/brand` aset maskot dan logo

## Belum dikerjakan (tahap backend)
- Auth sungguhan dan proteksi role di server (saat ini halaman dashboard belum diproteksi)
- Database, RLS, Storage privat untuk foto
- Web Push lewat antrean dan worker
- Pembuatan label resi PDF dengan QR
- Validasi ulang semua input di server
