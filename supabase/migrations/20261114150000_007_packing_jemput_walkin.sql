-- 007: packing tambahan, metode serah (jemput / antar sendiri), pesanan manual dari kantor (walk-in),
--      pengaturan kantor & tarif jemput, kolom pembayaran Midtrans.
-- Semua biaya dihitung di database (hitung_biaya); browser tidak pernah mengirim harga.

-- ===== Helper jarak =====
create or replace function public.jarak_haversine_km(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
returns double precision language sql immutable set search_path = '' as $$
  select 2 * 6371 * asin(sqrt(power(sin(radians((lat2 - lat1)::double precision) / 2), 2)
       + cos(radians(lat1::double precision)) * cos(radians(lat2::double precision))
       * power(sin(radians((lng2 - lng1)::double precision) / 2), 2)))
$$;

-- ===== Tabel baru =====
create table public.pengaturan (
  id smallint primary key default 1 check (id = 1),
  kantor_nama text not null default 'Kantor Phelya Express' check (length(trim(kantor_nama)) >= 3),
  kantor_alamat text not null default 'Jl. Pandanaran No. 10, Semarang',
  kantor_lat numeric(9,6) not null default -6.966700 check (kantor_lat between -90 and 90),
  kantor_lng numeric(9,6) not null default 110.416700 check (kantor_lng between -180 and 180),
  jemput_maks_km integer not null default 10 check (jemput_maks_km between 1 and 100),
  jemput_biaya_dasar integer not null default 5000 check (jemput_biaya_dasar >= 0),
  jemput_biaya_per_km integer not null default 2000 check (jemput_biaya_per_km >= 0),
  jemput_min_berat numeric(6,2) not null default 5 check (jemput_min_berat > 0),
  diskon_member_persen numeric(5,2) not null default 0 check (diskon_member_persen between 0 and 100),
  wa_admin text not null default '6281234567890' check (wa_admin ~ '^62[0-9]{8,13}$'),
  updated_at timestamptz not null default now()
);
insert into public.pengaturan (id) values (1);

create table public.packing_options (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  nama text not null unique check (length(trim(nama)) >= 3),
  deskripsi text,
  harga integer not null default 0 check (harga >= 0),
  urutan smallint not null default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.packing_options (id, nama, deskripsi, harga, urutan) values
  ('tidak',       'Tidak',       'Tanpa packing tambahan.',                         0,     0),
  ('bubble_wrap', 'Bubble wrap', 'Dilapisi bubble wrap untuk barang mudah penyok.', 5000,  1),
  ('kardus',      'Kardus',      'Dimasukkan ke kardus tebal.',                      8000,  2),
  ('kayu',        'Kayu',        'Peti kayu untuk barang berharga atau rapuh.',      35000, 3);

-- Pelanggan umum / instan (walk-in): tanpa akun login, dikelola admin.
create table public.pelanggan_umum (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (length(trim(nama)) >= 2),
  hp text not null unique check (hp ~ '^(08|\+628)[0-9]{8,11}$'),
  alamat text not null check (length(trim(alamat)) >= 5),
  kota_id text not null references public.kota(id),
  aktif boolean not null default true,
  dibuat_oleh uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index pelanggan_umum_kota_idx on public.pelanggan_umum (kota_id);
create index pelanggan_umum_dibuat_oleh_idx on public.pelanggan_umum (dibuat_oleh) where dibuat_oleh is not null;

-- Log notifikasi Midtrans: bukti audit sekaligus kunci idempotensi (hanya service_role).
create table public.midtrans_events (
  id bigint generated always as identity primary key,
  midtrans_order_id text not null,
  transaction_status text not null,
  fraud_status text,
  payment_type text,
  gross_amount numeric(14,2),
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (midtrans_order_id, transaction_status)
);

alter table public.profiles add column aktif boolean not null default true;

-- ===== Perubahan tabel orders =====
alter table public.orders alter column owner_id drop not null;
alter table public.orders
  add column pelanggan_umum_id uuid references public.pelanggan_umum(id),
  add column sumber text not null default 'online' check (sumber in ('online','kantor')),
  add column dibuat_oleh uuid references public.profiles(id) on delete set null,
  add column packing_id text not null default 'tidak' references public.packing_options(id),
  add column packing_biaya integer not null default 0 check (packing_biaya >= 0),
  add column metode_serah text not null default 'antar_sendiri' check (metode_serah in ('jemput','antar_sendiri')),
  add column jemput_alamat text,
  add column jemput_lat numeric(9,6),
  add column jemput_lng numeric(9,6),
  add column jemput_jarak_km numeric(6,2) not null default 0 check (jemput_jarak_km >= 0),
  add column jemput_biaya integer not null default 0 check (jemput_biaya >= 0),
  add column diskon integer not null default 0 check (diskon >= 0),
  add column total integer,
  add column bayar_metode text check (bayar_metode is null or bayar_metode in ('tunai','midtrans','cod','manual')),
  add column midtrans_order_id text unique,
  add column midtrans_token text,
  add column midtrans_status text,
  add column midtrans_attempt smallint not null default 0;

-- Pesanan lama: antar sendiri tanpa biaya tambahan, total = ongkir
update public.orders set total = ongkir;
alter table public.orders alter column total set not null;
alter table public.orders add constraint orders_total_cek check (total >= 0 and total = ongkir + packing_biaya + jemput_biaya - diskon);
alter table public.orders add constraint orders_diskon_cek check (diskon <= ongkir);
alter table public.orders add constraint orders_pemilik_cek check (owner_id is not null or pelanggan_umum_id is not null);
alter table public.orders add constraint orders_serah_cek check (
  (metode_serah = 'jemput' and jemput_alamat is not null and length(trim(jemput_alamat)) >= 5
     and jemput_lat is not null and jemput_lng is not null)
  or (metode_serah = 'antar_sendiri' and jemput_biaya = 0));

-- Status baru: menunggu_antar (pelanggan belum mengantar paket ke kantor)
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('menunggu_antar','menunggu_kurir','diambil','dalam_perjalanan','sampai','gagal','dibatalkan'));
alter table public.orders drop constraint orders_kurir_wajib;
alter table public.orders add constraint orders_kurir_wajib
  check (status in ('menunggu_antar','menunggu_kurir','dibatalkan') or kurir_id is not null);

create index orders_packing_idx on public.orders (packing_id);
create index orders_umum_idx on public.orders (pelanggan_umum_id) where pelanggan_umum_id is not null;
create index orders_dibuat_oleh_idx on public.orders (dibuat_oleh) where dibuat_oleh is not null;
create index midtrans_events_order_idx on public.midtrans_events (midtrans_order_id);

-- ===== Aturan status =====
create or replace function public.status_boleh(dari text, ke text) returns boolean
language sql immutable set search_path = '' as $$
  select case dari
    when 'menunggu_antar' then ke in ('menunggu_kurir','dibatalkan')
    when 'menunggu_kurir' then ke in ('diambil','dibatalkan')
    when 'diambil' then ke in ('dalam_perjalanan','gagal')
    when 'dalam_perjalanan' then ke in ('sampai','gagal')
    when 'gagal' then ke = 'dalam_perjalanan'
    else false end
$$;

create or replace function public.label_status(s text) returns text
language sql immutable set search_path = '' as $$
  select case s
    when 'menunggu_antar' then 'Menunggu Diantar ke Kantor'
    when 'menunggu_kurir' then 'Menunggu Kurir' when 'diambil' then 'Diambil Kurir'
    when 'dalam_perjalanan' then 'Dalam Perjalanan' when 'sampai' then 'Sampai Tujuan'
    when 'gagal' then 'Gagal Kirim' when 'dibatalkan' then 'Dibatalkan' else s end
$$;

-- Data inti (termasuk seluruh komponen biaya) tidak boleh berubah setelah pesanan dibuat
create or replace function public.trg_orders_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status and not public.status_boleh(old.status, new.status) then
    raise exception 'Transisi % -> % tidak diizinkan.', old.status, new.status using errcode = '23514';
  end if;
  if new.resi <> old.resi or new.owner_id is distinct from old.owner_id
     or new.pelanggan_umum_id is distinct from old.pelanggan_umum_id
     or new.ongkir <> old.ongkir or new.zona_id <> old.zona_id or new.berat <> old.berat
     or new.layanan_id <> old.layanan_id or new.pengirim_kota <> old.pengirim_kota
     or new.penerima_kota <> old.penerima_kota or new.total <> old.total
     or new.packing_biaya <> old.packing_biaya or new.jemput_biaya <> old.jemput_biaya
     or new.diskon <> old.diskon or new.metode_serah <> old.metode_serah then
    raise exception 'Data inti pesanan tidak boleh diubah setelah dibuat.' using errcode = '23514';
  end if;
  return new;
end $$;

-- ===== Perhitungan biaya (satu-satunya sumber kebenaran harga) =====
create or replace function public.hitung_biaya(
  p_asal text, p_tujuan text, p_berat numeric, p_layanan text,
  p_packing text default 'tidak', p_metode text default 'antar_sendiri',
  p_jemput_lat numeric default null, p_jemput_lng numeric default null, p_member boolean default false)
returns table (zona_id smallint, zona_nama text, jarak_km integer, tertagih integer, ongkir integer, estimasi text,
               packing_biaya integer, jemput_jarak_km numeric, jemput_biaya integer, diskon integer, total integer)
language plpgsql stable set search_path = '' as $$
#variable_conflict use_column
declare
  h record; s public.pengaturan; pk public.packing_options;
  v_km numeric := 0; v_jemput integer := 0; v_diskon integer := 0;
begin
  select * into h from public.hitung_ongkir(p_asal, p_tujuan, p_berat, p_layanan);
  select * into s from public.pengaturan where id = 1;
  select * into pk from public.packing_options where id = coalesce(p_packing, 'tidak') and aktif;
  if not found then raise exception 'Pilihan packing tidak valid.' using errcode = '22023'; end if;
  if p_metode is null or p_metode not in ('jemput','antar_sendiri') then
    raise exception 'Pilih cara paket sampai ke Phelya.' using errcode = '22023'; end if;

  if p_metode = 'jemput' then
    if not coalesce(p_member, false) then
      raise exception 'Penjemputan hanya tersedia untuk pelanggan membership.' using errcode = '22023'; end if;
    if p_berat < s.jemput_min_berat then
      raise exception 'Penjemputan minimal % kg. Antar sendiri ke kantor untuk paket lebih ringan.', s.jemput_min_berat
        using errcode = '22023'; end if;
    if p_jemput_lat is null or p_jemput_lng is null or p_jemput_lat not between -90 and 90
       or p_jemput_lng not between -180 and 180 then
      raise exception 'Tandai titik jemput di peta.' using errcode = '22023'; end if;
    v_km := round(public.jarak_haversine_km(s.kantor_lat, s.kantor_lng, p_jemput_lat, p_jemput_lng)::numeric, 2);
    if v_km > s.jemput_maks_km then
      raise exception 'Titik jemput berjarak % km dari kantor, melebihi batas % km.', v_km, s.jemput_maks_km
        using errcode = '22023'; end if;
    v_jemput := s.jemput_biaya_dasar + s.jemput_biaya_per_km * ceil(v_km)::integer;
  end if;

  if coalesce(p_member, false) and s.diskon_member_persen > 0 then
    v_diskon := round(h.ongkir * s.diskon_member_persen / 100)::integer;
  end if;

  return query select h.zona_id, h.zona_nama, h.jarak_km, h.tertagih, h.ongkir, h.estimasi,
                      pk.harga, v_km, v_jemput, v_diskon, h.ongkir + pk.harga + v_jemput - v_diskon;
end $$;

-- ===== Buat pesanan (pelanggan membership, online) =====
drop function public.buat_order(text,text,text,text,text,text,text,text,text,numeric,text,text,boolean);
create or replace function public.buat_order(
  p_pengirim_nama text, p_pengirim_hp text, p_pengirim_kota text, p_pengirim_alamat text,
  p_penerima_nama text, p_penerima_hp text, p_penerima_kota text, p_penerima_alamat text,
  p_isi text, p_berat numeric, p_catatan text, p_layanan text, p_cod boolean default false,
  p_packing text default 'tidak', p_metode text default 'antar_sendiri',
  p_jemput_alamat text default null, p_jemput_lat numeric default null, p_jemput_lng numeric default null)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  h record; v_o public.orders; v_resi text; v_est timestamptz; v_kota text;
begin
  if v_uid is null then raise exception 'Anda harus login.' using errcode = '28000'; end if;
  if public.auth_role() <> 'pelanggan' then
    raise exception 'Hanya akun pelanggan yang dapat membuat pesanan.' using errcode = '42501'; end if;
  if p_metode = 'jemput' and length(trim(coalesce(p_jemput_alamat, ''))) < 5 then
    raise exception 'Alamat jemput wajib diisi (minimal 5 karakter).' using errcode = '22023'; end if;

  select * into h from public.hitung_biaya(p_pengirim_kota, p_penerima_kota, p_berat, p_layanan,
                                           p_packing, p_metode, p_jemput_lat, p_jemput_lng, true);
  v_resi := 'PEX' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD')
            || lpad((nextval('public.resi_seq') % 10000)::text, 4, '0');
  v_est := now() + case p_layanan
      when 'same_day' then interval '8 hours'
      when 'kilat' then (greatest(1, h.zona_id - 1) || ' days')::interval
      when 'kargo' then ((h.zona_id + 1) || ' days')::interval
      else (h.zona_id || ' days')::interval end;

  insert into public.orders (resi, owner_id, sumber, pengirim_nama, pengirim_hp, pengirim_kota, pengirim_alamat,
      penerima_nama, penerima_hp, penerima_kota, penerima_alamat, isi, berat, catatan,
      layanan_id, zona_id, jarak_km, ongkir, packing_id, packing_biaya, metode_serah,
      jemput_alamat, jemput_lat, jemput_lng, jemput_jarak_km, jemput_biaya, diskon, total,
      bayar, bayar_metode, status, estimasi)
  values (v_resi, v_uid, 'online', trim(p_pengirim_nama), p_pengirim_hp, p_pengirim_kota, trim(p_pengirim_alamat),
      trim(p_penerima_nama), p_penerima_hp, p_penerima_kota, trim(p_penerima_alamat), trim(p_isi), p_berat,
      nullif(trim(p_catatan), ''), p_layanan, h.zona_id, h.jarak_km, h.ongkir, coalesce(p_packing, 'tidak'), h.packing_biaya,
      p_metode, case when p_metode = 'jemput' then trim(p_jemput_alamat) end,
      case when p_metode = 'jemput' then p_jemput_lat end, case when p_metode = 'jemput' then p_jemput_lng end,
      h.jemput_jarak_km, h.jemput_biaya, h.diskon, h.total,
      case when p_cod then 'cod' else 'menunggu' end, case when p_cod then 'cod' end,
      case when p_metode = 'jemput' then 'menunggu_kurir' else 'menunggu_antar' end, v_est)
  returning * into v_o;

  select nama into v_kota from public.kota where id = p_pengirim_kota;
  insert into public.tracking_events (resi, judul, lokasi, deskripsi, created_by)
  values (v_resi, 'Pesanan dibuat', v_kota,
          case when p_metode = 'jemput' then 'Pesanan diterima. Kurir akan menjemput paket ke alamat pengirim.'
               else 'Pesanan diterima. Pengirim akan mengantar paket ke kantor Phelya.' end, v_uid);
  perform public.notify_admins('order_baru', 'Pesanan baru ' || v_resi,
      case when p_metode = 'jemput' then 'Pesanan ' || v_resi || ' menunggu penugasan kurir jemput.'
           else 'Pesanan ' || v_resi || ' menunggu paket diantar ke kantor.' end,
      '/admin/order', v_resi, 'order:' || v_resi);
  return v_o;
end $$;

-- ===== Buat pesanan oleh admin (pelanggan datang ke kantor / input manual) =====
create or replace function public.buat_order_admin(
  p_tipe text, p_member_id uuid, p_umum_id uuid,
  p_pengirim_nama text, p_pengirim_hp text, p_pengirim_kota text, p_pengirim_alamat text,
  p_penerima_nama text, p_penerima_hp text, p_penerima_kota text, p_penerima_alamat text,
  p_isi text, p_berat numeric, p_catatan text, p_layanan text,
  p_packing text default 'tidak', p_metode text default 'antar_sendiri',
  p_jemput_alamat text default null, p_jemput_lat numeric default null, p_jemput_lng numeric default null,
  p_bayar text default 'tunai')
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  h record; v_o public.orders; v_resi text; v_est timestamptz; v_umum uuid; v_owner uuid; v_kantor text;
  v_hp text := regexp_replace(coalesce(p_pengirim_hp, ''), '[\s-]', '', 'g');
begin
  if not public.is_admin() then raise exception 'Hanya admin yang dapat menambah order.' using errcode = '42501'; end if;
  if p_tipe not in ('member','umum') then raise exception 'Pilih jenis pelanggan.' using errcode = '22023'; end if;
  if p_bayar not in ('tunai','midtrans') then raise exception 'Pilih metode pembayaran.' using errcode = '22023'; end if;
  if p_metode = 'jemput' and length(trim(coalesce(p_jemput_alamat, ''))) < 5 then
    raise exception 'Alamat jemput wajib diisi (minimal 5 karakter).' using errcode = '22023'; end if;

  if p_tipe = 'member' then
    if not exists (select 1 from public.profiles where id = p_member_id and role = 'pelanggan' and aktif) then
      raise exception 'Pelanggan membership tidak ditemukan atau nonaktif.' using errcode = 'P0002'; end if;
    v_owner := p_member_id;
  else
    if v_hp !~ '^(08|\+628)[0-9]{8,11}$' then raise exception 'Nomor HP pelanggan tidak valid.' using errcode = '22023'; end if;
    if length(trim(coalesce(p_pengirim_nama, ''))) < 2 or length(trim(coalesce(p_pengirim_alamat, ''))) < 5 then
      raise exception 'Nama dan alamat pelanggan wajib diisi.' using errcode = '22023'; end if;
    insert into public.pelanggan_umum (nama, hp, alamat, kota_id, dibuat_oleh)
    values (trim(p_pengirim_nama), v_hp, trim(p_pengirim_alamat), p_pengirim_kota, v_uid)
    on conflict (hp) do update set nama = excluded.nama, alamat = excluded.alamat, kota_id = excluded.kota_id, aktif = true
    returning id into v_umum;
  end if;

  select * into h from public.hitung_biaya(p_pengirim_kota, p_penerima_kota, p_berat, p_layanan,
                                           p_packing, p_metode, p_jemput_lat, p_jemput_lng, p_tipe = 'member');
  select kantor_nama into v_kantor from public.pengaturan where id = 1;
  v_resi := 'PEX' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD')
            || lpad((nextval('public.resi_seq') % 10000)::text, 4, '0');
  v_est := now() + case p_layanan
      when 'same_day' then interval '8 hours'
      when 'kilat' then (greatest(1, h.zona_id - 1) || ' days')::interval
      when 'kargo' then ((h.zona_id + 1) || ' days')::interval
      else (h.zona_id || ' days')::interval end;

  insert into public.orders (resi, owner_id, pelanggan_umum_id, sumber, dibuat_oleh,
      pengirim_nama, pengirim_hp, pengirim_kota, pengirim_alamat,
      penerima_nama, penerima_hp, penerima_kota, penerima_alamat, isi, berat, catatan,
      layanan_id, zona_id, jarak_km, ongkir, packing_id, packing_biaya, metode_serah,
      jemput_alamat, jemput_lat, jemput_lng, jemput_jarak_km, jemput_biaya, diskon, total,
      bayar, bayar_metode, bayar_dikonfirmasi_at, bayar_dikonfirmasi_oleh, status, estimasi)
  values (v_resi, v_owner, v_umum, 'kantor', v_uid,
      trim(p_pengirim_nama), v_hp, p_pengirim_kota, trim(p_pengirim_alamat),
      trim(p_penerima_nama), regexp_replace(coalesce(p_penerima_hp, ''), '[\s-]', '', 'g'), p_penerima_kota,
      trim(p_penerima_alamat), trim(p_isi), p_berat, nullif(trim(p_catatan), ''),
      p_layanan, h.zona_id, h.jarak_km, h.ongkir, coalesce(p_packing, 'tidak'), h.packing_biaya, p_metode,
      case when p_metode = 'jemput' then trim(p_jemput_alamat) end,
      case when p_metode = 'jemput' then p_jemput_lat end, case when p_metode = 'jemput' then p_jemput_lng end,
      h.jemput_jarak_km, h.jemput_biaya, h.diskon, h.total,
      case when p_bayar = 'tunai' then 'lunas' else 'menunggu' end, p_bayar,
      case when p_bayar = 'tunai' then now() end, case when p_bayar = 'tunai' then v_uid end,
      'menunggu_kurir', v_est)
  returning * into v_o;

  insert into public.tracking_events (resi, judul, lokasi, deskripsi, created_by)
  values (v_resi, 'Pesanan dibuat di kantor', v_kantor,
          case when p_metode = 'jemput' then 'Pesanan diinput admin. Kurir akan menjemput paket.'
               else 'Pesanan diinput admin dan paket diterima langsung di kantor.' end, v_uid);
  if v_owner is not null then
    perform public.notify_user(v_owner, 'status_berubah', 'Pesanan ' || v_resi,
        'Admin membuat pesanan ' || v_resi || ' untuk Anda.', '/dashboard/pesanan/' || v_resi, v_resi, 'order:' || v_resi);
  end if;
  return v_o;
end $$;

-- ===== Fungsi lama yang perlu menangani pesanan tanpa akun pemilik & status baru =====
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
    if v_o.status not in ('menunggu_kurir','menunggu_antar') then
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

  v_judul := case when p_ke = 'dibatalkan' then 'Pesanan dibatalkan'
                  when p_ke = 'menunggu_kurir' and p_alasan is null and v_role = 'admin' then 'Paket diterima di kantor'
                  else public.label_status(p_ke) end;
  insert into public.tracking_events (resi, judul, lokasi, deskripsi, created_by)
  values (v_resi, v_judul, coalesce(p_lokasi, '-'),
          coalesce(nullif(trim(p_deskripsi), ''), nullif(trim(p_alasan), ''), 'Status diperbarui.'), v_uid)
  returning id into v_evt;

  v_isi := 'Status paket ' || v_resi || ': ' || v_judul || '.';
  if v_o.owner_id is not null and v_o.owner_id <> v_uid then
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
  if v_o.status = 'menunggu_antar' then
    raise exception 'Paket belum diterima di kantor. Konfirmasi penerimaan paket terlebih dahulu.' using errcode = '23514'; end if;
  select * into v_k from public.kurir where id = p_kurir_id;
  if not found or not v_k.aktif then raise exception 'Kurir tidak ditemukan atau tidak aktif.' using errcode = '22023'; end if;
  update public.orders set kurir_id = p_kurir_id where resi = v_resi returning * into v_o;
  insert into public.tracking_events (resi, judul, lokasi, deskripsi, created_by)
  values (v_resi, 'Kurir ditugaskan', v_k.hub, 'Admin menugaskan kurir ' || v_k.nama || ' (' || v_k.kode || ').', v_uid)
  returning id into v_evt;
  if v_k.user_id is not null then
    perform public.notify_user(v_k.user_id, 'kurir_ditugaskan', 'Tugas baru ' || v_resi,
        case when v_o.metode_serah = 'jemput' then 'Anda ditugaskan menjemput paket ' || v_resi || '.'
             else 'Anda ditugaskan mengambil paket ' || v_resi || ' dari kantor.' end,
        '/kurir/tugas/' || v_resi, v_resi, 'assign:' || v_evt);
  end if;
  if v_o.owner_id is not null then
    perform public.notify_user(v_o.owner_id, 'status_berubah', 'Paket ' || v_resi,
        'Kurir ' || v_k.nama || ' ditugaskan untuk paket Anda.', '/dashboard/pesanan/' || v_resi, v_resi, 'evt:' || v_evt);
  end if;
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
  update public.orders set bayar = 'lunas', bayar_metode = coalesce(bayar_metode, 'manual'),
         bayar_dikonfirmasi_at = now(), bayar_dikonfirmasi_oleh = v_uid
   where resi = v_resi returning * into v_o;
  if v_o.owner_id is not null then
    perform public.notify_user(v_o.owner_id, 'pembayaran', 'Pembayaran diterima',
        'Pembayaran paket ' || v_resi || ' telah dikonfirmasi.', '/dashboard/pesanan/' || v_resi, v_resi, 'bayar:' || v_resi);
  end if;
  return v_o;
end $$;

-- ===== Admin: ubah data membership (role tidak bisa diubah dari sini) =====
create or replace function public.admin_ubah_member(
  p_id uuid, p_nama text, p_hp text, p_kota text, p_tier text, p_aktif boolean)
returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare v_p public.profiles; v_hp text := regexp_replace(coalesce(p_hp, ''), '[\s-]', '', 'g');
begin
  if not public.is_admin() then raise exception 'Hanya admin yang dapat mengubah pelanggan.' using errcode = '42501'; end if;
  if length(trim(coalesce(p_nama, ''))) < 2 then raise exception 'Nama minimal 2 karakter.' using errcode = '22023'; end if;
  if v_hp <> '' and v_hp !~ '^(08|\+628)[0-9]{8,11}$' then raise exception 'Nomor HP tidak valid.' using errcode = '22023'; end if;
  if p_tier not in ('Bronze','Silver','Gold') then raise exception 'Tier tidak valid.' using errcode = '22023'; end if;
  update public.profiles set nama = trim(p_nama), hp = nullif(v_hp, ''), kota_id = nullif(p_kota, ''),
         tier = p_tier, aktif = coalesce(p_aktif, aktif)
   where id = p_id and role = 'pelanggan' returning * into v_p;
  if not found then raise exception 'Pelanggan tidak ditemukan.' using errcode = 'P0002'; end if;
  return v_p;
end $$;

-- ===== Hak akses & RLS tabel baru =====
revoke all on public.pengaturan, public.packing_options, public.pelanggan_umum, public.midtrans_events from anon, authenticated;
grant select on public.pengaturan, public.packing_options to anon, authenticated;
grant update on public.pengaturan to authenticated;
grant insert, update, delete on public.packing_options to authenticated;
grant select, insert, update, delete on public.pelanggan_umum to authenticated;

alter table public.pengaturan enable row level security;
alter table public.packing_options enable row level security;
alter table public.pelanggan_umum enable row level security;
alter table public.midtrans_events enable row level security;   -- tanpa policy: hanya service_role

create policy pengaturan_read on public.pengaturan for select to anon, authenticated using (true);
create policy pengaturan_admin_upd on public.pengaturan for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy packing_read on public.packing_options for select to anon, authenticated
  using (aktif or public.is_admin());
create policy packing_admin_ins on public.packing_options for insert to authenticated with check (public.is_admin());
create policy packing_admin_upd on public.packing_options for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy packing_admin_del on public.packing_options for delete to authenticated using (public.is_admin());

create policy umum_admin_sel on public.pelanggan_umum for select to authenticated using (public.is_admin());
create policy umum_admin_ins on public.pelanggan_umum for insert to authenticated with check (public.is_admin());
create policy umum_admin_upd on public.pelanggan_umum for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy umum_admin_del on public.pelanggan_umum for delete to authenticated using (public.is_admin());

revoke execute on function
  public.jarak_haversine_km(numeric, numeric, numeric, numeric),
  public.hitung_biaya(text,text,numeric,text,text,text,numeric,numeric,boolean),
  public.buat_order(text,text,text,text,text,text,text,text,text,numeric,text,text,boolean,text,text,text,numeric,numeric),
  public.buat_order_admin(text,uuid,uuid,text,text,text,text,text,text,text,text,text,numeric,text,text,text,text,text,numeric,numeric,text),
  public.admin_ubah_member(uuid,text,text,text,text,boolean)
  from public, anon, authenticated;
grant execute on function public.jarak_haversine_km(numeric, numeric, numeric, numeric) to anon, authenticated;
grant execute on function public.hitung_biaya(text,text,numeric,text,text,text,numeric,numeric,boolean) to anon, authenticated;
grant execute on function public.buat_order(text,text,text,text,text,text,text,text,text,numeric,text,text,boolean,text,text,text,numeric,numeric) to authenticated;
grant execute on function public.buat_order_admin(text,uuid,uuid,text,text,text,text,text,text,text,text,text,numeric,text,text,text,text,text,numeric,numeric,text) to authenticated;
grant execute on function public.admin_ubah_member(uuid,text,text,text,text,boolean) to authenticated;
-- fungsi yang dibuat ulang (create or replace) mempertahankan hak eksekusi sebelumnya

-- ===== Data contoh: pelanggan umum (fiktif) =====
insert into public.pelanggan_umum (nama, hp, alamat, kota_id) values
  ('Budi Santoso',   '081200000001', 'Jl. Melati No. 12, Semarang', 'semarang'),
  ('Siti Rahmawati', '081200000002', 'Jl. Kenanga No. 5, Semarang', 'semarang'),
  ('Agus Pratama',   '081200000003', 'Jl. Mawar No. 21, Semarang',  'semarang'),
  ('Lestari Wulan',  '081200000004', 'Jl. Anggrek No. 8, Semarang', 'semarang'),
  ('Hendra Gunawan', '081200000005', 'Jl. Dahlia No. 3, Semarang',  'semarang');
