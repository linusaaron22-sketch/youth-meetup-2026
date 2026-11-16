-- Backend reliability improvements for Youth Meet Up.
-- Apply after 0001_init.sql. This migration never removes participant or response data.

-- Report legacy rows before adding the rule. NOT VALID preserves them unchanged,
-- while the check (including non-null) applies to new and updated participant rows.
do $$
declare v_legacy_age_count bigint;
begin
  select count(*) into v_legacy_age_count
  from public.participants where age is null or age < 14;
  raise notice 'Youth Meet Up age preflight: % existing rows have NULL or age below 14; records and ages are preserved for manual review.', v_legacy_age_count;
end;
$$;
-- 0001_init.sql had an age <= 120 check. Remove it; eligibility has no upper age rule.
alter table public.participants drop constraint if exists participants_age_check;
alter table public.participants drop constraint if exists participants_event_age_check;
alter table public.participants
  add constraint participants_event_age_check check (age is not null and age >= 14) not valid;

-- Keep the existing activity log as the audit history while making cancellation
-- status queryable without fetching every historical cancellation log.
alter table public.registrations add column cancelled_at timestamptz;
alter table public.registrations add column cancelled_by uuid;
do $$
declare v_orphan_actor_count bigint;
begin
  select count(*) into v_orphan_actor_count
  from public.activity_logs al
  left join auth.users u on u.id = al.actor_id
  where al.action = 'cancel_registration' and al.entity = 'registration'
    and al.actor_id is not null and u.id is null;
  raise notice 'Youth Meet Up cancellation preflight: % historical cancellation actor IDs do not exist in auth.users; audit logs are preserved and cancelled_by will be NULL for those entries.', v_orphan_actor_count;
end;
$$;
update public.registrations r
set cancelled_at = c.created_at,
    cancelled_by = case when u.id is not null then c.actor_id else null end
from (
  select registration_id, created_at, actor_id from (
    select distinct on (entity_id)
      case when entity_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then entity_id::uuid end as registration_id,
      created_at, actor_id
    from public.activity_logs
    where action = 'cancel_registration' and entity = 'registration'
    order by entity_id, created_at, id
  ) historical_cancellations where registration_id is not null
) c
left join auth.users u on u.id = c.actor_id
where r.id = c.registration_id and r.cancelled_at is null;
alter table public.registrations
  add constraint registrations_cancelled_by_fkey foreign key (cancelled_by) references auth.users(id) on delete set null;
create index registrations_active_idx on public.registrations (created_at desc, id) where cancelled_at is null;
create index registrations_cancelled_idx on public.registrations (cancelled_at desc, id) where cancelled_at is not null;

-- One-row duplicate flags avoid loading the entire participant directory into
-- application memory just to calculate its duplicate filter.
create or replace view public.participant_duplicate_flags with (security_invoker = true) as
select p.id,
  (count(*) over (partition by p.name_key) > 1
   or (p.normalized_phone <> '' and count(*) over (partition by p.normalized_phone, split_part(p.name_key, ' ', 1)) > 1)) as is_duplicate
from public.participants p;
revoke all on public.participant_duplicate_flags from public, anon;
grant select on public.participant_duplicate_flags to authenticated;

