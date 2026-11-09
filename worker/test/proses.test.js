import { test } from "node:test";
import assert from "node:assert/strict";
import { prosesBatch } from "../src/proses.js";

function fakeSupabase(jobs) {
  const panggilan = [];
  return {
    panggilan,
    rpc: async (nama, args) => {
      panggilan.push([nama, args]);
      if (nama === "claim_notification_jobs") return { data: jobs, error: null };
      return { data: null, error: null };
    },
  };
}
const job = (id, extra = {}) => ({ job_id: id, endpoint: `https://x/${id}`, p256dh: "p", auth: "a", payload: { title: "t" }, attempts: 1, ...extra });
const senyap = { warn() {}, error() {}, log() {} };

test("sukses -> complete_notification_job", async () => {
  const sb = fakeSupabase([job(1)]);
  const h = await prosesBatch({ supabase: sb, kirim: async () => {}, log: senyap });
  assert.deepEqual(h, { diambil: 1, terkirim: 1, gagal: 0, mati: 0 });
  assert.deepEqual(sb.panggilan.at(-1), ["complete_notification_job", { p_job: 1 }]);
});

test("410 -> gagal permanen (langganan mati)", async () => {
  const sb = fakeSupabase([job(2)]);
  const h = await prosesBatch({ supabase: sb, kirim: async () => { throw Object.assign(new Error("gone"), { statusCode: 410 }); }, log: senyap });
  assert.equal(h.mati, 1);
  const [nama, args] = sb.panggilan.at(-1);
  assert.equal(nama, "fail_notification_job");
  assert.equal(args.p_permanent, true);
});

test("5xx dan galat jaringan -> gagal sementara (dicoba lagi)", async () => {
  const sb = fakeSupabase([job(3), job(4)]);
  const kirim = async (s) => { throw s.endpoint.endsWith("/3") ? Object.assign(new Error("x"), { statusCode: 503 }) : new Error("ECONNRESET"); };
  const h = await prosesBatch({ supabase: sb, kirim, log: senyap });
  assert.equal(h.gagal, 2);
  assert.ok(sb.panggilan.filter(([n]) => n === "fail_notification_job").every(([, a]) => a.p_permanent === false));
});

test("satu job gagal tidak menghentikan job lain", async () => {
  const sb = fakeSupabase([job(5), job(6)]);
  const h = await prosesBatch({ supabase: sb, kirim: async (s) => { if (s.endpoint.endsWith("/5")) throw new Error("x"); }, log: senyap });
  assert.deepEqual([h.terkirim, h.gagal], [1, 1]);
});

test("antrean kosong", async () => {
  const h = await prosesBatch({ supabase: fakeSupabase([]), kirim: async () => {}, log: senyap });
  assert.equal(h.diambil, 0);
});

test("galat claim dilempar agar worker melakukan backoff", async () => {
  const sb = { rpc: async () => ({ data: null, error: { message: "down" } }) };
  await assert.rejects(prosesBatch({ supabase: sb, kirim: async () => {}, log: senyap }), /down/);
});
