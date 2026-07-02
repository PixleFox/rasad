create extension if not exists pgcrypto;

create table if not exists public.export_users (
  id uuid primary key default gen_random_uuid(),
  phone varchar(11) not null unique check (phone ~ '^09[0-9]{9}$'),
  phone_verified boolean not null default false,
  otp_enabled boolean not null default false,
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.export_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.export_users(id) on delete cascade,
  page text not null,
  file_name text not null,
  exported_at timestamptz not null default now()
);

create index if not exists export_events_user_id_idx on public.export_events(user_id);
create index if not exists export_events_exported_at_idx on public.export_events(exported_at desc);

alter table public.export_users enable row level security;
alter table public.export_events enable row level security;

-- Public clients can only call this function; they cannot read phone numbers.
create or replace function public.register_export(p_phone text, p_page text, p_file_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  if p_phone !~ '^09[0-9]{9}$' then raise exception 'invalid phone'; end if;

  insert into public.export_users (phone)
  values (p_phone)
  on conflict (phone) do update set last_seen_at = now()
  returning id into target_user_id;

  insert into public.export_events (user_id, page, file_name)
  values (target_user_id, left(p_page, 200), left(p_file_name, 120));
end;
$$;

revoke all on function public.register_export(text, text, text) from public;
grant execute on function public.register_export(text, text, text) to anon, authenticated;

-- This schema is not exposed through the public REST API.
create schema if not exists private;
create or replace view private.export_lead_summary as
select u.phone, u.phone_verified, u.consent_at, u.created_at, u.last_seen_at,
       count(e.id) as export_count, max(e.exported_at) as last_export_at
from public.export_users u
left join public.export_events e on e.user_id = u.id
group by u.id;