-- One database snapshot supplies both the filtered page and its matching count.
create or replace function public.admin_participant_page(
  p_query text, p_status text, p_source text, p_registration_status text,
  p_duplicates_only boolean, p_page_size integer,
  p_cursor_created_at timestamptz, p_cursor_id uuid, p_direction text
) returns jsonb
language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_page_size integer := greatest(1, least(coalesce(p_page_size, 100), 100));
begin
  if not public.is_admin() then raise exception 'Admin access required.' using errcode = '42501'; end if;
  return (
    with matched as (
      select p.id, p.registration_id, p.full_name, p.age, p.phone, p.congregation, p.source,
        a.checked_in_at, r.cancelled_at, d.is_duplicate, p.created_at
      from public.participants p
      join public.registrations r on r.id = p.registration_id
      left join public.attendance a on a.participant_id = p.id
      join public.participant_duplicate_flags d on d.id = p.id
      where (p_query is null or p_query = '' or
        position(lower(p_query) in lower(coalesce(p.full_name, '') || ' ' || coalesce(p.phone, '') || ' ' || coalesce(p.congregation, ''))) > 0)
        and (p_source is null or p_source not in ('online','walk_in') or p.source = p_source)
        and (p_registration_status is null or p_registration_status = 'all' or
          (p_registration_status = 'active' and r.cancelled_at is null) or
          (p_registration_status = 'cancelled' and r.cancelled_at is not null))
        and (p_status is null or p_status not in ('present','absent') or
          (p_status = 'present' and a.participant_id is not null) or
          (p_status = 'absent' and a.participant_id is null))
        and (coalesce(p_duplicates_only, false) = false or d.is_duplicate)
    ), cursor_rows as (
      select * from matched
      where p_cursor_created_at is null or p_cursor_id is null or
        (p_direction = 'before' and (created_at > p_cursor_created_at or (created_at = p_cursor_created_at and id < p_cursor_id))) or
        (p_direction <> 'before' and (created_at < p_cursor_created_at or (created_at = p_cursor_created_at and id > p_cursor_id)))
    ), page_rows as (
      select * from cursor_rows
      order by
        case when p_direction = 'before' then created_at end asc,
        case when p_direction = 'before' then id end desc,
        case when p_direction <> 'before' then created_at end desc,
        case when p_direction <> 'before' then id end asc
      limit v_page_size
    )
    select jsonb_build_object(
      'total', (select count(*) from matched),
      'has_previous', exists(select 1 from matched m cross join (select created_at, id from page_rows order by created_at desc, id asc limit 1) edge
        where m.created_at > edge.created_at or (m.created_at = edge.created_at and m.id < edge.id)),
      'has_next', exists(select 1 from matched m cross join (select created_at, id from page_rows order by created_at asc, id desc limit 1) edge
        where m.created_at < edge.created_at or (m.created_at = edge.created_at and m.id > edge.id)),
      'rows', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'registration_id', registration_id, 'full_name', full_name, 'age', age,
        'phone', phone, 'congregation', congregation, 'source', source, 'created_at', created_at,
        'attendance', case when checked_in_at is null then null else jsonb_build_object('checked_in_at', checked_in_at) end,
        'registrations', jsonb_build_object('cancelled_at', cancelled_at), 'is_duplicate', is_duplicate
      ) order by created_at desc, id asc) from page_rows), '[]'::jsonb)
    )
  );
end;
$$;
revoke all on function public.admin_participant_page(text,text,text,text,boolean,integer,timestamptz,uuid,text) from public, anon;
grant execute on function public.admin_participant_page(text,text,text,text,boolean,integer,timestamptz,uuid,text) to authenticated;

-- A single-statement ID snapshot lets the CSV route fetch details by fixed IDs,
-- avoiding offset shifts if registrations are added or cancelled while exporting.
create or replace function public.admin_participant_export_ids(
  p_query text, p_status text, p_source text, p_registration_status text,
  p_duplicates_only boolean
) returns jsonb
language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'Admin access required.' using errcode = '42501'; end if;
  return (
    select coalesce(jsonb_agg(p.id order by p.created_at asc, p.id asc), '[]'::jsonb)
    from public.participants p
    join public.registrations r on r.id = p.registration_id
    left join public.attendance a on a.participant_id = p.id
    join public.participant_duplicate_flags d on d.id = p.id
    where (p_query is null or p_query = '' or
      position(lower(p_query) in lower(coalesce(p.full_name, '') || ' ' || coalesce(p.phone, '') || ' ' || coalesce(p.congregation, ''))) > 0)
      and (p_source is null or p_source not in ('online','walk_in') or p.source = p_source)
      and (p_registration_status is null or p_registration_status = 'all' or
        (p_registration_status = 'active' and r.cancelled_at is null) or
        (p_registration_status = 'cancelled' and r.cancelled_at is not null))
      and (p_status is null or p_status not in ('present','absent') or
        (p_status = 'present' and a.participant_id is not null) or
        (p_status = 'absent' and a.participant_id is null))
      and (coalesce(p_duplicates_only, false) = false or d.is_duplicate)
  );
