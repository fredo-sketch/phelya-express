-- Pisahkan policy admin "for all" agar tidak tumpang tindih dengan policy SELECT publik (performa RLS)
drop policy kota_admin on public.kota;
drop policy zona_admin on public.zona_tarif;
drop policy layanan_admin on public.layanan;
drop policy lowongan_admin on public.lowongan;
drop policy kurir_admin_write on public.kurir;

create policy kota_admin_ins on public.kota for insert to authenticated with check (public.is_admin());
create policy kota_admin_upd on public.kota for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy kota_admin_del on public.kota for delete to authenticated using (public.is_admin());

create policy zona_admin_ins on public.zona_tarif for insert to authenticated with check (public.is_admin());
create policy zona_admin_upd on public.zona_tarif for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy zona_admin_del on public.zona_tarif for delete to authenticated using (public.is_admin());

create policy layanan_admin_ins on public.layanan for insert to authenticated with check (public.is_admin());
create policy layanan_admin_upd on public.layanan for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy layanan_admin_del on public.layanan for delete to authenticated using (public.is_admin());

create policy lowongan_admin_ins on public.lowongan for insert to authenticated with check (public.is_admin());
create policy lowongan_admin_upd on public.lowongan for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy lowongan_admin_del on public.lowongan for delete to authenticated using (public.is_admin());

create policy kurir_admin_ins on public.kurir for insert to authenticated with check (public.is_admin());
create policy kurir_admin_upd on public.kurir for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy kurir_admin_del on public.kurir for delete to authenticated using (public.is_admin());
