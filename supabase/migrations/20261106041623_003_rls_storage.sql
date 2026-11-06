-- ===== Hak tabel: tolak semua dulu, lalu buka seperlunya =====
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.kota, public.zona_tarif, public.layanan, public.lowongan to anon, authenticated;
grant select on public.profiles, public.kurir, public.orders, public.tracking_events,
                public.notifications, public.push_subscriptions, public.lamaran to authenticated;
grant insert, update, delete on public.kota, public.zona_tarif, public.layanan, public.lowongan, public.kurir to authenticated;
grant update (nama, hp, kota_id) on public.profiles to authenticated;   -- role & tier TIDAK bisa diubah dari client
grant update (status) on public.lamaran to authenticated;
grant update (dibaca_at) on public.notifications to authenticated;
grant insert, delete on public.push_subscriptions to authenticated;

alter table public.kota enable row level security;
alter table public.zona_tarif enable row level security;
alter table public.layanan enable row level security;
alter table public.profiles enable row level security;
alter table public.kurir enable row level security;
alter table public.orders enable row level security;
alter table public.tracking_events enable row level security;
alter table public.lowongan enable row level security;
alter table public.lamaran enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_jobs enable row level security;  -- tanpa policy: hanya service_role

-- Data referensi: publik baca, admin kelola
create policy kota_read on public.kota for select to anon, authenticated using (true);
create policy kota_admin on public.kota for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy zona_read on public.zona_tarif for select to anon, authenticated using (true);
create policy zona_admin on public.zona_tarif for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy layanan_read on public.layanan for select to anon, authenticated using (true);
create policy layanan_admin on public.layanan for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy lowongan_read on public.lowongan for select to anon, authenticated using (aktif or public.is_admin());
create policy lowongan_admin on public.lowongan for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Profil
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Kurir: admin penuh; kurir baca diri sendiri; pelanggan baca kurir pesanannya
create policy kurir_select on public.kurir for select to authenticated using (
  public.is_admin() or user_id = (select auth.uid())
  or exists (select 1 from public.orders o where o.kurir_id = kurir.id and o.owner_id = (select auth.uid())));
create policy kurir_admin_write on public.kurir for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Order: baca sesuai kepemilikan/penugasan. Tulis HANYA lewat fungsi (buat_order, ubah_status_order, dst.)
create policy orders_select on public.orders for select to authenticated using (
  owner_id = (select auth.uid()) or public.is_admin()
  or (kurir_id is not null and kurir_id = public.my_kurir_id()));
create policy events_select on public.tracking_events for select to authenticated
  using (exists (select 1 from public.orders o where o.resi = tracking_events.resi));

-- Lamaran: hanya admin (unggah CV dan insert dilakukan route handler dengan service_role)
create policy lamaran_admin_read on public.lamaran for select to authenticated using (public.is_admin());
create policy lamaran_admin_update on public.lamaran for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Notifikasi & push subscription: milik sendiri
create policy notif_select on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy notif_update on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy push_select on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy push_insert on public.push_subscriptions for insert to authenticated with check (user_id = (select auth.uid()));
create policy push_delete on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

-- ===== Storage: semua bucket privat =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('bukti', 'bukti', false, 2097152, array['image/jpeg','image/png','image/webp']),
  ('cv', 'cv', false, 2097152, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Foto bukti: path "<resi>/<file>". Baca: siapa pun yang boleh melihat ordernya. Unggah: kurir penugasan saat dalam perjalanan.
create policy bukti_read on storage.objects for select to authenticated
  using (bucket_id = 'bukti' and exists (select 1 from public.orders o where o.resi = (storage.foldername(name))[1]));
create policy bukti_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'bukti' and exists (select 1 from public.orders o
    where o.resi = (storage.foldername(name))[1] and o.kurir_id = public.my_kurir_id() and o.status = 'dalam_perjalanan'));
-- CV: hanya admin yang boleh membaca (signed URL); unggah lewat service_role di server
create policy cv_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'cv' and public.is_admin());
