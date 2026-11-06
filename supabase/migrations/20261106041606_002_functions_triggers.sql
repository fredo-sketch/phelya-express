-- ===== Helper role =====
create or replace function public.auth_role() returns text
language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role = 'admin' from public.profiles p where p.id = (select auth.uid())), false)
$$;

create or replace function public.my_kurir_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select k.id from public.kurir k where k.user_id = (select auth.uid())
$$;

-- ===== Aturan status (cermin src/lib/status.js) =====
create or replace function public.status_boleh(dari text, ke text) returns boolean
language sql immutable set search_path = '' as $$
  select case dari
    when 'menunggu_kurir' then ke in ('diambil','dibatalkan')
    when 'diambil' then ke in ('dalam_perjalanan','gagal')
    when 'dalam_perjalanan' then ke in ('sampai','gagal')
    when 'gagal' then ke = 'dalam_perjalanan'
    else false end
$$;

create or replace function public.label_status(s text) returns text
language sql immutable set search_path = '' as $$
  select case s
    when 'menunggu_kurir' then 'Menunggu Kurir' when 'diambil' then 'Diambil Kurir'
    when 'dalam_perjalanan' then 'Dalam Perjalanan' when 'sampai' then 'Sampai Tujuan'
    when 'gagal' then 'Gagal Kirim' when 'dibatalkan' then 'Dibatalkan' else s end
$$;

-- ===== Trigger umum =====
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

-- Lapisan database: transisi status dan kolom immutable, berlaku untuk SIAPA PUN (termasuk service_role)
create or replace function public.trg_orders_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status and not public.status_boleh(old.status, new.status) then
    raise exception 'Transisi % -> % tidak diizinkan.', old.status, new.status using errcode = '23514';
  end if;
  if new.resi <> old.resi or new.owner_id <> old.owner_id or new.ongkir <> old.ongkir
     or new.zona_id <> old.zona_id or new.berat <> old.berat or new.layanan_id <> old.layanan_id
     or new.pengirim_kota <> old.pengirim_kota or new.penerima_kota <> old.penerima_kota then
    raise exception 'Data inti pesanan tidak boleh diubah setelah dibuat.' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger orders_guard before update on public.orders
  for each row execute function public.trg_orders_guard();

-- Profil otomatis saat signup. Role SELALU pelanggan: role tidak dipercaya dari client/metadata.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, nama, email)
  values (new.id, 'pelanggan',
          coalesce(nullif(trim(new.raw_user_meta_data ->> 'nama'), ''), split_part(new.email, '@', 1)),
          lower(new.email));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Hitung ongkir (cermin src/lib/tariff.js) =====
create or replace function public.hitung_ongkir(p_asal text, p_tujuan text, p_berat numeric, p_layanan text)
returns table (zona_id smallint, zona_nama text, jarak_km integer, tertagih integer, ongkir integer, estimasi text)
language plpgsql stable set search_path = '' as $$
#variable_conflict use_column
declare
  l public.layanan; a public.kota; b public.kota; z public.zona_tarif;
  km integer; d double precision; v_tertagih integer; v_ongkir integer;
begin
  select * into l from public.layanan where id = p_layanan and aktif;
  if not found then raise exception 'Pilih layanan yang valid.' using errcode = '22023'; end if;
  select * into a from public.kota where id = p_asal;
  select * into b from public.kota where id = p_tujuan;
  if a.id is null or b.id is null then raise exception 'Pilih kota asal dan kota tujuan yang valid.' using errcode = '22023'; end if;
  if p_berat is null or p_berat <= 0 then raise exception 'Berat harus lebih dari 0 kg.' using errcode = '22023'; end if;
  if p_berat > 100 then raise exception 'Berat maksimal 100 kg per paket.' using errcode = '22023'; end if;
  if p_berat < l.min_berat then raise exception '% minimal % kg.', l.nama, l.min_berat using errcode = '22023'; end if;

  d := 2 * 6371 * asin(sqrt(power(sin(radians((b.lat - a.lat)::double precision) / 2), 2)
        + cos(radians(a.lat::double precision)) * cos(radians(b.lat::double precision))
        * power(sin(radians((b.lng - a.lng)::double precision) / 2), 2)));
  km := round(d)::integer;

  select * into z from public.zona_tarif t
   where km <= coalesce(t.max_km, 2147483647)
   order by coalesce(t.max_km, 2147483647) asc limit 1;
  if not found then raise exception 'Zona tarif belum dikonfigurasi.' using errcode = '22023'; end if;
  if l.max_zona is not null and z.id > l.max_zona then
    raise exception '% hanya tersedia untuk Zona 1 sampai %.', l.nama, l.max_zona using errcode = '22023';
  end if;

  v_tertagih := ceil(p_berat)::integer;
  v_ongkir := (round((v_tertagih * z.per_kg * l.pengali) / 500) * 500)::integer;
  return query select z.id, z.nama, km, v_tertagih, v_ongkir, coalesce(l.estimasi ->> z.id::text, '-');
