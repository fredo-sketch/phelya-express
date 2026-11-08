import { randomUUID } from "node:crypto";
import { wajibMasuk, galat, sukses, dariDb } from "@/lib/api/guard";

const MAKS = 2 * 1024 * 1024;

// Tipe berkas ditentukan dari isi berkas (magic bytes), bukan dari nama atau Content-Type kiriman klien.
function deteksiGambar(b) {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

/** Kurir mengunggah foto bukti serah terima. Policy Storage memastikan hanya kurir pesanan ini dan hanya saat dalam perjalanan. */
export async function POST(request, { params }) {
  const g = await wajibMasuk("kurir");
  if (g.respon) return g.respon;
  const { resi } = await params;

  let form;
  try {
    form = await request.formData();
  } catch {
    return galat("Permintaan tidak valid.", 400);
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return galat("Unggah foto bukti terlebih dahulu.", 422);
  if (file.size > MAKS) return galat("Ukuran foto maksimal 2 MB.", 422);
  const buf = Buffer.from(await file.arrayBuffer());
  const tipe = deteksiGambar(buf);
  if (!tipe) return galat("Format foto harus JPG, PNG, atau WebP.", 422);

  const path = `${resi.toUpperCase()}/${randomUUID()}.${tipe.ext}`;
  const { error } = await g.supabase.storage.from("bukti").upload(path, buf, { contentType: tipe.mime, upsert: false });
  if (error) {
    const pesan = /row-level security|policy|not authorized|403/i.test(error.message)
      ? "Foto hanya bisa diunggah oleh kurir pesanan ini saat status Dalam Perjalanan."
      : "Gagal mengunggah foto.";
    return galat(pesan, 403);
  }
  return sukses({ path }, 201);
}

/** Tautan sementara (60 detik) untuk melihat foto bukti. Hanya yang berhak melihat pesanan yang bisa. */
export async function GET(_request, { params }) {
  const g = await wajibMasuk();
  if (g.respon) return g.respon;
  const { resi } = await params;
  const { data, error } = await g.supabase.from("orders").select("bukti_path").eq("resi", resi.toUpperCase()).maybeSingle();
  if (error) return dariDb(error);
  if (!data?.bukti_path) return galat("Bukti belum tersedia.", 404);
  const { data: url, error: e2 } = await g.supabase.storage.from("bukti").createSignedUrl(data.bukti_path, 60);
  if (e2) return galat("Gagal membuat tautan bukti.", 500);
  return sukses({ url: url.signedUrl });
}
