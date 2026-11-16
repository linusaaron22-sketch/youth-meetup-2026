-- Existing Youth Meet Up database adoption hardening.
-- Requires 0001 to be verified as already present and recorded as applied,
-- then 0002_backend_reliability.sql to be applied successfully.
-- This migration preserves all application rows and is safe to re-run.

begin;

-- Fail closed before changing grants if the expected 0002 schema is incomplete,
-- the event age rule is not installed, historical ages need review, or an
-- unexpected public/anonymous RLS policy could expose rows.
do $$
declare
  v_age_count bigint;
  v_age_type oid;
  v_missing text;
  v_signature text;
  v_table text;
  v_expected_tables text[] := array[
    'admin_users', 'event_settings', 'registrations', 'registration_forms',
    'registration_fields', 'participants', 'emergency_contacts',
    'travel_companions', 'attendance', 'custom_responses', 'payments',
    'activity_logs', 'registration_submissions', 'registration_rate_limits',
    'registration_rate_limit_keys'
  ];
  v_expected_rpcs text[] := array[
    'public.is_admin()',
    'public.admin_participant_page(text,text,text,text,boolean,integer,timestamptz,uuid,text)',
    'public.admin_participant_export_ids(text,text,text,text,boolean)',
    'public.admin_overview_stats()',
    'public.consume_youth_registration_rate_limit(uuid,text)',
    'public.submit_youth_registration(uuid,text,jsonb,uuid,jsonb,jsonb,jsonb,jsonb)',
    'public.admin_check_in(uuid)',
    'public.admin_undo_check_in(uuid)',
    'public.admin_cancel_registration(uuid)',
    'public.admin_create_walk_in(jsonb,jsonb,uuid)',
    'public.admin_update_participant(uuid,jsonb)',
    'public.admin_update_emergency_contact(uuid,jsonb)',
    'public.admin_update_safeguarding(jsonb)',
    'public.admin_publish_form(jsonb)'
  ];
