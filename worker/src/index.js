import http from "node:http";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { prosesBatch } from "./proses.js";

const wajib = (k) => {
  const v = process.env[k];
  if (!v) {
    console.error(`[worker] Variabel ${k} belum diisi.`);
    process.exit(1);
  }
  return v;
};

const SUPABASE_URL = wajib("SUPABASE_URL");
const SERVICE_KEY = wajib("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC = wajib("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE = wajib("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@phelya.id";
const INTERVAL = Math.max(1000, Number(process.env.POLL_INTERVAL_MS) || 5000);
const BATCH = Math.min(100, Math.max(1, Number(process.env.BATCH_SIZE) || 20));

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const kirim = (sub, payload) => webpush.sendNotification(sub, payload, { TTL: 60 * 60 * 24, urgency: "high", timeout: 10_000 });

let berhenti = false;
let terakhirOk = Date.now();
let totalTerkirim = 0;

// Endpoint kesehatan opsional (PORT diisi otomatis oleh Render/Railway untuk layanan web)
if (process.env.PORT) {
  http
    .createServer((req, res) => {
      const sehat = Date.now() - terakhirOk < INTERVAL * 12 + 30_000;
      res.writeHead(sehat ? 200 : 503, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: sehat, terkirim: totalTerkirim, terakhirOk: new Date(terakhirOk).toISOString() }));
    })
    .listen(Number(process.env.PORT), () => console.log(`[worker] health check di :${process.env.PORT}`));
}

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
for (const sinyal of ["SIGINT", "SIGTERM"]) process.on(sinyal, () => ((berhenti = true), console.log(`[worker] ${sinyal}, berhenti setelah batch ini selesai...`)));

console.log(`[worker] mulai. interval ${INTERVAL}ms, batch ${BATCH}`);
let jedaGalat = INTERVAL;
while (!berhenti) {
  try {
    let h;
    do {
      h = await prosesBatch({ supabase, kirim, batas: BATCH });
      totalTerkirim += h.terkirim;
      if (h.diambil) console.log(`[worker] diambil ${h.diambil}, terkirim ${h.terkirim}, gagal ${h.gagal}, mati ${h.mati}`);
    } while (h.diambil === BATCH && !berhenti); // antrean masih penuh: lanjut tanpa jeda
    terakhirOk = Date.now();
    jedaGalat = INTERVAL;
  } catch (e) {
    console.error(`[worker] ${e.message}`);
    jedaGalat = Math.min(jedaGalat * 2, 60_000); // backoff saat database tidak terjangkau
  }
  if (!berhenti) await tidur(jedaGalat);
}
console.log("[worker] berhenti.");
