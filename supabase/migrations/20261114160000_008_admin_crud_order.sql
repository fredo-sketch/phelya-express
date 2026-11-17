-- 008: CRUD order oleh admin. Data inti (harga, rute, berat, layanan, pemilik) TIDAK bisa diubah
-- (dijaga trigger orders_guard); yang bisa diubah hanya kontak, alamat, isi paket, dan catatan.
-- Hapus hanya untuk pesanan yang sudah dibatalkan, supaya riwayat transaksi aktif tidak hilang.

create or replace function public.admin_ubah_order(
  p_resi text, p_pengirim_nama text, p_pengirim_hp text, p_pengirim_alamat text,
  p_penerima_nama text, p_penerima_hp text, p_penerima_alamat text, p_isi text, p_catatan text)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid()); v_o public.orders; v_resi text := upper(trim(p_resi));
  v_php text := regexp_replace(coalesce(p_pengirim_hp, ''), '[\s-]', '', 'g');
  v_rhp text := regexp_replace(coalesce(p_penerima_hp, ''), '[\s-]', '', 'g');
begin
  if not public.is_admin() then raise exception 'Hanya admin yang dapat mengubah pesanan.' using errcode = '42501'; end if;
  select * into v_o from public.orders where resi = v_resi for update;
  if not found then raise exception 'Pesanan tidak ditemukan.' using errcode = 'P0002'; end if;
  if v_o.status in ('sampai','dibatalkan') then
    raise exception 'Pesanan yang sudah selesai atau dibatalkan tidak dapat diubah.' using errcode = '23514'; end if;
  if length(trim(coalesce(p_pengirim_nama, ''))) < 2 or length(trim(coalesce(p_penerima_nama, ''))) < 2 then
    raise exception 'Nama pengirim dan penerima minimal 2 karakter.' using errcode = '22023'; end if;
  if v_php !~ '^(08|\+628)[0-9]{8,11}$' or v_rhp !~ '^(08|\+628)[0-9]{8,11}$' then
    raise exception 'Nomor HP pengirim atau penerima tidak valid.' using errcode = '22023'; end if;
  if length(trim(coalesce(p_pengirim_alamat, ''))) < 5 or length(trim(coalesce(p_penerima_alamat, ''))) < 5 then
    raise exception 'Alamat pengirim dan penerima minimal 5 karakter.' using errcode = '22023'; end if;
  if length(trim(coalesce(p_isi, ''))) < 2 then raise exception 'Isi paket wajib diisi.' using errcode = '22023'; end if;
  if length(coalesce(p_catatan, '')) > 300 then raise exception 'Catatan maksimal 300 karakter.' using errcode = '22023'; end if;

  update public.orders set
    pengirim_nama = trim(p_pengirim_nama), pengirim_hp = v_php, pengirim_alamat = trim(p_pengirim_alamat),
    penerima_nama = trim(p_penerima_nama), penerima_hp = v_rhp, penerima_alamat = trim(p_penerima_alamat),
    isi = trim(p_isi), catatan = nullif(trim(p_catatan), '')
   where resi = v_resi returning * into v_o;
  insert into public.tracking_events (resi, judul, lokasi, deskripsi, created_by)
  values (v_resi, 'Data pesanan diperbarui', '-', 'Admin memperbarui data kontak atau isi paket.', v_uid);
  return v_o;
end $$;

create or replace function public.admin_hapus_order(p_resi text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_o public.orders; v_resi text := upper(trim(p_resi));
begin
  if not public.is_admin() then raise exception 'Hanya admin yang dapat menghapus pesanan.' using errcode = '42501'; end if;
  select * into v_o from public.orders where resi = v_resi for update;
  if not found then raise exception 'Pesanan tidak ditemukan.' using errcode = 'P0002'; end if;
  if v_o.status <> 'dibatalkan' then
    raise exception 'Hanya pesanan yang sudah dibatalkan yang dapat dihapus. Batalkan pesanan terlebih dahulu.' using errcode = '23514'; end if;
  delete from public.orders where resi = v_resi;
end $$;

revoke execute on function public.admin_ubah_order(text,text,text,text,text,text,text,text,text), public.admin_hapus_order(text) from public, anon, authenticated;
grant execute on function public.admin_ubah_order(text,text,text,text,text,text,text,text,text), public.admin_hapus_order(text) to authenticated;
