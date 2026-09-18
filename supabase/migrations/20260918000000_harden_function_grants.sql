-- Advisor: Function Search Path Mutable + EXECUTE granted to PUBLIC by default.

alter function public.set_updated_at()
  set search_path = public, pg_temp;

alter function public.time_to_minutes(time)
  set search_path = public, pg_temp;

alter function public.ranges_overlap(integer, integer, integer, integer)
  set search_path = public, pg_temp;

alter function public.handle_new_user()
  set search_path = public, pg_temp;

alter function public.is_staff()
  set search_path = public, pg_temp;

alter function public.create_reservation_safe(text, text, integer, date, time, boolean)
  set search_path = public, pg_temp;

alter function public.add_stock_movement_safe(uuid, public.stock_movement_type, numeric, date, text)
  set search_path = public, pg_temp;

alter function public.consume_rate_limit(text, integer, integer)
  set search_path = public, pg_temp;

-- Triggers on public tables: authenticated/service_role must keep EXECUTE.
revoke all on function public.set_updated_at() from public, anon;
grant execute on function public.set_updated_at() to authenticated, service_role;

-- Auth trigger only; not callable from PostgREST.
revoke all on function public.handle_new_user() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant execute on function public.handle_new_user() to supabase_auth_admin;
  end if;
end
$$;

-- RLS policies for authenticated staff.
revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- Helpers used only inside SECURITY DEFINER functions.
revoke all on function public.time_to_minutes(time) from public, anon, authenticated;
revoke all on function public.ranges_overlap(integer, integer, integer, integer)
  from public, anon, authenticated;

-- Public reservation flow goes through the Next.js API with service_role.
-- Returning the created row does not expose other customers.
revoke all on function public.create_reservation_safe(text, text, integer, date, time, boolean)
  from public, anon, authenticated;
grant execute on function public.create_reservation_safe(text, text, integer, date, time, boolean)
  to service_role;

-- Inventory movements: staff session only. is_staff() already rejects others.
revoke all on function public.add_stock_movement_safe(uuid, public.stock_movement_type, numeric, date, text)
  from public, anon;
grant execute on function public.add_stock_movement_safe(uuid, public.stock_movement_type, numeric, date, text)
  to authenticated;

-- Rate limit is server-side only; anon must not consume arbitrary keys.
revoke all on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer)
  to service_role;
