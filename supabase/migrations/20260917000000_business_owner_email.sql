-- Mañana: crea el usuario elcactusantojeria@gmail.com en Supabase Auth.
-- Quedará owner activo; el owner anterior pasará a staff demo activo.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := 'staff';
  v_active boolean := false;
  v_business_email constant text := 'elcactusantojeria@gmail.com';
begin
  if lower(coalesce(new.email, '')) = v_business_email then
    v_role := 'owner';
    v_active := true;

    update public.profiles
    set
      role = 'staff',
      is_active = true
    where role = 'owner';
  elsif not exists (select 1 from public.profiles where role = 'owner') then
    v_role := 'owner';
    v_active := true;
  end if;

  insert into public.profiles (id, email, role, is_active)
  values (new.id, coalesce(new.email, ''), v_role, v_active);

  return new;
end;
$$;