end;
$$;
revoke all on function public.admin_participant_export_ids(text,text,text,text,boolean) from public, anon;
grant execute on function public.admin_participant_export_ids(text,text,text,text,boolean) to authenticated;

-- Overview totals and congregation rollups share one PostgreSQL statement snapshot.
create or replace function public.admin_overview_stats()
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'Admin access required.' using errcode = '42501'; end if;
  return (
    select jsonb_build_object(
      'registrations', (select count(*) from public.registrations r where r.cancelled_at is null),
      'participants', (select count(*) from public.participants p join public.registrations r on r.id = p.registration_id where r.cancelled_at is null),
      'present', (select count(*) from public.participants p join public.registrations r on r.id = p.registration_id
        join public.attendance a on a.participant_id = p.id where r.cancelled_at is null),
      'walk_ins', (select count(*) from public.participants p join public.registrations r on r.id = p.registration_id
        where r.cancelled_at is null and p.source = 'walk_in'),
      'congregations', coalesce((
        select jsonb_agg(jsonb_build_object('name', congregation, 'total', total, 'present', present) order by total desc, congregation asc)
        from (
          select coalesce(nullif(btrim(p.congregation), ''), '(not given)') as congregation,
            count(*) as total, count(a.participant_id) as present
          from public.participants p
          join public.registrations r on r.id = p.registration_id
          left join public.attendance a on a.participant_id = p.id
          where r.cancelled_at is null
          group by coalesce(nullif(btrim(p.congregation), ''), '(not given)')
        ) congregation_totals
      ), '[]'::jsonb)
    )
  );
end;
$$;
revoke all on function public.admin_overview_stats() from public, anon;
grant execute on function public.admin_overview_stats() to authenticated;

-- Forms are read-only through PostgREST. The admin publishing RPC is the only
-- normal write path and publishes a complete version in one transaction.
drop policy if exists "admins full access" on public.registration_forms;
drop policy if exists "admins full access" on public.registration_fields;
create policy "admins read registration forms" on public.registration_forms
  for select to authenticated using (public.is_admin());
create policy "admins read registration fields" on public.registration_fields
  for select to authenticated using (public.is_admin());
revoke insert, update, delete, truncate, references, trigger on public.registration_forms, public.registration_fields from anon, authenticated;
grant select on public.registration_forms, public.registration_fields to authenticated;

-- Idempotency and privacy-preserving fixed-window registration rate limits.
create table public.registration_submissions (
  submission_key uuid primary key,
  request_hash text not null,
  registration_id uuid unique references public.registrations(id) on delete restrict,
  created_at timestamptz not null default now()
);
create table public.registration_rate_limits (
  subject_hash text primary key,
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0),
  updated_at timestamptz not null default now()
);
create index registration_rate_limits_updated_idx on public.registration_rate_limits (updated_at);
create table public.registration_rate_limit_keys (
  subject_hash text not null,
  submission_key uuid not null,
  created_at timestamptz not null default now(),
  primary key (subject_hash, submission_key)
);
create index registration_rate_limit_keys_created_idx on public.registration_rate_limit_keys (created_at);
alter table public.registration_submissions enable row level security;
alter table public.registration_rate_limits enable row level security;
alter table public.registration_rate_limit_keys enable row level security;
revoke all on public.registration_submissions, public.registration_rate_limits, public.registration_rate_limit_keys from public, anon, authenticated;
grant all on public.registration_submissions, public.registration_rate_limits, public.registration_rate_limit_keys to service_role;

