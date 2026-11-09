import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

// Ukuran label termal 100 x 150 mm (A6 potret) dalam poin PDF
const MM = 72 / 25.4;
const W = 100 * MM;
const H = 150 * MM;
const M = 10 * MM;

/** Font standar PDF hanya mendukung Latin-1, jadi karakter lain diganti agar tidak melempar error. */
const aman = (s) =>
  String(s ?? "")
    .replace(/[→⟶]/g, "->")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E -ÿ]/g, "?");

function bungkus(teks, font, ukuran, lebar, maksBaris) {
  const kata = aman(teks).split(/\s+/).filter(Boolean);
  const baris = [];
  let cur = "";
  for (const k of kata) {
    const coba = cur ? `${cur} ${k}` : k;
    if (font.widthOfTextAtSize(coba, ukuran) <= lebar) cur = coba;
    else {
      if (cur) baris.push(cur);
      cur = k;
    }
  }
  if (cur) baris.push(cur);
  if (baris.length > maksBaris) {
    baris.length = maksBaris;
    baris[maksBaris - 1] = baris[maksBaris - 1].replace(/.{0,2}$/, "...");
  }
  return baris;
}

const rupiah = (n) => "Rp " + new Intl.NumberFormat("id-ID").format(n);

/**
 * Membuat label resi PDF (100 x 150 mm) berisi QR ke halaman pelacakan publik.
 * `o` = baris orders; `asal`/`tujuan` = nama kota; `layanan` = nama layanan; `urlLacak` = tautan penuh.
 */
export async function buatLabelPdf({ o, asal, tujuan, layanan, urlLacak }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Label ${o.resi}`);
  pdf.setProducer("Phelya Express");
  const page = pdf.addPage([W, H]);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.CourierBold);
  const hitam = rgb(0.08, 0.06, 0.05);
  const abu = rgb(0.4, 0.38, 0.36);
  const oranye = rgb(0.93, 0.47, 0.13);

  const teks = (t, x, y, { f = reg, s = 9, c = hitam } = {}) => page.drawText(aman(t), { x, y, size: s, font: f, color: c });
  const garis = (y, tebal = 1) => page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: tebal, color: hitam });

  // Header
  page.drawRectangle({ x: 0, y: H - 14 * MM, width: W, height: 14 * MM, color: hitam });
  teks("PHELYA EXPRESS", M, H - 9 * MM, { f: bold, s: 13, c: rgb(1, 1, 1) });
  const svc = aman(layanan).toUpperCase();
  teks(svc, W - M - bold.widthOfTextAtSize(svc, 9), H - 9 * MM, { f: bold, s: 9, c: rgb(1, 0.78, 0.5) });

  // Resi + QR
  const qrUkuran = 34 * MM;
  const qrX = W - M - qrUkuran;
  const qrY = H - 14 * MM - 4 * MM - qrUkuran;
  const qr = QRCode.create(urlLacak, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const sel = qrUkuran / (n + 4); // zona tenang 2 modul di tiap sisi
  page.drawRectangle({ x: qrX, y: qrY, width: qrUkuran, height: qrUkuran, color: rgb(1, 1, 1) });
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (qr.modules.get(r, c)) page.drawRectangle({ x: qrX + (c + 2) * sel, y: qrY + qrUkuran - (r + 3) * sel, width: sel + 0.2, height: sel + 0.2, color: hitam });
  teks("Pindai untuk melacak", qrX, qrY - 8, { s: 6.5, c: abu });

  const kiriLebar = qrX - M - 3 * MM;
  teks("NOMOR RESI", M, H - 22 * MM, { f: bold, s: 7, c: abu });
  const ukResi = mono.widthOfTextAtSize(aman(o.resi), 15) > kiriLebar ? 12.5 : 15;
  teks(o.resi, M, H - 29 * MM, { f: mono, s: ukResi });
  teks("RUTE", M, H - 38 * MM, { f: bold, s: 7, c: abu });
  bungkus(`${asal} -> ${tujuan}`.toUpperCase(), bold, 11, kiriLebar, 2).forEach((b, i) => teks(b, M, H - 45 * MM - i * 13, { f: bold, s: 11 }));
  teks(`${Number(o.berat)} kg  |  ${aman(o.jarak_km)} km`, M, H - 58 * MM, { f: bold, s: 9 });
  teks(new Date(o.dibuat).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }), M, H - 63 * MM, { s: 8, c: abu });

  // Penerima (utama) dan pengirim
  let y = H - 68 * MM; // di bawah kolom resi/rute/berat dan QR
  garis(y, 1.5);
  const lebarTeks = W - 2 * M;
  const blok = (judul, nama, hp, kota, alamat, besar) => {
    y -= 11;
    teks(judul, M, y, { f: bold, s: 7, c: abu });
    y -= besar ? 13 : 11;
    teks(nama, M, y, { f: bold, s: besar ? 13 : 10 });
    y -= 10;
    teks(hp, M, y, { s: 9 });
    bungkus(`${alamat}, ${kota}`, reg, besar ? 9.5 : 8.5, lebarTeks, besar ? 4 : 3).forEach((b) => {
      y -= besar ? 11.5 : 10;
      teks(b, M, y, { s: besar ? 9.5 : 8.5 });
    });
    y -= 6;
  };
  blok("PENERIMA", o.penerima_nama, o.penerima_hp, tujuan, o.penerima_alamat, true);
  garis(y, 0.5);
  blok("PENGIRIM", o.pengirim_nama, o.pengirim_hp, asal, o.pengirim_alamat, false);

  // Isi, catatan, pembayaran
  garis(y, 0.5);
  y -= 11;
  teks("ISI PAKET", M, y, { f: bold, s: 7, c: abu });
  bungkus(o.isi, reg, 8.5, lebarTeks, 2).forEach((b) => {
    y -= 10;
    teks(b, M, y, { s: 8.5 });
  });
  if (o.catatan) {
    y -= 4;
    bungkus(`Catatan: ${o.catatan}`, bold, 8, lebarTeks, 2).forEach((b) => {
      y -= 10;
      teks(b, M, y, { f: bold, s: 8 });
    });
  }

  // Footer pembayaran
  const cod = o.bayar === "cod";
  const fy = 8 * MM;
  page.drawRectangle({ x: M, y: fy, width: W - 2 * M, height: 11 * MM, color: cod ? oranye : rgb(0.93, 0.92, 0.9) });
  const label = cod ? `COD - TAGIH ${rupiah(o.ongkir)}` : o.bayar === "lunas" ? `LUNAS - ${rupiah(o.ongkir)}` : `ONGKIR ${rupiah(o.ongkir)} (${o.bayar})`;
  const ukL = bold.widthOfTextAtSize(aman(label), 10);
  teks(label, (W - ukL) / 2, fy + 4.2 * MM, { f: bold, s: 10, c: cod ? rgb(1, 1, 1) : hitam });
  return pdf.save();
}
