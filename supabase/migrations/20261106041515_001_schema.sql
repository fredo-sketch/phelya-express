create sequence public.resi_seq;

create table public.kota (
  id text primary key check (id ~ '^[a-z0-9_-]+$'),
  nama text not null unique,
  lat numeric(9,6) not null check (lat between -90 and 90),
  lng numeric(9,6) not null check (lng between -180 and 180)
);

create table public.zona_tarif (
  id smallint generated always as identity primary key,
  nama text not null unique check (length(trim(nama)) >= 3),
  max_km integer check (max_km is null or max_km > 0),
  per_kg integer not null check (per_kg >= 1000)
);
create unique index zona_tarif_max_km_uniq on public.zona_tarif (coalesce(max_km, 2147483647));

create table public.layanan (
  id text primary key check (id ~ '^[a-z_]+$'),
  nama text not null unique,
  singkat text not null,
  deskripsi text not null,
  pengali numeric(4,2) not null check (pengali > 0),
  min_berat numeric(6,2) not null default 1 check (min_berat > 0),
  max_zona smallint check (max_zona is null or max_zona > 0),
  estimasi jsonb not null default '{}'::jsonb check (jsonb_typeof(estimasi) = 'object'),
  aktif boolean not null default true
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'pelanggan' check (role in ('pelanggan','kurir','admin')),
  nama text not null check (length(trim(nama)) between 2 and 100),
  email text not null unique check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  hp text check (hp is null or hp ~ '^(08|\+628)[0-9]{8,11}$'),
  kota_id text references public.kota(id),
  tier text not null default 'Bronze' check (tier in ('Bronze','Silver','Gold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create index profiles_kota_idx on public.profiles (kota_id);

create table public.kurir (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete set null,
  kode text not null unique check (kode ~ '^PE-[0-9]{3}$'),
  nama text not null check (length(trim(nama)) >= 2),
  hp text not null check (hp ~ '^(08|\+628)[0-9]{8,11}$'),
  kendaraan text not null,
  plat text not null unique,
  hub text not null,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  resi text primary key check (resi ~ '^PEX[0-9]{10}$'),
  owner_id uuid not null references public.profiles(id),
  pengirim_nama text not null check (length(trim(pengirim_nama)) >= 2),
  pengirim_hp text not null check (pengirim_hp ~ '^(08|\+628)[0-9]{8,11}$'),
  pengirim_kota text not null references public.kota(id),
  pengirim_alamat text not null check (length(trim(pengirim_alamat)) >= 5),
  penerima_nama text not null check (length(trim(penerima_nama)) >= 2),
  penerima_hp text not null check (penerima_hp ~ '^(08|\+628)[0-9]{8,11}$'),
  penerima_kota text not null references public.kota(id),
  penerima_alamat text not null check (length(trim(penerima_alamat)) >= 5),
  isi text not null check (length(trim(isi)) >= 2),
  berat numeric(6,2) not null check (berat > 0 and berat <= 100),
  catatan text check (catatan is null or length(catatan) <= 300),
  layanan_id text not null references public.layanan(id),
  zona_id smallint not null references public.zona_tarif(id),
  jarak_km integer not null check (jarak_km >= 0),
  ongkir integer not null check (ongkir >= 0),
  bayar text not null default 'menunggu' check (bayar in ('lunas','menunggu','cod')),
  bayar_dikonfirmasi_at timestamptz,
  bayar_dikonfirmasi_oleh uuid references public.profiles(id),
  status text not null default 'menunggu_kurir'
    check (status in ('menunggu_kurir','diambil','dalam_perjalanan','sampai','gagal','dibatalkan')),
  kurir_id uuid references public.kurir(id),
  alasan_gagal text,
  diterima_oleh text,
  bukti_path text,
  dibuat timestamptz not null default now(),
  estimasi timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint orders_kurir_wajib check (status in ('menunggu_kurir','dibatalkan') or kurir_id is not null),
  constraint orders_gagal_alasan check (status <> 'gagal' or alasan_gagal is not null),
  constraint orders_sampai_penerima check (status <> 'sampai' or diterima_oleh is not null),
  constraint orders_estimasi check (estimasi >= dibuat)
);
create index orders_owner_idx on public.orders (owner_id, dibuat desc);
create index orders_kurir_idx on public.orders (kurir_id, status) where kurir_id is not null;
create index orders_status_idx on public.orders (status, dibuat desc);
create index orders_resi_prefix_idx on public.orders (resi text_pattern_ops);
create index orders_layanan_idx on public.orders (layanan_id);
create index orders_zona_idx on public.orders (zona_id);
create index orders_asal_idx on public.orders (pengirim_kota);
create index orders_tujuan_idx on public.orders (penerima_kota);
create index orders_konfirmasi_idx on public.orders (bayar_dikonfirmasi_oleh) where bayar_dikonfirmasi_oleh is not null;

create table public.tracking_events (
  id bigint generated always as identity primary key,
  resi text not null references public.orders(resi) on delete cascade,
  waktu timestamptz not null default now(),
  judul text not null check (length(trim(judul)) >= 3),
  lokasi text,
  deskripsi text,
  created_by uuid references public.profiles(id) on delete set null
);
create index tracking_events_resi_idx on public.tracking_events (resi, waktu desc);
create index tracking_events_created_by_idx on public.tracking_events (created_by) where created_by is not null;

create table public.lowongan (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  judul text not null check (length(trim(judul)) >= 3),
  divisi text not null,
  kategori text not null check (kategori in ('Kurir & Driver','Gudang & Hub','Customer Service','Teknologi & IT','Operasional')),
  tipe text not null check (tipe in ('Full Time','Part Time','Hybrid','Kontrak')),
  lokasi text not null,
  batas timestamptz not null,
  gaji text,
  urgent boolean not null default false,
  deskripsi text not null,
  tanggung text[] not null check (cardinality(tanggung) >= 1),
  kualifikasi text[] not null check (cardinality(kualifikasi) >= 1),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lamaran (
  id uuid primary key default gen_random_uuid(),
  lowongan_slug text not null references public.lowongan(slug),
  pemohon_id uuid references public.profiles(id) on delete set null,
  nama text not null check (length(trim(nama)) >= 2),
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  hp text not null check (hp ~ '^(08|\+628)[0-9]{8,11}$'),
  kota text not null check (length(trim(kota)) >= 2),
  pesan text check (pesan is null or length(pesan) <= 1000),
  cv_path text not null check (cv_path ~ '^cv/[A-Za-z0-9._/-]+\.pdf$'),
  cv_ukuran integer check (cv_ukuran is null or cv_ukuran between 1 and 2097152),
  status text not null default 'baru' check (status in ('baru','diproses','wawancara','diterima','ditolak')),
  created_at timestamptz not null default now(),
  unique (lowongan_slug, email)
);
create index lamaran_status_idx on public.lamaran (status, created_at desc);
create index lamaran_pemohon_idx on public.lamaran (pemohon_id) where pemohon_id is not null;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tipe text not null check (tipe in ('order_baru','kurir_ditugaskan','status_berubah','pembayaran','lamaran','sistem')),
  judul text not null,
  isi text not null,
  url text check (url is null or url ~ '^/'),
  resi text references public.orders(resi) on delete cascade,
  dibaca_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where dibaca_at is null;
create index notifications_resi_idx on public.notifications (resi) where resi is not null;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  resi text references public.orders(resi) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://'),
  p256dh text not null,
  auth text not null,
  user_agent text,
  aktif boolean not null default true,
  failed_count integer not null default 0,
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  constraint push_subscriptions_pemilik check (user_id is not null or resi is not null)
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id) where user_id is not null;
create index push_subscriptions_resi_idx on public.push_subscriptions (resi) where resi is not null;

create table public.notification_jobs (
  id bigint generated always as identity primary key,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  notification_id uuid references public.notifications(id) on delete set null,
  dedup_key text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','dead')),
  attempts smallint not null default 0 check (attempts >= 0),
  max_attempts smallint not null default 5 check (max_attempts between 1 and 10),
  next_run_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (subscription_id, dedup_key)
);
create index notification_jobs_due_idx on public.notification_jobs (next_run_at) where status in ('pending','failed');
create index notification_jobs_notif_idx on public.notification_jobs (notification_id) where notification_id is not null;
