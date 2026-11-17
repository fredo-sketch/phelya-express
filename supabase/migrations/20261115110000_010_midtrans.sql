-- 010: Midtrans (Snap + webhook).
--  midtrans_mulai        : pemilik/admin memulai pembayaran. Menyiapkan order_id Midtrans, memakai ulang token yang masih berlaku.
--  midtrans_simpan_token : menyimpan token Snap hasil panggilan server ke Midtrans.
--  midtrans_terapkan     : HANYA service_role (webhook terverifikasi). Idempotent, memeriksa nominal, tidak pernah menurunkan status lunas.

create or replace function public.midtrans_mulai(p_resi text)
returns table (order_id text, token text, total integer, ongkir integer, packing_biaya integer, jemput_biaya integer,
               diskon integer, nama text, hp text, email text)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid()); v_o public.orders; v_resi text := upper(trim(p_resi)); v_oid text; v_email text;
begin
  if v_uid is null then raise exception 'Anda harus login.' using errcode = '28000'; end if;
  select * into v_o from public.orders where resi = v_resi for update;
  if not found then raise exception 'Pesanan tidak ditemukan.' using errcode = 'P0002'; end if;
  if not (v_o.owner_id = v_uid or public.is_admin()) then
    raise exception 'Anda tidak berhak membayar pesanan ini.' using errcode = '42501'; end if;
  if v_o.bayar = 'lunas' then raise exception 'Pesanan ini sudah lunas.' using errcode = '23514'; end if;
  if v_o.bayar = 'cod' then raise exception 'Pesanan ini dibayar di tempat (COD).' using errcode = '23514'; end if;
  if v_o.status = 'dibatalkan' then raise exception 'Pesanan sudah dibatalkan.' using errcode = '23514'; end if;
  if v_o.total <= 0 then raise exception 'Total pembayaran tidak valid.' using errcode = '23514'; end if;

  if v_o.midtrans_token is not null and v_o.midtrans_order_id is not null and coalesce(v_o.midtrans_status, 'pending') = 'pending' then
    v_oid := v_o.midtrans_order_id;                 -- token lama masih berlaku: pakai ulang
  else
    v_oid := v_resi || '-' || (v_o.midtrans_attempt + 1);
    update public.orders set midtrans_attempt = midtrans_attempt + 1, midtrans_order_id = v_oid, midtrans_token = null,
           midtrans_status = null, bayar_metode = 'midtrans'
     where resi = v_resi returning * into v_o;
  end if;
  select p.email into v_email from public.profiles p where p.id = v_o.owner_id;
  return query select v_oid, v_o.midtrans_token, v_o.total, v_o.ongkir, v_o.packing_biaya, v_o.jemput_biaya, v_o.diskon,
                      v_o.pengirim_nama, v_o.pengirim_hp, v_email;
end $$;

create or replace function public.midtrans_simpan_token(p_resi text, p_order_id text, p_token text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_o public.orders; v_resi text := upper(trim(p_resi));
begin
  if v_uid is null then raise exception 'Anda harus login.' using errcode = '28000'; end if;
  select * into v_o from public.orders where resi = v_resi for update;
  if not found then raise exception 'Pesanan tidak ditemukan.' using errcode = 'P0002'; end if;
  if not (v_o.owner_id = v_uid or public.is_admin()) then
    raise exception 'Anda tidak berhak mengubah pembayaran pesanan ini.' using errcode = '42501'; end if;
  if v_o.midtrans_order_id is distinct from p_order_id then
    raise exception 'Order ID pembayaran tidak cocok.' using errcode = '23514'; end if;
  update public.orders set midtrans_token = p_token where resi = v_resi;
end $$;

create or replace function public.midtrans_terapkan(
  p_order_id text, p_status text, p_fraud text, p_payment_type text, p_gross numeric, p_raw jsonb)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_resi text := substring(p_order_id from '^(PEX[0-9]{10})-[0-9]+$');
  v_o public.orders; v_baru integer; v_lunas boolean;
begin
  if v_resi is null then return 'order_id_tidak_valid'; end if;
  select * into v_o from public.orders where resi = v_resi for update;
  if not found then return 'order_tidak_ditemukan'; end if;

  -- Idempotensi: notifikasi yang sama (order_id + status) hanya diproses sekali
  insert into public.midtrans_events (midtrans_order_id, transaction_status, fraud_status, payment_type, gross_amount, raw)
  values (p_order_id, p_status, p_fraud, p_payment_type, p_gross, p_raw)
  on conflict (midtrans_order_id, transaction_status) do nothing;
  get diagnostics v_baru = row_count;
  if v_baru = 0 then return 'duplikat'; end if;

  if p_gross is distinct from v_o.total::numeric then return 'nominal_tidak_cocok'; end if;

  v_lunas := p_status = 'settlement' or (p_status = 'capture' and coalesce(p_fraud, 'accept') = 'accept');
  if v_lunas then
    if v_o.bayar = 'lunas' then return 'sudah_lunas'; end if;
    update public.orders set bayar = 'lunas', bayar_metode = 'midtrans', bayar_dikonfirmasi_at = now(), midtrans_status = p_status
     where resi = v_resi;
    if v_o.owner_id is not null then
      perform public.notify_user(v_o.owner_id, 'pembayaran', 'Pembayaran diterima',
          'Pembayaran paket ' || v_resi || ' via Midtrans berhasil.', '/dashboard/pesanan/' || v_resi, v_resi, 'bayar:' || v_resi);
    end if;
    perform public.notify_admins('pembayaran', 'Pembayaran Midtrans ' || v_resi,
        'Pesanan ' || v_resi || ' telah lunas via Midtrans.', '/admin/pembayaran', v_resi, 'bayar-admin:' || v_resi);
    return 'lunas';
  end if;

  if v_o.bayar <> 'lunas' then
    update public.orders set midtrans_status = p_status,
           midtrans_token = case when p_status in ('expire','cancel','deny','failure') then null else midtrans_token end
     where resi = v_resi;
  end if;
  return 'dicatat';
end $$;

revoke execute on function public.midtrans_mulai(text), public.midtrans_simpan_token(text,text,text),
  public.midtrans_terapkan(text,text,text,text,numeric,jsonb) from public, anon, authenticated;
grant execute on function public.midtrans_mulai(text), public.midtrans_simpan_token(text,text,text) to authenticated;
grant execute on function public.midtrans_terapkan(text,text,text,text,numeric,jsonb) to service_role;