begin
  if current_user <> 'postgres' then
    raise exception 'Adoption preflight failed: run this migration as the Supabase postgres role so public-schema default privileges are updated safely.';
  end if;
  foreach v_table in array v_expected_tables loop
    if to_regclass(format('public.%I', v_table)) is null then
      raise exception 'Adoption preflight failed: expected public.% is missing. No privilege changes were made.', v_table;
    end if;
    if not exists (
      select 1 from pg_class c
      where c.oid = to_regclass(format('public.%I', v_table)) and c.relrowsecurity
    ) then
      raise exception 'Adoption preflight failed: RLS is not enabled on public.%. No privilege changes were made.', v_table;
    end if;
  end loop;
  if exists (
    select 1
    from (values
      ('registrations','cancelled_at'), ('registrations','cancelled_by'),
      ('participants','name_key'), ('participants','normalized_phone'),
      ('registration_submissions','submission_key'), ('registration_submissions','request_hash'),
      ('registration_submissions','registration_id'), ('registration_submissions','created_at'),
      ('registration_rate_limits','subject_hash'), ('registration_rate_limits','window_started_at'),
      ('registration_rate_limits','attempts'), ('registration_rate_limits','updated_at'),
      ('registration_rate_limit_keys','subject_hash'), ('registration_rate_limit_keys','submission_key'),
      ('registration_rate_limit_keys','created_at')
    ) as expected(table_name, column_name)
    where not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = expected.table_name
        and c.column_name = expected.column_name
    )
  ) then
    raise exception 'Adoption preflight failed: a column required by 0002 or the application is missing.';
  end if;
  if to_regprocedure('public.enforce_max_admins()') is null or not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'admin_users'
      and t.tgname = 'admin_users_max' and not t.tgisinternal
      and t.tgfoid = to_regprocedure('public.enforce_max_admins()')
  ) then
    raise exception 'Adoption preflight failed: baseline admin_users_max trigger/function is missing or mismatched.';
  end if;

  select count(*) into v_age_count
  from public.participants where age is null or age < 14;
  if v_age_count <> 0 then
    raise exception 'Adoption preflight failed: % participants have NULL or age < 14. Review/correct only with data-owner approval; no rows were changed.', v_age_count;
  end if;
  -- Schema-scoped REVOKE cannot cancel a global default grant. Fail before
  -- mutation if global defaults currently grant API roles on future tables.
  if exists (
    select 1
    from pg_default_acl d
    cross join lateral aclexplode(d.defaclacl) acl
    where d.defaclnamespace = 0
      and d.defaclobjtype = 'r'
      and (acl.grantee = 0 or acl.grantee in (
        (select oid from pg_roles where rolname = 'anon'),
        (select oid from pg_roles where rolname = 'authenticated')
      ))
  ) then
    raise exception 'Adoption preflight failed: global table default privileges grant API access; review them before applying schema-scoped hardening.';
  end if;
  select a.atttypid into v_age_type
  from pg_attribute a
  where a.attrelid = 'public.participants'::regclass
    and a.attname = 'age' and a.attnum > 0 and not a.attisdropped;
  if v_age_type is distinct from 'integer'::regtype::oid then
    raise exception 'Adoption preflight failed: public.participants.age must be PostgreSQL integer.';
  end if;
  if not exists (
    select 1 from pg_constraint c
    where c.conrelid = 'public.participants'::regclass
      and c.conname = 'participants_event_age_check'
      and c.contype = 'c'
      and regexp_replace(lower(pg_get_constraintdef(c.oid)), '[^a-z0-9><=]', '', 'g')
          = 'checkageisnotnullandage>=14'
  ) then
    raise exception 'Adoption preflight failed: participants_event_age_check is absent or differs from age IS NOT NULL AND age >= 14.';
  end if;
  if exists (
    select 1 from pg_constraint c
    where c.conrelid = 'public.participants'::regclass and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ~* '\mage\M'
      and c.conname <> 'participants_event_age_check'
  ) then
    raise exception 'Adoption preflight failed: an additional participant age check exists; review it for an upper-age restriction.';
  end if;

  foreach v_signature in array v_expected_rpcs loop
    if to_regprocedure(v_signature) is null then
      raise exception 'Adoption preflight failed: expected routine % is missing. Apply and verify 0002 first.', v_signature;
    end if;
  end loop;
  if exists (
    select 1
    from (values
      ('public.is_admin()', 'boolean'),
      ('public.admin_participant_page(text,text,text,text,boolean,integer,timestamptz,uuid,text)', 'jsonb'),
      ('public.admin_participant_export_ids(text,text,text,text,boolean)', 'jsonb'),
      ('public.admin_overview_stats()', 'jsonb'),
      ('public.consume_youth_registration_rate_limit(uuid,text)', 'boolean'),
      ('public.submit_youth_registration(uuid,text,jsonb,uuid,jsonb,jsonb,jsonb,jsonb)', 'uuid'),
      ('public.admin_check_in(uuid)', 'void'),
      ('public.admin_undo_check_in(uuid)', 'void'),
      ('public.admin_cancel_registration(uuid)', 'boolean'),
      ('public.admin_create_walk_in(jsonb,jsonb,uuid)', 'uuid'),
      ('public.admin_update_participant(uuid,jsonb)', 'void'),
      ('public.admin_update_emergency_contact(uuid,jsonb)', 'void'),
      ('public.admin_update_safeguarding(jsonb)', 'void'),
      ('public.admin_publish_form(jsonb)', 'integer')
    ) as expected(signature, result_type)
    where not exists (
      select 1 from pg_proc p
      where p.oid = to_regprocedure(expected.signature)
        and p.prorettype = expected.result_type::regtype
    )
  ) then
    raise exception 'Adoption preflight failed: an application RPC return type differs from the verified 0002 contract.';
  end if;
  if exists (
    select 1
    from (values
      ('public.is_admin()', true),
      ('public.admin_participant_page(text,text,text,text,boolean,integer,timestamptz,uuid,text)', false),
      ('public.admin_participant_export_ids(text,text,text,text,boolean)', false),
      ('public.admin_overview_stats()', false),
      ('public.consume_youth_registration_rate_limit(uuid,text)', false),
      ('public.submit_youth_registration(uuid,text,jsonb,uuid,jsonb,jsonb,jsonb,jsonb)', false),
      ('public.admin_check_in(uuid)', true),
      ('public.admin_undo_check_in(uuid)', true),
      ('public.admin_cancel_registration(uuid)', true),
      ('public.admin_create_walk_in(jsonb,jsonb,uuid)', true),
      ('public.admin_update_participant(uuid,jsonb)', true),
      ('public.admin_update_emergency_contact(uuid,jsonb)', true),
      ('public.admin_update_safeguarding(jsonb)', true),
      ('public.admin_publish_form(jsonb)', true)
    ) as expected(signature, is_security_definer)
    where not exists (
      select 1 from pg_proc p
      where p.oid = to_regprocedure(expected.signature)
        and p.prosecdef = expected.is_security_definer
    )
  ) then
    raise exception 'Adoption preflight failed: an application RPC security mode differs from the verified 0002 contract.';
  end if;

  if to_regclass('public.participant_duplicate_flags') is null or not exists (
    select 1 from pg_class c
    where c.oid = 'public.participant_duplicate_flags'::regclass
      and c.relkind = 'v'
      and coalesce(c.reloptions, array[]::text[]) @> array['security_invoker=true']::text[]
  ) then
    raise exception 'Adoption preflight failed: participant_duplicate_flags must exist as a security_invoker view.';
  end if;
  if not exists (
    select 1 from pg_constraint c
    where c.conrelid = 'public.registrations'::regclass
      and c.conname = 'registrations_cancelled_by_fkey'
      and c.contype = 'f'
  ) then
    raise exception 'Adoption preflight failed: registrations_cancelled_by_fkey is missing.';
  end if;
  if exists (
    select 1 from (values
      ('registrations_active_idx'), ('registrations_cancelled_idx'),
      ('registration_rate_limits_updated_idx'), ('registration_rate_limit_keys_created_idx')
    ) as expected(index_name)
    where not exists (
      select 1 from pg_class idx
      join pg_namespace ns on ns.oid = idx.relnamespace
      where ns.nspname = 'public' and idx.relname = expected.index_name and idx.relkind = 'i'
    )
  ) then
    raise exception 'Adoption preflight failed: one or more indexes from 0002 are missing.';
  end if;

  -- RLS policies are OR-combined. Do not proceed if any public/anon-targeted
  -- policy exists on a public table; review it rather than masking it here.
  select format('%I.%I / %I', p.schemaname, p.tablename, p.policyname)
  into v_missing
  from pg_policies p
  where p.schemaname = 'public'
    and (p.roles @> array['public']::name[] or p.roles @> array['anon']::name[])
  limit 1;
  if v_missing is not null then
    raise exception 'Adoption preflight failed: public/anon policy % needs manual review before privilege changes.', v_missing;
  end if;

  -- Ensure the known admin-only policy set is complete and has not been
  -- broadened by an additional permissive authenticated policy.
  if exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = any(v_expected_tables)
      and not (
        (p.tablename = 'admin_users' and p.policyname = 'admins read admin list')
        or (p.tablename in ('event_settings','registrations','participants','emergency_contacts',
            'travel_companions','attendance','custom_responses','payments')
            and p.policyname = 'admins full access')
        or (p.tablename = 'registration_forms' and p.policyname = 'admins read registration forms')
        or (p.tablename = 'registration_fields' and p.policyname = 'admins read registration fields')
        or (p.tablename = 'activity_logs' and p.policyname in ('admins read logs','admins write logs'))
      )
  ) then
    raise exception 'Adoption preflight failed: an unexpected RLS policy exists on an application table. Review policies before changing grants.';
  end if;
  if exists (
    select 1 from (values
      ('admin_users','admins read admin list'),
      ('event_settings','admins full access'), ('registrations','admins full access'),
      ('participants','admins full access'), ('emergency_contacts','admins full access'),
      ('travel_companions','admins full access'), ('attendance','admins full access'),
      ('custom_responses','admins full access'), ('payments','admins full access'),
      ('registration_forms','admins read registration forms'),
      ('registration_fields','admins read registration fields'),
      ('activity_logs','admins read logs'), ('activity_logs','admins write logs')
    ) as required(tablename, policyname)
    where not exists (
      select 1 from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = required.tablename
        and p.policyname = required.policyname
    )
  ) then
    raise exception 'Adoption preflight failed: one or more expected admin RLS policies are missing.';
  end if;
  if exists (
    select 1 from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = any(v_expected_tables)
      and (
        (p.policyname in ('admins full access','admins read registration forms','admins read registration fields','admins read logs')
          and coalesce(p.qual, '') not ilike '%is_admin%')
        or (p.policyname = 'admins full access'
          and coalesce(p.with_check, '') not ilike '%is_admin%')
        or (p.policyname = 'admins write logs'
          and coalesce(p.with_check, '') not ilike '%is_admin%')
        or (p.policyname = 'admins read admin list'
          and (coalesce(p.qual, '') not ilike '%is_admin%'
            or coalesce(p.qual, '') not ilike '%user_id%'
            or coalesce(p.qual, '') not ilike '%auth.uid%'))
      )
  ) then
    raise exception 'Adoption preflight failed: an expected policy does not enforce public.is_admin(). Review the policy expression.';
  end if;
  if exists (
    select 1 from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = any(v_expected_tables)
      and p.roles <> array['authenticated']::name[]
  ) then
    raise exception 'Adoption preflight failed: an application policy has unexpected role targets.';
  end if;
