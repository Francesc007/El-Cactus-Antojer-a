-- Tarjeta VIP. Sin datos de ejemplo.
-- Las fotos viven en el bucket privado loyalty-photos.
-- No hay políticas de escritura: anon y authenticated no mutan estas tablas.
-- Las funciones de visita, canje y anulación solo las ejecuta service_role.

create sequence public.loyalty_folio_seq as integer increment 1 minvalue 1 start 1;

revoke all on sequence public.loyalty_folio_seq from public, anon, authenticated;
grant usage, select on sequence public.loyalty_folio_seq to service_role;

create type public.loyalty_member_status as enum ('active', 'inactive');
create type public.loyalty_visit_source as enum ('scan', 'manual');

create table public.loyalty_members (
  id uuid primary key default gen_random_uuid(),
  member_code text not null unique default encode(gen_random_bytes(16), 'hex'),
  folio text not null unique default (
    'C-' || lpad(nextval('public.loyalty_folio_seq')::text, 4, '0')
  ),
  full_name text not null,
  phone text not null,
  birth_day smallint not null,
  birth_month smallint not null,
  birth_year smallint,
  photo_path text not null,
  marketing_consent boolean not null,
  consent_at timestamptz,
  privacy_notice_version text not null,
  status public.loyalty_member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loyalty_members_phone_unique unique (phone),
  constraint loyalty_members_name_len check (char_length(full_name) between 2 and 80),
  constraint loyalty_members_phone_format check (phone ~ '^52[0-9]{10}$'),
  constraint loyalty_members_code_format check (member_code ~ '^[0-9a-f]{32}$'),
  constraint loyalty_members_folio_format check (folio ~ '^C-[0-9]{4,}$'),
  constraint loyalty_members_photo_path check (photo_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'),
  constraint loyalty_members_privacy_version check (char_length(privacy_notice_version) > 0),
  constraint loyalty_members_birth_month check (birth_month between 1 and 12),
  constraint loyalty_members_birth_day check (
    (birth_month in (1, 3, 5, 7, 8, 10, 12) and birth_day between 1 and 31)
    or (birth_month in (4, 6, 9, 11) and birth_day between 1 and 30)
    or (birth_month = 2 and birth_day between 1 and 29)
  ),
  constraint loyalty_members_birth_year check (
    birth_year is null or birth_year between 1900 and 2100
  )
);

create table public.loyalty_visits (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.loyalty_members (id) on delete cascade,
  visited_at timestamptz not null default now(),
  registered_by uuid references public.profiles (id),
  source public.loyalty_visit_source not null,
  voided_at timestamptz,
  voided_by uuid references public.profiles (id),
  void_reason text,
  constraint loyalty_visits_void_pair check (
    (voided_at is null and voided_by is null and void_reason is null)
    or (voided_at is not null and voided_by is not null and void_reason is not null)
  )
);

create table public.loyalty_redemptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.loyalty_members (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  redeemed_by uuid references public.profiles (id),
  visits_consumed integer not null check (visits_consumed > 0)
);

create table public.loyalty_settings (
  id smallint primary key default 1 check (id = 1),
  visits_per_reward integer not null check (visits_per_reward between 1 and 20),
  reward_description text not null check (char_length(reward_description) between 2 and 120),
  min_hours_between_visits integer not null check (min_hours_between_visits between 1 and 72),
  birthday_message text not null check (char_length(birthday_message) between 10 and 500),
  updated_at timestamptz not null default now()
);

insert into public.loyalty_settings (
  visits_per_reward,
  reward_description,
  min_hours_between_visits,
  birthday_message
)
values (
  5,
  'Postre de cortesía',
  6,
  '¡Feliz cumpleaños! En El Cactus queremos celebrarlo contigo. Ven y disfruta con nosotros. ¡Te esperamos!'
);

-- notification_outbox tiene tipo, pero no una llave única de idempotencia.
-- birthday_messages cubre una felicitación por cliente y año, y el aviso semanal.
create table public.birthday_messages (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.loyalty_members (id) on delete cascade,
  year integer not null check (year between 2000 and 2100),
  idempotency_key text not null unique,
  outbox_id uuid references public.notification_outbox (id) on delete set null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  sent_at timestamptz,
  marked_sent_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint birthday_messages_subject check (
    (
      idempotency_key like 'birthday-week:%'
      and member_id is null
    )
    or (
      idempotency_key like 'birthday:%'
      and idempotency_key not like 'birthday-week:%'
      and member_id is not null
    )
  )
);

create unique index birthday_messages_member_year_uidx
  on public.birthday_messages (member_id, year)
  where member_id is not null;

create index loyalty_members_birth_idx
  on public.loyalty_members (birth_month, birth_day);

create index loyalty_visits_member_id_idx
  on public.loyalty_visits (member_id);

create index loyalty_visits_visited_at_idx
  on public.loyalty_visits (visited_at);

create index loyalty_redemptions_member_id_idx
  on public.loyalty_redemptions (member_id);

create trigger loyalty_members_updated_at
before update on public.loyalty_members
for each row execute function public.set_updated_at();

create trigger loyalty_settings_updated_at
before update on public.loyalty_settings
for each row execute function public.set_updated_at();

create trigger birthday_messages_updated_at
before update on public.birthday_messages
for each row execute function public.set_updated_at();

create or replace function public.loyalty_member_consent_on_insert()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.marketing_consent is not true then
    raise exception 'CONSENT_REQUIRED';
  end if;
  if new.consent_at is null then
    new.consent_at = now();
  end if;
  return new;
end;
$$;

create trigger loyalty_members_consent_on_insert
before insert on public.loyalty_members
for each row execute function public.loyalty_member_consent_on_insert();

create or replace view public.loyalty_member_progress
with (security_invoker = true) as
select
  m.id as member_id,
  (
    select count(*)::integer
    from public.loyalty_visits v
    where v.member_id = m.id
      and v.voided_at is null
  ) as valid_visits,
  (
    select coalesce(sum(r.visits_consumed), 0)::integer
    from public.loyalty_redemptions r
    where r.member_id = m.id
  ) as visits_consumed,
  (
    select max(v.visited_at)
    from public.loyalty_visits v
    where v.member_id = m.id
      and v.voided_at is null
  ) as last_valid_visit_at
from public.loyalty_members m;

create or replace function public.register_loyalty_visit(
  p_member_id uuid,
  p_registered_by uuid,
  p_source text,
  p_force boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member public.loyalty_members;
  v_min_hours integer;
  v_last timestamptz;
  v_hours numeric;
  v_visit_id uuid;
begin
  if p_source not in ('scan', 'manual') then
    raise exception 'INVALID_SOURCE';
  end if;

  select * into v_member
  from public.loyalty_members
  where id = p_member_id
  for update;

  if not found then
    raise exception 'MEMBER_NOT_FOUND';
  end if;

  if v_member.status <> 'active' then
    raise exception 'MEMBER_INACTIVE';
  end if;

  select min_hours_between_visits into v_min_hours
  from public.loyalty_settings
  where id = 1;

  if v_min_hours is null then
    raise exception 'SETTINGS_MISSING';
  end if;

  select max(visited_at) into v_last
  from public.loyalty_visits
  where member_id = p_member_id
    and voided_at is null;

  if v_last is not null and coalesce(p_force, false) = false then
    v_hours := extract(epoch from (now() - v_last)) / 3600;
    if v_hours < v_min_hours then
      raise exception 'VISIT_TOO_SOON';
    end if;
  end if;

  insert into public.loyalty_visits (member_id, registered_by, source)
  values (p_member_id, p_registered_by, p_source::public.loyalty_visit_source)
  returning id into v_visit_id;

  return jsonb_build_object('visitId', v_visit_id);
end;
$$;

create or replace function public.redeem_loyalty_reward(
  p_member_id uuid,
  p_redeemed_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member public.loyalty_members;
  v_threshold integer;
  v_visits integer;
  v_consumed integer;
  v_current integer;
  v_redemption_id uuid;
begin
  select * into v_member
  from public.loyalty_members
  where id = p_member_id
  for update;

  if not found then
    raise exception 'MEMBER_NOT_FOUND';
  end if;

  if v_member.status <> 'active' then
    raise exception 'MEMBER_INACTIVE';
  end if;

  select visits_per_reward into v_threshold
  from public.loyalty_settings
  where id = 1;

  if v_threshold is null then
    raise exception 'SETTINGS_MISSING';
  end if;

  select count(*)::integer into v_visits
  from public.loyalty_visits
  where member_id = p_member_id
    and voided_at is null;

  select coalesce(sum(visits_consumed), 0)::integer into v_consumed
  from public.loyalty_redemptions
  where member_id = p_member_id;

  v_current := v_visits - v_consumed;
  if v_current < v_threshold then
    raise exception 'REWARD_NOT_AVAILABLE';
  end if;

  insert into public.loyalty_redemptions (member_id, redeemed_by, visits_consumed)
  values (p_member_id, p_redeemed_by, v_threshold)
  returning id into v_redemption_id;

  return jsonb_build_object(
    'redemptionId', v_redemption_id,
    'visitsConsumed', v_threshold
  );
end;
$$;

-- La anulación también bloquea la ficha para no cruzarse con un canje.
create or replace function public.void_loyalty_visit(
  p_visit_id uuid,
  p_voided_by uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
  v_visit public.loyalty_visits;
  v_reason text := trim(coalesce(p_reason, ''));
begin
  if char_length(v_reason) < 3 then
    raise exception 'VOID_REASON_REQUIRED';
  end if;

  select member_id into v_member_id
  from public.loyalty_visits
  where id = p_visit_id;

  if not found then
    raise exception 'VISIT_NOT_FOUND';
  end if;

  perform 1
  from public.loyalty_members
  where id = v_member_id
  for update;

  select * into v_visit
  from public.loyalty_visits
  where id = p_visit_id
  for update;

  if v_visit.voided_at is not null then
    raise exception 'VISIT_ALREADY_VOID';
  end if;

  update public.loyalty_visits
  set voided_at = now(),
      voided_by = p_voided_by,
      void_reason = v_reason
  where id = p_visit_id;

  return jsonb_build_object('visitId', p_visit_id);
end;
$$;

revoke all on function public.loyalty_member_consent_on_insert() from public, anon, authenticated;
grant execute on function public.loyalty_member_consent_on_insert() to service_role;

revoke all on function public.register_loyalty_visit(uuid, uuid, text, boolean)
  from public, anon, authenticated;
grant execute on function public.register_loyalty_visit(uuid, uuid, text, boolean)
  to service_role;

revoke all on function public.redeem_loyalty_reward(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.redeem_loyalty_reward(uuid, uuid)
  to service_role;

revoke all on function public.void_loyalty_visit(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.void_loyalty_visit(uuid, uuid, text)
  to service_role;

alter table public.loyalty_members enable row level security;
alter table public.loyalty_visits enable row level security;
alter table public.loyalty_redemptions enable row level security;
alter table public.loyalty_settings enable row level security;
alter table public.birthday_messages enable row level security;

create policy staff_read_loyalty_members
on public.loyalty_members for select
to authenticated
using (public.is_staff());

create policy staff_read_loyalty_visits
on public.loyalty_visits for select
to authenticated
using (public.is_staff());

create policy staff_read_loyalty_redemptions
on public.loyalty_redemptions for select
to authenticated
using (public.is_staff());

create policy staff_read_loyalty_settings
on public.loyalty_settings for select
to authenticated
using (public.is_staff());

create policy staff_read_birthday_messages
on public.birthday_messages for select
to authenticated
using (public.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'loyalty-photos',
  'loyalty-photos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