end $$;

-- ===== Notifikasi: outbox dalam transaksi yang sama dengan kejadian bisnis =====
create or replace function public.notify_user(p_user uuid, p_tipe text, p_judul text, p_isi text,
                                              p_url text, p_resi text, p_dedup text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_nid uuid;
begin
  insert into public.notifications (user_id, tipe, judul, isi, url, resi)
  values (p_user, p_tipe, p_judul, p_isi, p_url, p_resi) returning id into v_nid;
  insert into public.notification_jobs (subscription_id, notification_id, dedup_key, payload)
  select s.id, v_nid, p_dedup,
         jsonb_build_object('title', p_judul, 'body', p_isi, 'url', coalesce(p_url, '/'), 'tag', coalesce(p_resi, p_tipe))
    from public.push_subscriptions s where s.user_id = p_user and s.aktif
  on conflict (subscription_id, dedup_key) do nothing;
end $$;

create or replace function public.notify_admins(p_tipe text, p_judul text, p_isi text,
                                                p_url text, p_resi text, p_dedup text) returns void
language plpgsql security definer set search_path = '' as $$
declare a record;
begin
  for a in select id from public.profiles where role = 'admin' loop
    perform public.notify_user(a.id, p_tipe, p_judul, p_isi, p_url, p_resi, p_dedup);
  end loop;
end $$;

create or replace function public.notify_resi_subscribers(p_resi text, p_judul text, p_isi text,
                                                          p_url text, p_dedup text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notification_jobs (subscription_id, dedup_key, payload)
  select s.id, p_dedup, jsonb_build_object('title', p_judul, 'body', p_isi, 'url', p_url, 'tag', p_resi)
    from public.push_subscriptions s where s.resi = p_resi and s.user_id is null and s.aktif
  on conflict (subscription_id, dedup_key) do nothing;
end $$;

-- ===== Operasi bisnis (ongkir, resi, transisi dihitung/dicek di server) =====
create or replace function public.buat_order(
  p_pengirim_nama text, p_pengirim_hp text, p_pengirim_kota text, p_pengirim_alamat text,
  p_penerima_nama text, p_penerima_hp text, p_penerima_kota text, p_penerima_alamat text,
  p_isi text, p_berat numeric, p_catatan text, p_layanan text, p_cod boolean default false)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  h record; v_o public.orders; v_resi text; v_est timestamptz; v_kota text;
begin
  if v_uid is null then raise exception 'Anda harus login.' using errcode = '28000'; end if;
  if public.auth_role() <> 'pelanggan' then
    raise exception 'Hanya akun pelanggan yang dapat membuat pesanan.' using errcode = '42501';
  end if;
  select * into h from public.hitung_ongkir(p_pengirim_kota, p_penerima_kota, p_berat, p_layanan);
  v_resi := 'PEX' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD')
            || lpad((nextval('public.resi_seq') % 10000)::text, 4, '0');
  v_est := now() + case p_layanan
      when 'same_day' then interval '8 hours'
      when 'kilat' then (greatest(1, h.zona_id - 1) || ' days')::interval
      when 'kargo' then ((h.zona_id + 1) || ' days')::interval
      else (h.zona_id || ' days')::interval end;
  insert into public.orders (resi, owner_id, pengirim_nama, pengirim_hp, pengirim_kota, pengirim_alamat,
      penerima_nama, penerima_hp, penerima_kota, penerima_alamat, isi, berat, catatan,
      layanan_id, zona_id, jarak_km, ongkir, bayar, estimasi)
  values (v_resi, v_uid, trim(p_pengirim_nama), p_pengirim_hp, p_pengirim_kota, trim(p_pengirim_alamat),
      trim(p_penerima_nama), p_penerima_hp, p_penerima_kota, trim(p_penerima_alamat), trim(p_isi), p_berat,
      nullif(trim(p_catatan), ''), p_layanan, h.zona_id, h.jarak_km, h.ongkir,
      case when p_cod then 'cod' else 'menunggu' end, v_est)
  returning * into v_o;
  select nama into v_kota from public.kota where id = p_pengirim_kota;
  insert into public.tracking_events (resi, judul, lokasi, deskripsi, created_by)
  values (v_resi, 'Pesanan dibuat', v_kota, 'Pesanan diterima sistem Phelya Express.', v_uid);
  perform public.notify_admins('order_baru', 'Pesanan baru ' || v_resi,
      'Pesanan ' || v_resi || ' menunggu penugasan kurir.', '/admin/order', v_resi, 'order:' || v_resi);
  return v_o;
end $$;

create or replace function public.ubah_status_order(
  p_resi text, p_ke text, p_lokasi text default null, p_deskripsi text default null,
  p_alasan text default null, p_bukti_path text default null)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid()); v_role text := public.auth_role();
  v_o public.orders; v_evt bigint; v_resi text := upper(trim(p_resi));
  v_judul text; v_isi text;
begin
  if v_uid is null then raise exception 'Anda harus login.' using errcode = '28000'; end if;
  select * into v_o from public.orders where resi = v_resi for update;
  if not found then raise exception 'Pesanan tidak ditemukan.' using errcode = 'P0002'; end if;

  if p_ke = 'dibatalkan' then
    if not (v_o.owner_id = v_uid or v_role = 'admin') then
      raise exception 'Anda tidak berhak membatalkan pesanan ini.' using errcode = '42501'; end if;
    if v_o.status <> 'menunggu_kurir' then
      raise exception 'Pesanan sudah diproses dan tidak bisa dibatalkan.' using errcode = '23514'; end if;
  else
    if not (v_role = 'admin' or (v_role = 'kurir' and v_o.kurir_id is not null and v_o.kurir_id = public.my_kurir_id())) then
      raise exception 'Anda tidak berhak mengubah status pesanan ini.' using errcode = '42501'; end if;
  end if;
  if not public.status_boleh(v_o.status, p_ke) then
    raise exception 'Transisi % -> % tidak diizinkan.', public.label_status(v_o.status), public.label_status(p_ke)
      using errcode = '23514'; end if;
  if p_ke = 'gagal' and coalesce(trim(p_alasan), '') = '' then
    raise exception 'Alasan gagal kirim wajib diisi.' using errcode = '23514'; end if;
  if p_ke = 'sampai' then
    if p_bukti_path is null or p_bukti_path not like v_resi || '/%'
       or not exists (select 1 from storage.objects where bucket_id = 'bukti' and name = p_bukti_path) then
      raise exception 'Foto bukti serah terima wajib diunggah.' using errcode = '23514'; end if;
  end if;

  update public.orders set status = p_ke,
      alasan_gagal = case when p_ke = 'gagal' then trim(p_alasan) else null end,
      diterima_oleh = case when p_ke = 'sampai' then 'Yang Bersangkutan' else diterima_oleh end,
      bukti_path = case when p_ke = 'sampai' then p_bukti_path else bukti_path end
   where resi = v_resi returning * into v_o;

  v_judul := case when p_ke = 'dibatalkan' then 'Pesanan dibatalkan' else public.label_status(p_ke) end;
  insert into public.tracking_events (resi, judul, lokasi, deskripsi, created_by)
  values (v_resi, v_judul, coalesce(p_lokasi, '-'),
          coalesce(nullif(trim(p_deskripsi), ''), nullif(trim(p_alasan), ''), 'Status diperbarui.'), v_uid)
  returning id into v_evt;

  v_isi := 'Status paket ' || v_resi || ': ' || v_judul || '.';
  if v_o.owner_id <> v_uid then
    perform public.notify_user(v_o.owner_id, 'status_berubah', 'Paket ' || v_resi, v_isi,
        '/dashboard/pesanan/' || v_resi, v_resi, 'evt:' || v_evt);
  end if;
  perform public.notify_resi_subscribers(v_resi, 'Paket ' || v_resi, v_isi, '/lacak/' || v_resi, 'evt:' || v_evt);
  if p_ke in ('gagal','dibatalkan') then
    perform public.notify_admins('status_berubah', 'Paket ' || v_resi, v_isi, '/admin/order', v_resi, 'evt-admin:' || v_evt);
  end if;
  return v_o;
end $$;

create or replace function public.tugaskan_kurir(p_resi text, p_kurir_id uuid)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid()); v_o public.orders; v_k public.kurir;
  v_resi text := upper(trim(p_resi)); v_evt bigint;