end;
$$;

-- Baseline RLS remains responsible for admin row filtering. Remove broad direct
-- grants that would let anonymous users reach public-table policies, then grant
-- only the reads needed by authenticated admin pages. Public registration and
-- the confirmation page use the server-only service_role client.
revoke all privileges on table
  public.admin_users,
  public.event_settings,
  public.registrations,
  public.registration_forms,
  public.registration_fields,
  public.participants,
  public.emergency_contacts,
  public.travel_companions,
  public.attendance,
  public.custom_responses,
  public.payments,
  public.activity_logs,
  public.registration_submissions,
  public.registration_rate_limits,
  public.registration_rate_limit_keys,
  public.participant_duplicate_flags
from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from public, anon, authenticated;
grant select on table
  public.admin_users,
  public.event_settings,
  public.registrations,
  public.registration_forms,
  public.registration_fields,
  public.participants,
  public.emergency_contacts,
  public.travel_companions,
  public.attendance,
  public.custom_responses,
  public.payments,
  public.activity_logs
to authenticated;
grant insert on table public.activity_logs to authenticated;

-- The server-only service-role client submits public registrations and reads
-- event configuration/confirmation names. It must never be sent to a browser.
grant all privileges on table
  public.admin_users,
  public.event_settings,
  public.registrations,
  public.registration_forms,
  public.registration_fields,
  public.participants,
  public.emergency_contacts,
  public.travel_companions,
  public.attendance,
  public.custom_responses,
  public.payments,
  public.activity_logs,
  public.registration_submissions,
  public.registration_rate_limits,
  public.registration_rate_limit_keys
