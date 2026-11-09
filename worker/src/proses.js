/**
 * Inti worker: ambil job dari antrean, kirim, lalu laporkan hasilnya.
 * Dipisah dari index.js supaya bisa diuji tanpa jaringan.
 *
 * Aturan hasil pengiriman:
 *  - sukses                      -> complete_notification_job
 *  - 404 / 410 (langganan mati)  -> fail permanen, langganan dinonaktifkan
 *  - lainnya (429, 5xx, jaringan) -> fail sementara, dicoba lagi dengan backoff eksponensial di database
 */
export async function prosesBatch({ supabase, kirim, batas = 20, log = console }) {
  const { data: jobs, error } = await supabase.rpc("claim_notification_jobs", { p_limit: batas });
  if (error) throw new Error(`claim_notification_jobs gagal: ${error.message}`);
  const hasil = { diambil: jobs.length, terkirim: 0, gagal: 0, mati: 0 };

  await Promise.all(
    jobs.map(async (j) => {
      const sub = { endpoint: j.endpoint, keys: { p256dh: j.p256dh, auth: j.auth } };
      try {
        await kirim(sub, JSON.stringify(j.payload));
        const r = await supabase.rpc("complete_notification_job", { p_job: j.job_id });
        if (r.error) throw new Error(r.error.message);
        hasil.terkirim++;
      } catch (e) {
        const permanen = e?.statusCode === 404 || e?.statusCode === 410;
        const pesan = `${e?.statusCode ?? "ERR"}: ${e?.body || e?.message || "gagal"}`.slice(0, 400);
        const r = await supabase.rpc("fail_notification_job", { p_job: j.job_id, p_error: pesan, p_permanent: permanen });
        if (r.error) log.error(`[worker] fail_notification_job ${j.job_id} gagal: ${r.error.message}`);
        permanen ? hasil.mati++ : hasil.gagal++;
        log.warn(`[worker] job ${j.job_id} ${permanen ? "mati" : "akan dicoba lagi"} (${pesan})`);
      }
    }),
  );
  return hasil;
}