begin
  if not public.is_admin() then raise exception 'Hanya admin yang dapat menugaskan kurir.' using errcode = '42501'; end if;
  select * into v_o from public.orders where resi = v_resi for update;
  if not found then raise exception 'Pesanan tidak ditemukan.' using errcode = 'P0002'; end if;
  if v_o.status in ('sampai','dibatalkan') then
    raise exception 'Pesanan sudah selesai atau dibatalkan.' using errcode = '23514'; end if;
  select * into v_k from public.kurir where id = p_kurir_id;
  if not found or not v_k.aktif then raise exception 'Kurir tidak ditemukan atau tidak aktif.' using errcode = '22023'; end if;
  update public.orders set kurir_id = p_kurir_id where resi = v_resi returning * into v_o;
  insert into public.tracking_events (resi, judul, lokasi, deskripsi, created_by)
  values (v_resi, 'Kurir ditugaskan', v_k.hub, 'Admin menugaskan kurir ' || v_k.nama || ' (' || v_k.kode || ').', v_uid)
  returning id into v_evt;
  if v_k.user_id is not null then
    perform public.notify_user(v_k.user_id, 'kurir_ditugaskan', 'Tugas baru ' || v_resi,
        'Anda ditugaskan menjemput paket ' || v_resi || '.', '/kurir/tugas/' || v_resi, v_resi, 'assign:' || v_evt);
  end if;
  perform public.notify_user(v_o.owner_id, 'status_berubah', 'Paket ' || v_resi,
      'Kurir ' || v_k.nama || ' ditugaskan untuk paket Anda.', '/dashboard/pesanan/' || v_resi, v_resi, 'evt:' || v_evt);
  return v_o;