to service_role;
grant select on table public.participant_duplicate_flags to authenticated;
revoke all privileges on table public.participant_duplicate_flags from public, anon;

-- A SECURITY DEFINER path may include public only because untrusted API roles
-- cannot create objects there after this revocation. pg_catalog is first and
-- pg_temp is last to prevent shadowing of built-ins or trusted objects.
revoke create on schema public from public, anon, authenticated;
alter function public.is_admin() set search_path = pg_catalog, public, pg_temp;
alter function public.enforce_max_admins() set search_path = pg_catalog, public, pg_temp;
alter function public.admin_check_in(uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.admin_undo_check_in(uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.admin_cancel_registration(uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.admin_create_walk_in(jsonb,jsonb,uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.admin_update_participant(uuid,jsonb) set search_path = pg_catalog, public, pg_temp;
alter function public.admin_update_emergency_contact(uuid,jsonb) set search_path = pg_catalog, public, pg_temp;
alter function public.admin_update_safeguarding(jsonb) set search_path = pg_catalog, public, pg_temp;
alter function public.admin_publish_form(jsonb) set search_path = pg_catalog, public, pg_temp;

-- Reconcile EXECUTE ACLs explicitly. Authenticated RPCs still enforce
-- public.is_admin() internally; registration and rate-limit RPCs are service-only.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.enforce_max_admins() from public, anon, authenticated;

revoke all on function public.admin_participant_page(text,text,text,text,boolean,integer,timestamptz,uuid,text) from public, anon;
grant execute on function public.admin_participant_page(text,text,text,text,boolean,integer,timestamptz,uuid,text) to authenticated;
revoke all on function public.admin_participant_export_ids(text,text,text,text,boolean) from public, anon;
grant execute on function public.admin_participant_export_ids(text,text,text,text,boolean) to authenticated;
revoke all on function public.admin_overview_stats() from public, anon;
grant execute on function public.admin_overview_stats() to authenticated;

revoke all on function public.consume_youth_registration_rate_limit(uuid,text) from public, anon, authenticated;
grant execute on function public.consume_youth_registration_rate_limit(uuid,text) to service_role;
revoke all on function public.submit_youth_registration(uuid,text,jsonb,uuid,jsonb,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.submit_youth_registration(uuid,text,jsonb,uuid,jsonb,jsonb,jsonb,jsonb) to service_role;

revoke all on function public.admin_check_in(uuid) from public, anon;
grant execute on function public.admin_check_in(uuid) to authenticated;
revoke all on function public.admin_undo_check_in(uuid) from public, anon;
grant execute on function public.admin_undo_check_in(uuid) to authenticated;
revoke all on function public.admin_cancel_registration(uuid) from public, anon;
grant execute on function public.admin_cancel_registration(uuid) to authenticated;
revoke all on function public.admin_create_walk_in(jsonb,jsonb,uuid) from public, anon;
grant execute on function public.admin_create_walk_in(jsonb,jsonb,uuid) to authenticated;
revoke all on function public.admin_update_participant(uuid,jsonb) from public, anon;
grant execute on function public.admin_update_participant(uuid,jsonb) to authenticated;
revoke all on function public.admin_update_emergency_contact(uuid,jsonb) from public, anon;
grant execute on function public.admin_update_emergency_contact(uuid,jsonb) to authenticated;
revoke all on function public.admin_update_safeguarding(jsonb) from public, anon;
grant execute on function public.admin_update_safeguarding(jsonb) to authenticated;
revoke all on function public.admin_publish_form(jsonb) from public, anon;
grant execute on function public.admin_publish_form(jsonb) to authenticated;

commit;
