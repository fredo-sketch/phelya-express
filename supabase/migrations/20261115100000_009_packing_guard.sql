-- Pilihan packing "tidak" adalah default sistem: tidak boleh dihapus, dinonaktifkan, atau diberi harga.
create or replace function public.trg_packing_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.id = 'tidak' and (tg_op = 'DELETE' or new.aktif is not true or new.harga <> 0 or new.id <> 'tidak') then
    raise exception 'Pilihan packing "Tidak" adalah bawaan sistem dan tidak dapat dihapus, dinonaktifkan, atau diberi harga.' using errcode = '23514';
  end if;
  return coalesce(new, old);
end $$;
create trigger packing_guard before update or delete on public.packing_options
  for each row execute function public.trg_packing_guard();
