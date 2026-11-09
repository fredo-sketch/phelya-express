-- 006: pendaftaran Web Push lewat RPC tervalidasi
-- Satu perangkat (endpoint) hanya punya satu langganan. Login ulang dengan akun lain di perangkat yang sama
-- memindahkan langganan ke akun tersebut, dan tamu dapat berlangganan satu resi tanpa akun.

create or replace function public.daftar_push(p_endpoint text, p_p256dh text, p_auth text, p_ua text default null, p_resi text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_resi text := nullif(upper(trim(coalesce(p_resi, ''))), '');
begin
  if p_endpoint is null or p_endpoint !~ '^https://' or length(p_endpoint) > 1000 then
    raise exception 'Endpoint push tidak valid.' using errcode = '22023'; end if;
  if p_p256dh is null or length(p_p256dh) not between 20 and 200 or p_auth is null or length(p_auth) not between 8 and 100 then
    raise exception 'Kunci push tidak valid.' using errcode = '22023'; end if;

  if v_resi is null then
    -- langganan akun: wajib login; mengambil alih langganan tamu/akun lain pada perangkat yang sama
    if v_uid is null then raise exception 'Silakan masuk terlebih dahulu.' using errcode = '28000'; end if;
    insert into public.push_subscriptions (user_id, resi, endpoint, p256dh, auth, user_agent)
    values (v_uid, null, p_endpoint, p_p256dh, p_auth, left(p_ua, 300))
    on conflict (endpoint) do update
      set user_id = v_uid, resi = null, p256dh = excluded.p256dh, auth = excluded.auth,
          user_agent = excluded.user_agent, aktif = true, failed_count = 0;
  else
    -- langganan resi (tamu): resi harus ada; tidak menimpa langganan akun yang sudah ada
    if not exists (select 1 from public.orders where resi = v_resi) then
      raise exception 'Resi tidak ditemukan.' using errcode = 'P0002'; end if;
    insert into public.push_subscriptions (user_id, resi, endpoint, p256dh, auth, user_agent)
    values (null, v_resi, p_endpoint, p_p256dh, p_auth, left(p_ua, 300))
    on conflict (endpoint) do update
      set resi = excluded.resi, p256dh = excluded.p256dh, auth = excluded.auth,
          user_agent = excluded.user_agent, aktif = true, failed_count = 0
      where public.push_subscriptions.user_id is null;
  end if;
end $$;

create or replace function public.batal_push(p_endpoint text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  delete from public.push_subscriptions
   where endpoint = p_endpoint and (user_id = v_uid or user_id is null);
end $$;

revoke execute on function public.daftar_push(text,text,text,text,text), public.batal_push(text) from public;
grant execute on function public.daftar_push(text,text,text,text,text), public.batal_push(text) to anon, authenticated;
