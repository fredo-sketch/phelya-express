-- 011: perbaikan midtrans_terapkan. Nominal diperiksa SEBELUM idempotensi: notifikasi bernominal salah
-- dicatat terpisah (audit) dan tidak boleh menghabiskan kunci idempotensi notifikasi yang sah.
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

  if p_gross is distinct from v_o.total::numeric then
    insert into public.midtrans_events (midtrans_order_id, transaction_status, fraud_status, payment_type, gross_amount, raw)
    values (p_order_id, 'nominal_salah:' || p_status, p_fraud, p_payment_type, p_gross, p_raw)
    on conflict (midtrans_order_id, transaction_status) do nothing;
    return 'nominal_tidak_cocok';
  end if;

  insert into public.midtrans_events (midtrans_order_id, transaction_status, fraud_status, payment_type, gross_amount, raw)
  values (p_order_id, p_status, p_fraud, p_payment_type, p_gross, p_raw)
  on conflict (midtrans_order_id, transaction_status) do nothing;
  get diagnostics v_baru = row_count;
  if v_baru = 0 then return 'duplikat'; end if;

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

revoke execute on function public.midtrans_terapkan(text,text,text,text,numeric,jsonb) from public, anon, authenticated;
grant execute on function public.midtrans_terapkan(text,text,text,text,numeric,jsonb) to service_role;
