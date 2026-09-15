-- El Cactus Antojería — schema inicial de producción

create extension if not exists "pgcrypto";

create type public.user_role as enum ('owner', 'staff');
create type public.reservation_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);
create type public.stock_movement_type as enum ('in', 'out');
create type public.notification_channel as enum ('wa_me', 'whatsapp_cloud');
create type public.notification_status as enum (
  'pending',
  'sent',
  'failed',
  'skipped'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'staff',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_settings (
  id smallint primary key default 1 check (id = 1),
  total_capacity integer not null check (total_capacity > 0),
  default_duration_minutes integer not null check (default_duration_minutes > 0),
  updated_at timestamptz not null default now()
);

create table public.operating_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  open_time time not null,
  close_time time not null,
  label text not null,
  is_closed boolean not null default false,
  unique (day_of_week)
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  party_size integer not null check (party_size > 0),
  date date not null,
  time time not null,
  duration_minutes integer not null check (duration_minutes > 0),
  status public.reservation_status not null default 'confirmed',
  privacy_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reservation_status_history (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  from_status public.reservation_status,
  to_status public.reservation_status not null,
  changed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null,
  min_stock numeric(12, 2) not null check (min_stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  type public.stock_movement_type not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  date date not null,
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  channel public.notification_channel not null,
  payload jsonb not null,
  status public.notification_status not null default 'pending',
  related_reservation_id uuid references public.reservations (id) on delete set null,
  related_product_id uuid references public.products (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_attempts (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid not null references public.notification_outbox (id) on delete cascade,
  provider text not null,
  success boolean not null,
  response jsonb,
  error text,
  created_at timestamptz not null default now()
);

create table public.rate_limits (
  key text primary key,
  count integer not null check (count >= 0),
  window_start timestamptz not null
);

create index reservations_date_idx on public.reservations (date, time);
create index reservations_status_idx on public.reservations (status);
create index blocked_slots_date_idx on public.blocked_slots (date);
create index stock_movements_product_idx on public.stock_movements (product_id, created_at desc);
create index stock_movements_date_idx on public.stock_movements (date);
create index notification_outbox_status_idx on public.notification_outbox (status, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger reservations_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

create trigger products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger business_settings_updated_at
before update on public.business_settings
for each row execute function public.set_updated_at();

create trigger notification_outbox_updated_at
before update on public.notification_outbox
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := 'staff';
  v_active boolean := false;
begin
  if not exists (select 1 from public.profiles where role = 'owner') then
    v_role := 'owner';
    v_active := true;
  end if;

  insert into public.profiles (id, email, role, is_active)
  values (new.id, coalesce(new.email, ''), v_role, v_active);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('owner', 'staff')
      and is_active = true
  );
$$;

create or replace function public.time_to_minutes(t time)
returns integer
language sql
immutable
as $$
  select (extract(hour from t)::int * 60) + extract(minute from t)::int;
$$;

create or replace function public.ranges_overlap(
  start_a integer,
  end_a integer,
  start_b integer,
  end_b integer
)
returns boolean
language sql
immutable
as $$
  select start_a < end_b and start_b < end_a;
$$;

create or replace view public.product_stock as
select
  p.id,
  p.name,
  p.unit,
  p.min_stock,
  p.created_at,
  p.updated_at,
  coalesce(sum(
    case
      when m.type = 'in' then m.quantity
      when m.type = 'out' then -m.quantity
      else 0
    end
  ), 0)::numeric(12, 2) as stock
from public.products p
left join public.stock_movements m on m.product_id = p.id
group by p.id;

create or replace function public.create_reservation_safe(
  p_customer_name text,
  p_phone text,
  p_party_size integer,
  p_date date,
  p_time time,
  p_privacy_consent boolean
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.business_settings;
  v_hours public.operating_hours;
  v_slot_start integer;
  v_slot_end integer;
  v_open integer;
  v_close integer;
  v_occupancy integer;
  v_blocked boolean;
  v_row public.reservations;
begin
  if p_privacy_consent is not true then
    raise exception 'PRIVACY_CONSENT_REQUIRED';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_date::text));

  select * into v_settings from public.business_settings where id = 1;
  if not found then
    raise exception 'SETTINGS_MISSING';
  end if;

  select * into v_hours
  from public.operating_hours
  where day_of_week = extract(dow from p_date)::smallint;

  if not found or v_hours.is_closed then
    raise exception 'CLOSED_DAY';
  end if;

  v_slot_start := public.time_to_minutes(p_time);
  v_slot_end := v_slot_start + v_settings.default_duration_minutes;
  v_open := public.time_to_minutes(v_hours.open_time);
  v_close := public.time_to_minutes(v_hours.close_time);

  if v_slot_start < v_open or v_slot_start >= v_close then
    raise exception 'OUTSIDE_HOURS';
  end if;

  select exists (
    select 1
    from public.blocked_slots b
    where b.date = p_date
      and public.ranges_overlap(
        v_slot_start,
        v_slot_end,
        public.time_to_minutes(b.start_time),
        public.time_to_minutes(b.end_time)
      )
  ) into v_blocked;

  if v_blocked then
    raise exception 'SLOT_BLOCKED';
  end if;

  select coalesce(sum(r.party_size), 0) into v_occupancy
  from public.reservations r
  where r.date = p_date
    and r.status in ('pending', 'confirmed', 'completed')
    and public.ranges_overlap(
      v_slot_start,
      v_slot_end,
      public.time_to_minutes(r.time),
      public.time_to_minutes(r.time) + r.duration_minutes
    );

  if v_settings.total_capacity - v_occupancy < p_party_size then
    raise exception 'NO_CAPACITY';
  end if;

  insert into public.reservations (
    customer_name,
    phone,
    party_size,
    date,
    time,
    duration_minutes,
    status,
    privacy_consent
  )
  values (
    p_customer_name,
    p_phone,
    p_party_size,
    p_date,
    p_time,
    v_settings.default_duration_minutes,
    'confirmed',
    true
  )
  returning * into v_row;

  insert into public.reservation_status_history (
    reservation_id,
    from_status,
    to_status,
    changed_by
  )
  values (v_row.id, null, v_row.status, auth.uid());

  return v_row;
end;
$$;

create or replace function public.add_stock_movement_safe(
  p_product_id uuid,
  p_type public.stock_movement_type,
  p_quantity numeric,
  p_date date,
  p_note text
)
returns public.stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock numeric;
  v_row public.stock_movements;
begin
  if p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  if not public.is_staff() then
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
    auth.uid()
  )
  returning * into v_row;

  return v_row;
end;
$$;

alter table public.profiles enable row level security;
alter table public.business_settings enable row level security;
alter table public.operating_hours enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_status_history enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.notification_attempts enable row level security;
alter table public.rate_limits enable row level security;

create policy profiles_select_own
on public.profiles for select
using (id = auth.uid() or public.is_staff());

create policy profiles_update_own
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy staff_read_settings
on public.business_settings for select
using (public.is_staff());

create policy staff_update_settings
on public.business_settings for update
using (public.is_staff())
with check (public.is_staff());

create policy staff_read_hours
on public.operating_hours for select
using (public.is_staff());

create policy staff_write_hours
on public.operating_hours for all
using (public.is_staff())
with check (public.is_staff());

create policy staff_all_reservations
on public.reservations for all
using (public.is_staff())
with check (public.is_staff());

create policy staff_all_status_history
on public.reservation_status_history for all
using (public.is_staff())
with check (public.is_staff());

create policy staff_all_blocked_slots
on public.blocked_slots for all
using (public.is_staff())
with check (public.is_staff());

create policy staff_all_products
on public.products for all
using (public.is_staff())
with check (public.is_staff());

create policy staff_all_movements
on public.stock_movements for all
using (public.is_staff())
with check (public.is_staff());

create policy staff_read_notifications
on public.notification_outbox for select
using (public.is_staff());

create policy staff_read_attempts
on public.notification_attempts for select
using (public.is_staff());

create or replace function public.consume_rate_limit(
  p_key text,
  p_max integer,
  p_window_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.rate_limits;
  v_count integer;
  v_window_start timestamptz;
  v_retry integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));

  select * into v_row from public.rate_limits where key = p_key;

  if not found or (v_now - v_row.window_start) >= make_interval(mins => p_window_minutes) then
    v_count := 1;
    v_window_start := v_now;
  else
    v_count := v_row.count + 1;
    v_window_start := v_row.window_start;
  end if;

  insert into public.rate_limits (key, count, window_start)
  values (p_key, v_count, v_window_start)
  on conflict (key) do update
    set count = excluded.count,
        window_start = excluded.window_start;

  v_retry := greatest(
    1,
    ceil(
      extract(
        epoch from (v_window_start + make_interval(mins => p_window_minutes) - v_now)
      )
    )::integer
  );

  return jsonb_build_object(
    'allowed', v_count <= p_max,
    'remaining', greatest(0, p_max - v_count),
    'retryAfterSeconds', v_retry
  );
end;
$$;

grant execute on function public.create_reservation_safe(text, text, integer, date, time, boolean)
to service_role;

grant execute on function public.add_stock_movement_safe(uuid, public.stock_movement_type, numeric, date, text)
to authenticated;

grant execute on function public.consume_rate_limit(text, integer, integer)
to service_role;