end $$;

create or replace function public.konfirmasi_bayar(p_resi text)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_o public.orders; v_resi text := upper(trim(p_resi));
begin
  if not public.is_admin() then raise exception 'Hanya admin yang dapat mengonfirmasi pembayaran.' using errcode = '42501'; end if;
  select * into v_o from public.orders where resi = v_resi for update;
  if not found then raise exception 'Pesanan tidak ditemukan.' using errcode = 'P0002'; end if;
  if v_o.bayar = 'lunas' then raise exception 'Pembayaran sudah dikonfirmasi.' using errcode = '23514'; end if;
  if v_o.status = 'dibatalkan' then raise exception 'Pesanan dibatalkan.' using errcode = '23514'; end if;
  update public.orders set bayar = 'lunas', bayar_dikonfirmasi_at = now(), bayar_dikonfirmasi_oleh = v_uid
   where resi = v_resi returning * into v_o;
  perform public.notify_user(v_o.owner_id, 'pembayaran', 'Pembayaran diterima',
      'Pembayaran paket ' || v_resi || ' telah dikonfirmasi.', '/dashboard/pesanan/' || v_resi, v_resi, 'bayar:' || v_resi);
  return v_o;
end $$;

-- Pelacakan publik (tamu): hanya info non-sensitif, tanpa alamat dan nomor HP
create or replace function public.lacak_resi(p_resi text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'resi', o.resi, 'status', o.status, 'status_label', public.label_status(o.status),
    'layanan', l.nama, 'berat', o.berat,
    'asal', ka.nama, 'tujuan', kt.nama, 'dibuat', o.dibuat, 'estimasi', o.estimasi,
    'diterima_oleh', o.diterima_oleh, 'alasan_gagal', o.alasan_gagal,
    'kurir', case when k.id is null then null else jsonb_build_object('nama', k.nama, 'kode', k.kode) end,
    'timeline', coalesce((select jsonb_agg(jsonb_build_object('waktu', e.waktu, 'judul', e.judul,
                 'lokasi', e.lokasi, 'deskripsi', e.deskripsi) order by e.waktu desc)
               from public.tracking_events e where e.resi = o.resi), '[]'::jsonb))
  from public.orders o
  join public.layanan l on l.id = o.layanan_id
  join public.kota ka on ka.id = o.pengirim_kota
  join public.kota kt on kt.id = o.penerima_kota
  left join public.kurir k on k.id = o.kurir_id
  where o.resi = upper(trim(p_resi))
