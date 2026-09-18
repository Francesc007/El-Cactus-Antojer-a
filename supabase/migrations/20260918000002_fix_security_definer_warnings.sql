-- Clear Advisor warnings:
-- 1) signed-in users executing SECURITY DEFINER functions
-- 2) keep RLS working without a definer helper on profiles

create or replace function public.is_staff()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('owner', 'staff')
      and is_active = true
  );
$$;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
using (id = auth.uid());

drop function if exists public.add_stock_movement_safe(uuid, public.stock_movement_type, numeric, date, text);

create function public.add_stock_movement_safe(
  p_product_id uuid,
  p_type public.stock_movement_type,
  p_quantity numeric,
  p_date date,
  p_note text,
  p_created_by uuid
)
returns public.stock_movements
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_stock numeric;
  v_row public.stock_movements;
begin
  if p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  if coalesce(auth.role(), '') is distinct from 'service_role' then
    raise exception 'FORBIDDEN';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_product_id::text));

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  select coalesce(sum(
    case when type = 'in' then quantity else -quantity end
  ), 0) into v_stock
  from public.stock_movements
  where product_id = p_product_id;

  if p_type = 'out' and v_stock < p_quantity then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  insert into public.stock_movements (
    product_id,
    type,
    quantity,
    date,
    note,
    created_by
  )
  values (
    p_product_id,
    p_type,
    p_quantity,
    p_date,
    nullif(trim(p_note), ''),
    p_created_by
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.add_stock_movement_safe(uuid, public.stock_movement_type, numeric, date, text, uuid)
  from public, anon, authenticated;
grant execute on function public.add_stock_movement_safe(uuid, public.stock_movement_type, numeric, date, text, uuid)
  to service_role;
