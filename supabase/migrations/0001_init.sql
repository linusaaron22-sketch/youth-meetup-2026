-- Youth Meet Up – Byculla Zoo. Run in the SQL editor of your NEW Supabase project.
create extension if not exists pgcrypto;

-- ───────── Admins (max two) ─────────
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.enforce_max_admins() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.admin_users) >= 2 then
    raise exception 'Only two administrators are allowed';
  end if;
  return new;
end $$;
create trigger admin_users_max before insert on public.admin_users
  for each row execute function public.enforce_max_admins();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ───────── Settings (single row) ─────────
create table public.event_settings (
  id int primary key default 1 check (id = 1),
  event_name text not null default 'Youth Meet Up – Byculla Zoo',
  event_date date not null default '2026-11-21',
  fee_enabled boolean not null default false,
  fee_title text not null default 'Registration fee',
  fee_amount numeric(10,2) not null default 0 check (fee_amount >= 0),
  currency text not null default 'INR',
  minor_age int not null default 18 check (minor_age between 0 and 25),
  require_guardian_ack boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.event_settings (id) values (1);

-- ───────── Registrations & participants ─────────
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'online' check (source in ('online','walk_in')),
  self_register_names text,
  created_at timestamptz not null default now()
);

create table public.registration_forms (
  id uuid primary key default gen_random_uuid(),
  version int not null unique,
  is_active boolean not null default false,
  created_by_email text,
  created_at timestamptz not null default now()
);
create unique index one_active_form on public.registration_forms (is_active) where is_active;
insert into public.registration_forms (version, is_active) values (1, true);

create table public.registration_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.registration_forms(id) on delete cascade,
  key text not null,
  label text not null,
  help_text text,
  type text not null check (type in ('short_text','long_text','number','dropdown','multiple_choice','checkboxes','yes_no','date')),
  options jsonb not null default '[]'::jsonb,
  required boolean not null default false,
  enabled boolean not null default true,
  sort_order int not null default 0,
  unique (form_id, key)
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  full_name text not null,
  age int check (age between 0 and 120),
  phone text,
  congregation text,
  source text not null default 'online' check (source in ('online','walk_in')),
  is_primary boolean not null default false,
  guardian_name text,
  guardian_phone text,
  guardian_ack boolean,
  form_id uuid references public.registration_forms(id),
  name_key text generated always as (lower(regexp_replace(trim(full_name), '\s+', ' ', 'g'))) stored,
  normalized_phone text generated always as (regexp_replace(coalesce(phone,''), '[^0-9]', '', 'g')) stored,
  created_at timestamptz not null default now()
);
create index participants_reg_idx on public.participants (registration_id);
create index participants_name_idx on public.participants (name_key);
create index participants_phone_idx on public.participants (normalized_phone);

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  name text not null,
  relationship text not null,
  phone text not null
);

create table public.travel_companions (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  primary_participant_id uuid not null references public.participants(id) on delete cascade,
  companion_participant_id uuid references public.participants(id) on delete set null,
  name text not null,
  relationship text,
  mode text not null check (mode in ('added','self_register')),
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users(id) on delete set null,
  checked_in_by_email text,
  method text not null default 'check_in' check (method in ('check_in','walk_in'))
);

-- Answers keep a snapshot of the question so form edits never lose data.
create table public.custom_responses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  form_id uuid references public.registration_forms(id),
  field_id uuid references public.registration_fields(id) on delete set null,
  field_key text not null,
  field_label text not null,
  field_type text not null,
  value jsonb,
  created_at timestamptz not null default now()
);
create index custom_responses_participant_idx on public.custom_responses (participant_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  title text,
  amount numeric(10,2) not null default 0 check (amount >= 0),
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('paid','pending','waived','refunded')),
  method text check (method in ('cash','upi','bank_transfer','card','other')),
  reference text,
  note text,
  recorded_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_participant_idx on public.payments (participant_id);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ───────── Row Level Security ─────────
-- Anonymous visitors get NOTHING directly. Public registration goes through a
-- server action that uses the service-role key (never sent to the browser).
do $$
declare t text;
begin
  foreach t in array array['event_settings','registrations','registration_forms','registration_fields',
    'participants','emergency_contacts','travel_companions','attendance','custom_responses','payments','activity_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admins full access" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

alter table public.admin_users enable row level security;
create policy "admins read admin list" on public.admin_users for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- No insert/update/delete policies: add admins only via the SQL editor (see seed_admins.sql).

-- Immutable audit trail: admins can insert and read logs, never edit/delete them.
drop policy "admins full access" on public.activity_logs;
create policy "admins read logs" on public.activity_logs for select to authenticated using (public.is_admin());
create policy "admins write logs" on public.activity_logs for insert to authenticated with check (public.is_admin());
