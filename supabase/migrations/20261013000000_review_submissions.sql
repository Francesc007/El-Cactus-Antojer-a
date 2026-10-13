-- Evidencia de reseñas (Google, Facebook, Instagram).
-- Las capturas viven en el bucket privado review-evidence.
-- anon y authenticated no escriben: las mutaciones van por API con service_role.

create type public.review_platform as enum ('google', 'facebook', 'instagram');
create type public.review_status as enum ('pending', 'approved', 'rejected');

alter table public.loyalty_members
  add column google_review_submitted boolean not null default false;

create table public.review_submissions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.loyalty_members (id) on delete cascade,
  platform public.review_platform not null,
  image_path text not null,
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  validated_by uuid references public.profiles (id),
  constraint review_submissions_image_path check (
    image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
  ),
  constraint review_submissions_validation_pair check (
    (
      status = 'pending'
      and validated_at is null
      and validated_by is null
    )
    or (
      status <> 'pending'
      and validated_at is not null
      and validated_by is not null
    )
  )
);

create unique index review_submissions_pending_platform_uidx
  on public.review_submissions (member_id, platform)
  where status = 'pending';

create unique index review_submissions_google_open_uidx
  on public.review_submissions (member_id)
  where platform = 'google' and status in ('pending', 'approved');

create index review_submissions_member_id_idx
  on public.review_submissions (member_id);

create index review_submissions_status_created_idx
  on public.review_submissions (status, created_at desc);

create or replace function public.submit_review(
  p_member_id uuid,
  p_platform text,
  p_image_path text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member public.loyalty_members;
  v_id uuid;
begin
  if p_platform not in ('google', 'facebook', 'instagram') then
    raise exception 'INVALID_PLATFORM';
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

  if exists (
    select 1
    from public.review_submissions
    where member_id = p_member_id
      and platform = p_platform::public.review_platform
      and status = 'pending'
  ) then
    raise exception 'REVIEW_ALREADY_PENDING';
  end if;

  if p_platform = 'google' then
    if exists (
      select 1
      from public.review_submissions
      where member_id = p_member_id
        and platform = 'google'
        and status in ('pending', 'approved')
    ) then
      raise exception 'GOOGLE_REVIEW_ALREADY_SUBMITTED';
    end if;
  end if;

  insert into public.review_submissions (member_id, platform, image_path)
  values (p_member_id, p_platform::public.review_platform, p_image_path)
  returning id into v_id;

  if p_platform = 'google' then
    update public.loyalty_members
    set google_review_submitted = true
    where id = p_member_id;
  end if;

  return jsonb_build_object('reviewId', v_id);
end;
$$;

-- Punto de extensión: al aprobar se podría otorgar un sello o premio.
create or replace function public.resolve_review(
  p_review_id uuid,
  p_status text,
  p_staff_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
  v_review public.review_submissions;
  v_has_google boolean;
begin
  if p_status not in ('approved', 'rejected') then
    raise exception 'INVALID_STATUS';
  end if;

  select member_id into v_member_id
  from public.review_submissions
  where id = p_review_id;

  if not found then
    raise exception 'REVIEW_NOT_FOUND';
  end if;

  perform 1
  from public.loyalty_members
  where id = v_member_id
  for update;

  select * into v_review
  from public.review_submissions
  where id = p_review_id
  for update;

  if v_review.status <> 'pending' then
    raise exception 'REVIEW_NOT_PENDING';
  end if;

  update public.review_submissions
  set status = p_status::public.review_status,
      validated_at = now(),
      validated_by = p_staff_id
  where id = p_review_id;

  if v_review.platform = 'google' then
    if p_status = 'rejected' then
      select exists (
        select 1
        from public.review_submissions
        where member_id = v_review.member_id
          and platform = 'google'
          and status in ('pending', 'approved')
          and id <> p_review_id
      ) into v_has_google;

      update public.loyalty_members
      set google_review_submitted = coalesce(v_has_google, false)
      where id = v_review.member_id;
    else
      update public.loyalty_members
      set google_review_submitted = true
      where id = v_review.member_id;
    end if;
  end if;

  return jsonb_build_object('reviewId', p_review_id, 'status', p_status);
end;
$$;

revoke all on function public.submit_review(uuid, text, text) from public, anon, authenticated;
grant execute on function public.submit_review(uuid, text, text) to service_role;

revoke all on function public.resolve_review(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.resolve_review(uuid, text, uuid) to service_role;

alter table public.review_submissions enable row level security;

create policy staff_read_review_submissions
on public.review_submissions for select
to authenticated
using (public.is_staff());

grant select on table public.review_submissions to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-evidence',
  'review-evidence',
  false,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