$$;

-- Notifikasi lamaran ke semua admin
create or replace function public.trg_lamaran_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_judul text;
begin
  select judul into v_judul from public.lowongan where slug = new.lowongan_slug;
  perform public.notify_admins('lamaran', 'Lamaran baru', new.nama || ' melamar ' || coalesce(v_judul, new.lowongan_slug),
      '/admin/karier', null, 'lamaran:' || new.id);
  return new;
end $$;
create trigger lamaran_notify after insert on public.lamaran
  for each row execute function public.trg_lamaran_notify();

-- ===== API khusus worker (service_role) =====
create or replace function public.claim_notification_jobs(p_limit integer default 20)
returns table (job_id bigint, subscription_id uuid, endpoint text, p256dh text, auth text, payload jsonb, attempts smallint)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
begin
  -- job yang terkunci lebih dari 5 menit (worker mati) dan sudah habis jatah percobaan ditandai dead
  update public.notification_jobs j set status = 'dead', locked_at = null, last_error = coalesce(last_error, 'Worker berhenti saat memproses (lock timeout).')
   where j.status = 'processing' and j.locked_at < now() - interval '5 minutes' and j.attempts >= j.max_attempts;
  return query
  with picked as (
    select j.id from public.notification_jobs j
     where ((j.status in ('pending','failed') and j.next_run_at <= now())
         or (j.status = 'processing' and j.locked_at < now() - interval '5 minutes'))
       and j.attempts < j.max_attempts
     order by j.next_run_at for update skip locked limit greatest(1, least(p_limit, 100))
  ), upd as (
    update public.notification_jobs j set status = 'processing', locked_at = now(), attempts = j.attempts + 1
      from picked where j.id = picked.id
    returning j.id, j.subscription_id, j.payload, j.attempts
  )
  select u.id, s.id, s.endpoint, s.p256dh, s.auth, u.payload, u.attempts
    from upd u join public.push_subscriptions s on s.id = u.subscription_id;
end $$;

create or replace function public.complete_notification_job(p_job bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v_sub uuid;
begin
  update public.notification_jobs set status = 'sent', sent_at = now(), locked_at = null, last_error = null
   where id = p_job returning subscription_id into v_sub;
  update public.push_subscriptions set last_success_at = now(), failed_count = 0 where id = v_sub;
end $$;

create or replace function public.fail_notification_job(p_job bigint, p_error text, p_permanent boolean default false)
returns void
language plpgsql security definer set search_path = '' as $$
declare j public.notification_jobs;
begin
  select * into j from public.notification_jobs where id = p_job for update;
  if not found then return; end if;
  if p_permanent or j.attempts >= j.max_attempts then
    update public.notification_jobs set status = 'dead', locked_at = null, last_error = left(p_error, 500) where id = p_job;
  else
    update public.notification_jobs set status = 'failed', locked_at = null, last_error = left(p_error, 500),
           next_run_at = now() + (power(2, j.attempts) * interval '30 seconds') where id = p_job;
  end if;
  if p_permanent then
    update public.push_subscriptions set aktif = false, failed_count = failed_count + 1 where id = j.subscription_id;
  else
    update public.push_subscriptions set failed_count = failed_count + 1 where id = j.subscription_id;
  end if;
end $$;

-- ===== Hak eksekusi =====
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.auth_role(), public.is_admin(), public.my_kurir_id() to anon, authenticated;
grant execute on function public.status_boleh(text, text), public.label_status(text) to anon, authenticated;
grant execute on function public.hitung_ongkir(text, text, numeric, text) to anon, authenticated;
grant execute on function public.lacak_resi(text) to anon, authenticated;
grant execute on function public.buat_order(text,text,text,text,text,text,text,text,text,numeric,text,text,boolean) to authenticated;
grant execute on function public.ubah_status_order(text,text,text,text,text,text) to authenticated;
grant execute on function public.tugaskan_kurir(text, uuid) to authenticated;
grant execute on function public.konfirmasi_bayar(text) to authenticated;
grant execute on function public.claim_notification_jobs(integer), public.complete_notification_job(bigint),
  public.fail_notification_job(bigint, text, boolean) to service_role;
