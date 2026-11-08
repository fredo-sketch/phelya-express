-- 005: kebutuhan integrasi frontend
-- 1) HP ikut tersimpan saat daftar (divalidasi, bukan dipercaya mentah)
-- 2) Penyamaran data pribadi untuk pelacakan publik dilakukan di database
-- 3) Tamu dapat melamar kerja tanpa service_role key di server web:
--    unggah CV dibatasi policy (nama berkas, ukuran, tipe), insert lamaran lewat RPC tervalidasi

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_hp text := regexp_replace(coalesce(new.raw_user_meta_data ->> 'hp', ''), '[\s-]', '', 'g');
begin
  insert into public.profiles (id, role, nama, email, hp)
  values (new.id, 'pelanggan',
          coalesce(nullif(trim(new.raw_user_meta_data ->> 'nama'), ''), split_part(new.email, '@', 1)),
          lower(new.email),
          case when v_hp ~ '^(08|\+628)[0-9]{8,11}$' then v_hp end);
  return new;
end $$;

create or replace function public.samarkan_nama(p text) returns text
language sql immutable set search_path = '' as $$
  select coalesce(string_agg(case when w.i = 1 then w.k
                                  else left(w.k, 1) || repeat('•', greatest(length(w.k) - 1, 1)) end, ' ' order by w.i), '')
    from unnest(string_to_array(trim(coalesce(p, '')), ' ')) with ordinality as w(k, i)
   where w.k <> ''
$$;

create or replace function public.samarkan_hp(p text) returns text
language sql immutable set search_path = '' as $$
  select case when p is null or length(p) < 8 then p else left(p, 4) || '••••' || right(p, 3) end
$$;

create or replace function public.lacak_resi(p_resi text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'resi', o.resi, 'status', o.status, 'status_label', public.label_status(o.status),
    'layanan_id', o.layanan_id, 'layanan', l.nama, 'berat', o.berat,
    'asal_id', o.pengirim_kota, 'tujuan_id', o.penerima_kota,
    'asal', ka.nama, 'tujuan', kt.nama, 'dibuat', o.dibuat, 'estimasi', o.estimasi,
    'pengirim_samar', public.samarkan_nama(o.pengirim_nama),
    'penerima_samar', public.samarkan_nama(o.penerima_nama),
    'hp_penerima_samar', public.samarkan_hp(o.penerima_hp),
    'diterima_oleh', o.diterima_oleh, 'alasan_gagal', o.alasan_gagal,
    'kurir', case when k.id is null then null else jsonb_build_object('nama', k.nama, 'kode', k.kode) end,
    'timeline', coalesce((select jsonb_agg(jsonb_build_object('waktu', e.waktu, 'judul', e.judul,
                 'lokasi', e.lokasi, 'deskripsi', e.deskripsi) order by e.waktu desc, e.id desc)
               from public.tracking_events e where e.resi = o.resi), '[]'::jsonb))
  from public.orders o
  join public.layanan l on l.id = o.layanan_id
  join public.kota ka on ka.id = o.pengirim_kota
  join public.kota kt on kt.id = o.penerima_kota
  left join public.kurir k on k.id = o.kurir_id
  where o.resi = upper(trim(p_resi))
$$;

-- Unggah CV: hanya nama berkas bentuk cv/<uuid>.pdf (bucket sudah membatasi 2 MB dan application/pdf)
create policy cv_public_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'cv' and name ~ '^cv/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$');

create or replace function public.kirim_lamaran(
  p_slug text, p_nama text, p_email text, p_hp text, p_kota text, p_pesan text,
  p_cv_path text, p_cv_ukuran integer)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_hp text := regexp_replace(coalesce(p_hp, ''), '[\s-]', '', 'g');
begin
  if not exists (select 1 from public.lowongan where slug = p_slug and aktif and batas > now()) then
    raise exception 'Lowongan tidak tersedia atau sudah ditutup.' using errcode = '22023'; end if;
  if p_cv_path is null or not exists (select 1 from storage.objects where bucket_id = 'cv' and name = p_cv_path) then
    raise exception 'CV belum berhasil diunggah.' using errcode = '22023'; end if;
  insert into public.lamaran (lowongan_slug, pemohon_id, nama, email, hp, kota, pesan, cv_path, cv_ukuran)
  values (p_slug, (select auth.uid()), trim(p_nama), lower(trim(p_email)), v_hp, trim(p_kota),
          nullif(trim(p_pesan), ''), p_cv_path, p_cv_ukuran)
  returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'Kamu sudah melamar posisi ini dengan email yang sama.' using errcode = '23505';
end $$;

revoke execute on function public.kirim_lamaran(text,text,text,text,text,text,text,integer) from public;
revoke execute on function public.samarkan_nama(text), public.samarkan_hp(text) from public;
grant execute on function public.kirim_lamaran(text,text,text,text,text,text,text,integer) to anon, authenticated;
grant execute on function public.samarkan_nama(text), public.samarkan_hp(text) to anon, authenticated;