create or replace function public.consume_youth_registration_rate_limit(p_submission_key uuid, p_subject_hash text)
returns boolean language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_attempts integer;
begin
  if p_submission_key is null or p_subject_hash is null or p_subject_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid registration request.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_subject_hash, 0));
  delete from public.registration_rate_limit_keys where created_at < clock_timestamp() - interval '10 minutes';
  delete from public.registration_rate_limits where updated_at < clock_timestamp() - interval '30 days';
  if exists (select 1 from public.registration_rate_limit_keys
             where subject_hash = p_subject_hash and submission_key = p_submission_key
               and created_at >= clock_timestamp() - interval '10 minutes') then
    return true;
  end if;

  insert into public.registration_rate_limits(subject_hash, window_started_at, attempts)
  values (p_subject_hash, clock_timestamp(), 1)
  on conflict (subject_hash) do update
    set attempts = case
          when registration_rate_limits.window_started_at <= clock_timestamp() - interval '10 minutes' then 1
          else registration_rate_limits.attempts + 1
        end,
        window_started_at = case
          when registration_rate_limits.window_started_at <= clock_timestamp() - interval '10 minutes' then clock_timestamp()
          else registration_rate_limits.window_started_at
        end,
        updated_at = clock_timestamp()
  returning attempts into v_attempts;
  if v_attempts > 8 then raise exception 'Registration rate limit reached.' using errcode = 'P0001'; end if;
  insert into public.registration_rate_limit_keys(subject_hash, submission_key) values (p_subject_hash, p_submission_key);
  return true;
end;
$$;
revoke all on function public.consume_youth_registration_rate_limit(uuid,text) from public, anon, authenticated;
grant execute on function public.consume_youth_registration_rate_limit(uuid,text) to service_role;

