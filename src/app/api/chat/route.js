import { NextResponse } from "next/server";
import { bacaJson, galat } from "@/lib/api/guard";
import { cocokkanFaq } from "@/lib/faq";
import { ambilKonteks, jawabResi, tanyaGemini, terlaluBanyak } from "@/lib/chatbot";

const RESI = /\bPEX\d{10}\b/i;
const MAKS_PESAN = 500;

/**
 * Chatbot Phely. Urutan jawaban:
 *  1) nomor resi di pesan -> status dari database (tanpa AI),
 *  2) FAQ berbasis aturan + data live (tanpa AI),
 *  3) Gemini (bila GEMINI_API_KEY diisi),
 *  4) arahkan ke admin via WhatsApp.
 * Tombol WhatsApp selalu tersedia di widget; `wa: true` menandai bahwa jawaban ini sebaiknya diteruskan ke admin.
 */
export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (terlaluBanyak(ip)) return galat("Terlalu banyak pesan. Coba lagi beberapa menit lagi, atau hubungi admin via WhatsApp.", 429);

  const b = await bacaJson(request);
  const pesan = String(b.pesan ?? "").trim();
  if (!pesan) return galat("Tulis pertanyaanmu dulu ya.", 422);
  if (pesan.length > MAKS_PESAN) return galat(`Pesan terlalu panjang (maksimal ${MAKS_PESAN} karakter).`, 422);
  const riwayat = (Array.isArray(b.riwayat) ? b.riwayat : [])
    .slice(-6)
    .map((r) => ({ peran: r?.peran === "bot" ? "bot" : "user", teks: String(r?.teks ?? "").slice(0, MAKS_PESAN) }))
    .filter((r) => r.teks);

  try {
    const resi = pesan.match(RESI)?.[0];
    if (resi) {
      const r = await jawabResi(resi.toUpperCase());
      return NextResponse.json({ ok: true, sumber: "resi", jawaban: r.teks, tautan: r.tautan, wa: false });
    }

    const konteks = await ambilKonteks();
    const faq = cocokkanFaq(pesan);
    if (faq) return NextResponse.json({ ok: true, sumber: "faq", jawaban: faq.jawab(konteks), tautan: faq.tautan ?? [], wa: false });

    const ai = await tanyaGemini({ pesan, riwayat, konteks });
    if (ai) {
      const wa = ai.includes("[[WA]]");
      return NextResponse.json({ ok: true, sumber: "ai", jawaban: ai.replaceAll("[[WA]]", "").trim(), tautan: [], wa });
    }
    return NextResponse.json({
      ok: true,
      sumber: "handoff",
      jawaban: "Maaf, aku belum bisa menjawab itu. Untuk pertanyaan yang lebih detail, admin kami siap membantu lewat WhatsApp.",
      tautan: [],
      wa: true,
    });
  } catch (e) {
    console.error("[chat]", e?.message);
    return galat("Chatbot sedang bermasalah. Silakan hubungi admin via WhatsApp.", 500);
  }
}