-- Public registration is called only by the server's service-role client.
create or replace function public.submit_youth_registration(
  p_submission_key uuid,
  p_request_hash text,
  p_registration jsonb,
  p_form_id uuid,
  p_participants jsonb,
  p_emergency_contacts jsonb,
  p_travel_companions jsonb,
  p_custom_responses jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_registration_id uuid;
  v_existing_hash text;
  v_active_form_id uuid;
begin
  if p_submission_key is null or p_request_hash is null or p_request_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid registration request.' using errcode = '22023';
  end if;

  -- Repeated delivery of the same key returns the original result and does not
  -- consume another rate-limit attempt.
  insert into public.registration_submissions(submission_key, request_hash, registration_id)
  values (p_submission_key, p_request_hash, null)
  on conflict (submission_key) do nothing;
  select request_hash, registration_id into v_existing_hash, v_registration_id
  from public.registration_submissions where submission_key = p_submission_key for update;
  if v_existing_hash <> p_request_hash then
    raise exception 'Submission key was already used for different data.' using errcode = '22023';
  end if;
  if v_registration_id is not null then
    return v_registration_id;
  end if;
  v_registration_id := gen_random_uuid();

  select id into v_active_form_id from public.registration_forms where is_active = true;
  if v_active_form_id is distinct from p_form_id then
    raise exception 'The registration form changed. Reload and try again.' using errcode = 'P0001';
  end if;

  insert into public.registrations(id, source, self_register_names)
  values (v_registration_id, 'online', nullif(p_registration->>'self_register_names', ''));

  insert into public.participants(
    id, registration_id, full_name, age, phone, congregation, source, is_primary,
    guardian_name, guardian_phone, guardian_ack, form_id
  )
  select x.id, v_registration_id, x.full_name, x.age, x.phone, x.congregation, 'online', x.is_primary,
    x.guardian_name, x.guardian_phone, x.guardian_ack, p_form_id
  from jsonb_to_recordset(coalesce(p_participants, '[]'::jsonb)) as x(
    id uuid, full_name text, age integer, phone text, congregation text, is_primary boolean,
    guardian_name text, guardian_phone text, guardian_ack boolean
  );

  insert into public.emergency_contacts(participant_id, name, relationship, phone)
  select x.participant_id, x.name, x.relationship, x.phone
  from jsonb_to_recordset(coalesce(p_emergency_contacts, '[]'::jsonb)) as x(
    participant_id uuid, name text, relationship text, phone text
  );

  insert into public.travel_companions(registration_id, primary_participant_id, companion_participant_id, name, relationship, mode)
  select v_registration_id, x.primary_participant_id, x.companion_participant_id, x.name, x.relationship, x.mode
  from jsonb_to_recordset(coalesce(p_travel_companions, '[]'::jsonb)) as x(
    primary_participant_id uuid, companion_participant_id uuid, name text, relationship text, mode text
  );

  insert into public.custom_responses(participant_id, form_id, field_id, field_key, field_label, field_type, value)
  select x.participant_id, p_form_id, x.field_id, x.field_key, x.field_label, x.field_type, x.value
  from jsonb_to_recordset(coalesce(p_custom_responses, '[]'::jsonb)) as x(
    participant_id uuid, field_id uuid, field_key text, field_label text, field_type text, value jsonb
  );

  update public.registration_submissions set registration_id = v_registration_id
  where submission_key = p_submission_key;

  return v_registration_id;
end;
$$;
revoke all on function public.submit_youth_registration(uuid,text,jsonb,uuid,jsonb,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.submit_youth_registration(uuid,text,jsonb,uuid,jsonb,jsonb,jsonb,jsonb) to service_role;

-- Administrator RPCs keep data changes and their audit record in one transaction.
create or replace function public.admin_check_in(p_participant_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_registration_id uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required.' using errcode = '42501'; end if;
  select registration_id into v_registration_id from public.participants where id = p_participant_id;
  if v_registration_id is null then raise exception 'Participant not found.' using errcode = 'P0002'; end if;
  perform 1 from public.registrations where id = v_registration_id and cancelled_at is null for update;
  if not found then raise exception 'Registration is cancelled or missing.' using errcode = 'P0001'; end if;
  insert into public.attendance(participant_id, checked_in_by, checked_in_by_email, method)
  values (p_participant_id, auth.uid(), auth.jwt()->>'email', 'check_in');
  insert into public.activity_logs(actor_id, actor_email, action, entity, entity_id)
  values (auth.uid(), auth.jwt()->>'email', 'check_in', 'participant', p_participant_id::text);
end;
$$;

create or replace function public.admin_undo_check_in(p_participant_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_registration_id uuid; v_previous jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required.' using errcode = '42501'; end if;
  select registration_id into v_registration_id from public.participants where id = p_participant_id;
  if v_registration_id is null then raise exception 'Participant not found.' using errcode = 'P0002'; end if;
  perform 1 from public.registrations where id = v_registration_id for update;
  select jsonb_build_object('checked_in_at', checked_in_at, 'method', method) into v_previous
  from public.attendance where participant_id = p_participant_id for update;
  if v_previous is null then raise exception 'Participant is not checked in.' using errcode = 'P0002'; end if;
  delete from public.attendance where participant_id = p_participant_id;
  insert into public.activity_logs(actor_id, actor_email, action, entity, entity_id, details)
  values (auth.uid(), auth.jwt()->>'email', 'undo_check_in', 'participant', p_participant_id::text, jsonb_build_object('previous', v_previous));
end;
$$;

create or replace function public.admin_cancel_registration(p_registration_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_source text;
begin
  if not public.is_admin() then raise exception 'Admin access required.' using errcode = '42501'; end if;
  select source into v_source from public.registrations where id = p_registration_id for update;
  if not found then raise exception 'Registration not found.' using errcode = 'P0002'; end if;
  if exists (select 1 from public.registrations where id = p_registration_id and cancelled_at is not null) then
    return false;
  end if;
  update public.registrations set cancelled_at = clock_timestamp(), cancelled_by = auth.uid() where id = p_registration_id;
  insert into public.activity_logs(actor_id, actor_email, action, entity, entity_id, details)
  values (auth.uid(), auth.jwt()->>'email', 'cancel_registration', 'registration', p_registration_id::text,
          jsonb_build_object('source', v_source, 'status', 'cancelled'));
  return true;
end;
$$;

create or replace function public.admin_create_walk_in(
  p_participant jsonb, p_emergency jsonb, p_form_id uuid
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_registration_id uuid := gen_random_uuid(); v_participant_id uuid := (p_participant->>'id')::uuid; v_current_form uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required.' using errcode = '42501'; end if;
  select id into v_current_form from public.registration_forms where is_active = true;
  if v_current_form is distinct from p_form_id then raise exception 'The active form changed. Reload and try again.' using errcode = 'P0001'; end if;
  insert into public.registrations(id, source) values (v_registration_id, 'walk_in');
  insert into public.participants(id, registration_id, full_name, age, phone, congregation, source, is_primary, form_id)
  values (v_participant_id, v_registration_id, p_participant->>'full_name', (p_participant->>'age')::integer,
          nullif(p_participant->>'phone',''), nullif(p_participant->>'congregation',''), 'walk_in', true, p_form_id);
  if p_emergency is not null then
    insert into public.emergency_contacts(participant_id, name, relationship, phone)
    values (v_participant_id, p_emergency->>'name', p_emergency->>'relationship', p_emergency->>'phone');
  end if;
  insert into public.attendance(participant_id, checked_in_by, checked_in_by_email, method)
  values (v_participant_id, auth.uid(), auth.jwt()->>'email', 'walk_in');
  insert into public.activity_logs(actor_id, actor_email, action, entity, entity_id, details)
  values (auth.uid(), auth.jwt()->>'email', 'walk_in_added', 'participant', v_participant_id::text, null);
  return v_participant_id;
end;
$$;

create or replace function public.admin_update_participant(p_participant_id uuid, p_values jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'Admin access required.' using errcode = '42501'; end if;
  update public.participants set full_name = p_values->>'full_name', age = (p_values->>'age')::integer,
    phone = nullif(p_values->>'phone',''), congregation = nullif(p_values->>'congregation','')
  where id = p_participant_id;
  if not found then raise exception 'Participant not found.' using errcode = 'P0002'; end if;
  insert into public.activity_logs(actor_id, actor_email, action, entity, entity_id, details)
  values (auth.uid(), auth.jwt()->>'email', 'update_participant', 'participant', p_participant_id::text, null);
end;
$$;

create or replace function public.admin_update_emergency_contact(p_participant_id uuid, p_values jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'Admin access required.' using errcode = '42501'; end if;
  if not exists (select 1 from public.participants where id = p_participant_id) then raise exception 'Participant not found.' using errcode = 'P0002'; end if;
  insert into public.emergency_contacts(participant_id, name, relationship, phone)
  values (p_participant_id, p_values->>'name', p_values->>'relationship', p_values->>'phone')
  on conflict (participant_id) do update set name = excluded.name, relationship = excluded.relationship, phone = excluded.phone;
  insert into public.activity_logs(actor_id, actor_email, action, entity, entity_id)
  values (auth.uid(), auth.jwt()->>'email', 'update_emergency_contact', 'participant', p_participant_id::text);
end;
$$;

create or replace function public.admin_update_safeguarding(p_values jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'Admin access required.' using errcode = '42501'; end if;
  update public.event_settings set minor_age = (p_values->>'minor_age')::integer,
    require_guardian_ack = (p_values->>'require_guardian_ack')::boolean, updated_at = clock_timestamp() where id = 1;
  if not found then raise exception 'Settings not found.' using errcode = 'P0002'; end if;
  insert into public.activity_logs(actor_id, actor_email, action, entity, entity_id, details)
  values (auth.uid(), auth.jwt()->>'email', 'update_settings', 'event_settings', '1', p_values);
end;
$$;

create or replace function public.admin_publish_form(p_fields jsonb)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_version integer; v_form_id uuid := gen_random_uuid(); v_count integer;
begin
  if not public.is_admin() then raise exception 'Admin access required.' using errcode = '42501'; end if;
  if p_fields is null or jsonb_typeof(p_fields) <> 'array' or
     (case when jsonb_typeof(p_fields) = 'array' then jsonb_array_length(p_fields) else 61 end) > 60 then
    raise exception 'Invalid registration form.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_fields) as x(
      key text, label text, type text, options jsonb, required boolean, enabled boolean, sort_order integer
    ) where x.key is null or x.key !~ '^[a-z0-9_]{2,40}$'
      or x.label is null or length(btrim(x.label)) = 0 or length(x.label) > 200
      or x.type is null or x.type not in ('short_text','long_text','number','dropdown','multiple_choice','checkboxes','yes_no','date')
      or x.required is null or x.enabled is null or x.sort_order is null
      or (x.type in ('dropdown','multiple_choice','checkboxes') and
        (jsonb_typeof(coalesce(x.options, '[]'::jsonb)) <> 'array'
         or jsonb_array_length(case when jsonb_typeof(coalesce(x.options, '[]'::jsonb)) = 'array' then x.options else '[]'::jsonb end) < 2
         or jsonb_array_length(case when jsonb_typeof(coalesce(x.options, '[]'::jsonb)) = 'array' then x.options else '[]'::jsonb end) > 30))
  ) or exists (
    select 1
    from jsonb_to_recordset(p_fields) as x(type text, options jsonb)
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(coalesce(x.options, '[]'::jsonb)) = 'array' then x.options else '[]'::jsonb end
    ) as option_values(value)
    where x.type in ('dropdown','multiple_choice','checkboxes') and
      (jsonb_typeof(option_values.value) <> 'string' or length(btrim(option_values.value #>> '{}')) = 0 or length(option_values.value #>> '{}') > 100)
  ) then
    raise exception 'Invalid registration form fields or choice options.' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_to_recordset(p_fields) as x(key text)) <>
     (select count(distinct key) from jsonb_to_recordset(p_fields) as x(key text)) then
    raise exception 'Registration form question keys must be unique.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(551909414);
  select coalesce(max(version), 0) + 1 into v_version from public.registration_forms;
  insert into public.registration_forms(id, version, is_active, created_by_email) values (v_form_id, v_version, false, auth.jwt()->>'email');
  insert into public.registration_fields(form_id, key, label, help_text, type, options, required, enabled, sort_order)
  select v_form_id, x.key, x.label, x.help_text, x.type,
    case when x.type in ('dropdown','multiple_choice','checkboxes') then coalesce(x.options, '[]'::jsonb) else '[]'::jsonb end,
    x.required, x.enabled, x.sort_order
  from jsonb_to_recordset(coalesce(p_fields, '[]'::jsonb)) as x(
    key text, label text, help_text text, type text, options jsonb, required boolean, enabled boolean, sort_order integer
  );
  get diagnostics v_count = row_count;
  update public.registration_forms set is_active = false where is_active = true;
  update public.registration_forms set is_active = true where id = v_form_id;
  insert into public.activity_logs(actor_id, actor_email, action, entity, entity_id, details)
  values (auth.uid(), auth.jwt()->>'email', 'publish_form', 'registration_form', v_form_id::text,
          jsonb_build_object('version', v_version, 'questions', v_count));
  return v_version;
end;
$$;

revoke all on function public.admin_check_in(uuid) from public, anon;
revoke all on function public.admin_undo_check_in(uuid) from public, anon;
revoke all on function public.admin_cancel_registration(uuid) from public, anon;
revoke all on function public.admin_create_walk_in(jsonb,jsonb,uuid) from public, anon;
revoke all on function public.admin_update_participant(uuid,jsonb) from public, anon;
revoke all on function public.admin_update_emergency_contact(uuid,jsonb) from public, anon;
revoke all on function public.admin_update_safeguarding(jsonb) from public, anon;
revoke all on function public.admin_publish_form(jsonb) from public, anon;
grant execute on function public.admin_check_in(uuid) to authenticated;
grant execute on function public.admin_undo_check_in(uuid) to authenticated;
grant execute on function public.admin_cancel_registration(uuid) to authenticated;
grant execute on function public.admin_create_walk_in(jsonb,jsonb,uuid) to authenticated;
grant execute on function public.admin_update_participant(uuid,jsonb) to authenticated;
grant execute on function public.admin_update_emergency_contact(uuid,jsonb) to authenticated;
grant execute on function public.admin_update_safeguarding(jsonb) to authenticated;
grant execute on function public.admin_publish_form(jsonb) to authenticated;

-- Verification after application (do not run automatically):
-- select id, age from public.participants where age is null or age < 14;
-- When this query returns no rows, validate the historical data constraint:
-- alter table public.participants validate constraint participants_event_age_check;
