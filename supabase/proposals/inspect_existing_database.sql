/*
  YOUTH MEET UP — READ-ONLY DATABASE INSPECTION (PostgreSQL 17)

  PURPOSE
  Compare the existing public schema with:
    - supabase/migrations/0001_init.sql
    - supabase/migrations/0002_backend_reliability.sql

  SAFETY
  Every executable statement below is a SELECT against PostgreSQL catalogs or
  information_schema. This script does not create, alter, grant, revoke, insert,
  update, delete, or apply migrations. It does not read environment variables.

  HOW TO RUN
  In Supabase Dashboard > SQL Editor, open a new query, paste this entire file,
  and run it. The editor may show one result grid per SELECT or only the selected
  statement. If it only shows one grid, run each numbered SELECT separately.
  Copy/download each grid as CSV, preserving the section number and column names.
  Do not include credentials or secret literals if sharing function definitions.
*/

-- ============================================================================
-- 1. PUBLIC TABLES AND COLUMNS
-- Includes declared data type, nullability, default, identity/generated
-- expression, and whether the table has RLS enabled/forced.
-- ============================================================================
select
  n.nspname as schema_name,
  c.relname as table_name,
  a.attnum as ordinal_position,
  a.attname as column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
  not a.attnotnull as is_nullable,
  pg_get_expr(ad.adbin, ad.adrelid) as default_expression,
  case a.attidentity when 'a' then 'ALWAYS' when 'd' then 'BY DEFAULT' else null end as identity_generation,
  case a.attgenerated when 's' then 'STORED' when 'v' then 'VIRTUAL' else null end as generated_kind,
  case when a.attgenerated <> '' then pg_get_expr(ad.adbin, ad.adrelid) else null end as generated_expression,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid
left join pg_attrdef ad on ad.adrelid = c.oid and ad.adnum = a.attnum
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and a.attnum > 0
  and not a.attisdropped
order by c.relname, a.attnum;

-- ============================================================================
-- 2. PRIMARY KEYS, FOREIGN KEYS, UNIQUE, CHECK, AND OTHER CONSTRAINTS
-- `definition` is PostgreSQL's full rendered constraint expression.
-- ============================================================================
select
  ns.nspname as schema_name,
  tbl.relname as table_name,
  con.conname as constraint_name,
  case con.contype
    when 'p' then 'PRIMARY KEY'
    when 'f' then 'FOREIGN KEY'
    when 'u' then 'UNIQUE'
    when 'c' then 'CHECK'
    when 'x' then 'EXCLUSION'
    else con.contype::text
  end as constraint_type,
  pg_get_constraintdef(con.oid, true) as definition,
  con.convalidated as is_validated,
  con.condeferrable as is_deferrable,
  con.condeferred as initially_deferred
from pg_constraint con
join pg_class tbl on tbl.oid = con.conrelid
join pg_namespace ns on ns.oid = tbl.relnamespace
where ns.nspname = 'public'
order by tbl.relname, con.contype, con.conname;

-- ============================================================================
-- 3. ALL PUBLIC INDEXES
-- Includes unique/primary/valid/ready flags, key and included columns, and the
-- full definition (including expressions and partial-index predicate).
-- ============================================================================
select
  tbl.relname as table_name,
  idx.relname as index_name,
  i.indisprimary as is_primary,
  i.indisunique as is_unique,
  i.indisvalid as is_valid,
  i.indisready as is_ready,
  i.indnullsnotdistinct as nulls_not_distinct,
  pg_get_expr(i.indpred, i.indrelid) as predicate,
  pg_get_indexdef(i.indexrelid) as definition
from pg_index i
join pg_class tbl on tbl.oid = i.indrelid
join pg_class idx on idx.oid = i.indexrelid
join pg_namespace ns on ns.oid = tbl.relnamespace
where ns.nspname = 'public'
order by tbl.relname, idx.relname;

-- ============================================================================
-- 4. ALL PUBLIC FUNCTIONS AND PROCEDURES
-- Includes exact identity signature, argument/result types, owner, language,
-- volatility, SECURITY DEFINER status, search_path/config, ACL, and full body.
-- Review returned definitions privately before sharing; source can contain
-- hard-coded literals even though this script reads no credentials/config.
-- ============================================================================
select
  n.nspname as schema_name,
  p.proname as routine_name,
  case p.prokind when 'p' then 'PROCEDURE' else 'FUNCTION' end as routine_kind,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as result_type,
  l.lanname as language,
  pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  p.provolatile as volatility,
  p.proparallel as parallel_safety,
  p.proleakproof as leakproof,
  p.proconfig as function_settings,
  p.proacl as explicit_acl,
  pg_get_functiondef(p.oid) as complete_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
  and p.prokind in ('f', 'p')
order by p.proname, pg_get_function_identity_arguments(p.oid);

-- ============================================================================
-- 5. ALL TRIGGERS AND THEIR ATTACHED TABLES/ROUTINES
-- Includes internal constraint triggers as well as user-created triggers.
-- ============================================================================
select
  table_ns.nspname as table_schema,
  tbl.relname as table_name,
  trg.tgname as trigger_name,
  trg.tgisinternal as is_internal,
  case trg.tgenabled when 'O' then 'origin/local' when 'D' then 'disabled'
    when 'R' then 'replica' when 'A' then 'always' else trg.tgenabled::text end as enabled_mode,
  proc_ns.nspname as function_schema,
  proc.proname as function_name,
  pg_get_function_identity_arguments(proc.oid) as function_arguments,
  pg_get_triggerdef(trg.oid, true) as definition
from pg_trigger trg
join pg_class tbl on tbl.oid = trg.tgrelid
join pg_namespace table_ns on table_ns.oid = tbl.relnamespace
join pg_proc proc on proc.oid = trg.tgfoid
join pg_namespace proc_ns on proc_ns.oid = proc.pronamespace
where table_ns.nspname = 'public'
order by tbl.relname, trg.tgname;

-- ============================================================================
-- 6. RLS STATE AND POLICIES
-- Policies include command, role targets, USING, and WITH CHECK expressions.
-- ============================================================================
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

select
  schemaname as schema_name,
  tablename as table_name,
  policyname as policy_name,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- ============================================================================
-- 7A. FUNCTION EXECUTION ACLS
-- Shows explicit/default ACL entries and effective EXECUTE for common Supabase
-- roles when those roles exist in this project.
-- ============================================================================
select
  n.nspname as schema_name,
  p.proname as routine_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  case when acl.grantee = 0 then 'PUBLIC' else gr.rolname end as grantee,
  acl.privilege_type,
  acl.is_grantable,
  case when acl.grantee = 0 then null
    else has_function_privilege(gr.oid, p.oid, 'EXECUTE') end as grantee_has_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
left join pg_roles gr on gr.oid = acl.grantee
where n.nspname = 'public'
  and p.prokind in ('f', 'p')
order by p.proname, pg_get_function_identity_arguments(p.oid), grantee, acl.privilege_type;

-- Effective execution checks for Supabase API roles, even when a permission
-- comes from PUBLIC or role membership rather than a direct grant.
select
  p.proname as routine_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  r.rolname as checked_role,
  has_function_privilege(r.oid, p.oid, 'EXECUTE') as can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join pg_roles r
where n.nspname = 'public'
  and p.prokind in ('f', 'p')
  and r.rolname in ('anon', 'authenticated', 'service_role')
order by p.proname, pg_get_function_identity_arguments(p.oid), r.rolname;

-- ============================================================================
-- 7B. TABLE-LEVEL AND COLUMN-LEVEL PRIVILEGES
-- ACL expansion includes default PUBLIC privileges when no explicit ACL exists.
-- ============================================================================
select
  n.nspname as schema_name,
  c.relname as table_name,
  case when acl.grantee = 0 then 'PUBLIC' else gr.rolname end as grantee,
  acl.privilege_type,
  acl.is_grantable,
  'table'::text as privilege_scope,
  null::text as column_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
left join pg_roles gr on gr.oid = acl.grantee
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm')

union all

select
  n.nspname,
  c.relname,
  case when acl.grantee = 0 then 'PUBLIC' else gr.rolname end,
  acl.privilege_type,
  acl.is_grantable,
  'column'::text,
  a.attname
from pg_attribute a
join pg_class c on c.oid = a.attrelid
join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(a.attacl) acl
left join pg_roles gr on gr.oid = acl.grantee
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm')
  and a.attnum > 0
  and not a.attisdropped
  and a.attacl is not null
order by table_name, privilege_scope, column_name nulls first, grantee, privilege_type;

-- ============================================================================
-- 7C. DEFAULT PRIVILEGES
-- These affect objects created in the future by a particular owner; they are
-- distinct from ACLs already attached to existing tables/functions.
-- ============================================================================
select
  pg_get_userbyid(d.defaclrole) as object_owner,
  case when d.defaclnamespace = 0 then '(all schemas)' else n.nspname end as schema_scope,
  case d.defaclobjtype
    when 'r' then 'tables/views'
    when 'S' then 'sequences'
    when 'f' then 'functions'
    when 'T' then 'types'
    when 'n' then 'schemas'
    else d.defaclobjtype::text
  end as object_type,
  case when acl.grantee = 0 then 'PUBLIC' else gr.rolname end as grantee,
  acl.privilege_type,
  acl.is_grantable
from pg_default_acl d
left join pg_namespace n on n.oid = d.defaclnamespace
cross join lateral aclexplode(d.defaclacl) acl
left join pg_roles gr on gr.oid = acl.grantee
where d.defaclnamespace = 0 or n.nspname = 'public'
order by object_owner, schema_scope, object_type, grantee, acl.privilege_type;

-- ============================================================================
-- 8. VIEWS AND DEFINITIONS
-- Includes ordinary and materialized views. `security_invoker` is shown from
-- reloptions where PostgreSQL records the view option.
-- ============================================================================
select
  n.nspname as schema_name,
  c.relname as view_name,
  case c.relkind when 'v' then 'VIEW' when 'm' then 'MATERIALIZED VIEW' end as view_kind,
  c.reloptions,
  coalesce(
    (select split_part(option_value, '=', 2)
     from unnest(c.reloptions) as ro(option_value)
     where option_value like 'security_invoker=%'
     limit 1),
    'false (or option not recorded)'
  ) as security_invoker,
  pg_get_viewdef(c.oid, true) as definition
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('v', 'm')
order by c.relname;

-- ============================================================================
-- 9. OBJECTS EXPECTED BY 0002_BACKEND_RELIABILITY.SQL
-- Reports PRESENT/MISSING by exact object identity. A present name does not
-- prove its definition matches the migration; compare sections 2–8 as well.
-- ============================================================================
with expected(object_type, object_name, identity_arguments) as (
  values
    ('table', 'registration_submissions', null::text),
    ('table', 'registration_rate_limits', null::text),
    ('table', 'registration_rate_limit_keys', null::text),
    ('column', 'registration_submissions.submission_key', null::text),
    ('column', 'registration_submissions.request_hash', null::text),
    ('column', 'registration_submissions.registration_id', null::text),
    ('column', 'registration_submissions.created_at', null::text),
    ('column', 'registration_rate_limits.subject_hash', null::text),
    ('column', 'registration_rate_limits.window_started_at', null::text),
    ('column', 'registration_rate_limits.attempts', null::text),
    ('column', 'registration_rate_limits.updated_at', null::text),
    ('column', 'registration_rate_limit_keys.subject_hash', null::text),
    ('column', 'registration_rate_limit_keys.submission_key', null::text),
    ('column', 'registration_rate_limit_keys.created_at', null::text),
    ('column', 'registrations.cancelled_at', null::text),
    ('column', 'registrations.cancelled_by', null::text),
    ('index', 'registrations_active_idx', null::text),
    ('index', 'registrations_cancelled_idx', null::text),
    ('index', 'registration_rate_limits_updated_idx', null::text),
    ('index', 'registration_rate_limit_keys_created_idx', null::text),
    ('constraint', 'participants_event_age_check', null::text),
    ('constraint', 'registrations_cancelled_by_fkey', null::text),
    ('constraint', 'registration_submissions_pkey', null::text),
    ('constraint', 'registration_submissions_registration_id_key', null::text),
    ('constraint', 'registration_submissions_registration_id_fkey', null::text),
    ('constraint', 'registration_rate_limits_pkey', null::text),
    ('constraint', 'registration_rate_limits_attempts_check', null::text),
    ('constraint', 'registration_rate_limit_keys_pkey', null::text),
    ('view', 'participant_duplicate_flags', null::text),
    ('policy', 'admins read registration forms', 'registration_forms'),
    ('policy', 'admins read registration fields', 'registration_fields'),
    ('policy_absent', 'admins full access', 'registration_forms'),
    ('policy_absent', 'admins full access', 'registration_fields'),
    ('function', 'admin_participant_page', 'text, text, text, text, boolean, integer, timestamp with time zone, uuid, text'),
    ('function', 'admin_participant_export_ids', 'text, text, text, text, boolean'),
    ('function', 'admin_overview_stats', ''),
    ('function', 'consume_youth_registration_rate_limit', 'uuid, text'),
    ('function', 'submit_youth_registration', 'uuid, text, jsonb, uuid, jsonb, jsonb, jsonb, jsonb'),
    ('function', 'admin_check_in', 'uuid'),
    ('function', 'admin_undo_check_in', 'uuid'),
    ('function', 'admin_cancel_registration', 'uuid'),
    ('function', 'admin_create_walk_in', 'jsonb, jsonb, uuid'),
    ('function', 'admin_update_participant', 'uuid, jsonb'),
    ('function', 'admin_update_emergency_contact', 'uuid, jsonb'),
    ('function', 'admin_update_safeguarding', 'jsonb'),
    ('function', 'admin_publish_form', 'jsonb')
)
select
  e.object_type,
  e.object_name,
  e.identity_arguments,
  case e.object_type
    when 'table' then case when to_regclass('public.' || e.object_name) is null then 'MISSING' else 'PRESENT' end
    when 'column' then case when exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public'
        and (c.table_name || '.' || c.column_name) = e.object_name
    ) then 'PRESENT' else 'MISSING' end
    when 'index' then case when exists (
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'i' and c.relname = e.object_name
    ) then 'PRESENT' else 'MISSING' end
    when 'constraint' then case when exists (
      select 1 from pg_constraint c join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public' and c.conname = e.object_name
    ) then 'PRESENT' else 'MISSING' end
    when 'view' then case when exists (
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('v','m') and c.relname = e.object_name
    ) then 'PRESENT' else 'MISSING' end
    when 'policy' then case when exists (
      select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = e.identity_arguments and p.policyname = e.object_name
    ) then 'PRESENT' else 'MISSING' end
    when 'policy_absent' then case when exists (
      select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = e.identity_arguments and p.policyname = e.object_name
    ) then 'UNEXPECTED PRESENT' else 'ABSENT AS EXPECTED' end
    when 'function' then case when exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = e.object_name and p.prokind = 'f'
        and pg_get_function_identity_arguments(p.oid) = e.identity_arguments
    ) then 'PRESENT' else 'MISSING' end
  end as status
from expected e
order by e.object_type, e.object_name;

-- 0002 also changes the registration_forms/registration_fields policies and
-- creates/replaces the following expected admin functions. Review their actual
-- definitions, SECURITY DEFINER/search_path, ACLs, and dependencies above.
-- It creates no triggers. Its two age-related constraints are represented in
-- the expected-object list above and in section 2.

-- ============================================================================
-- 10. CATALOG-RECORDED DEPENDENCIES
-- `pg_depend` reports dependencies PostgreSQL records (for example, view-to-
-- table, trigger-to-function/table, and constraint-to-table). PL/pgSQL bodies
-- may contain table references that PostgreSQL does not record as dependencies;
-- inspect complete function definitions in section 4 for those references.
-- ============================================================================
select
  pg_describe_object(d.classid, d.objid, d.objsubid) as dependent_object,
  pg_describe_object(d.refclassid, d.refobjid, d.refobjsubid) as referenced_object,
  d.deptype as dependency_type
from pg_depend d
where pg_describe_object(d.classid, d.objid, d.objsubid) like '%public.%'
   or pg_describe_object(d.refclassid, d.refobjid, d.refobjsubid) like '%public.%'
order by dependent_object, referenced_object, d.deptype;

-- ============================================================================
-- 11. ADDITIONAL DATABASE VERSION / EXTENSION CONTEXT
-- Version output is limited to server version metadata; no settings or secrets.
-- ============================================================================
select version() as postgres_version;

select extname as extension_name, extversion as extension_version
from pg_extension
order by extname;

-- ============================================================================
-- 12. READ-ONLY DATA PREFLIGHT FOR THE ADOPTION MIGRATIONS
-- Capture these result grids before and after staging. The rows/counts are
-- inspected only; this script does not change them.
-- ============================================================================
select id, age
from public.participants
order by id;

select
  count(*) as participant_count,
  count(*) filter (where age is null or age < 14) as null_or_under_14_count,
  count(*) filter (where age >= 14) as eligible_age_count,
  min(age) as minimum_stored_age,
  max(age) as maximum_stored_age
from public.participants;

select
  count(*) as orphaned_cancellation_actor_count
from public.activity_logs al
left join auth.users u on u.id = al.actor_id
where al.action = 'cancel_registration'
  and al.entity = 'registration'
  and al.actor_id is not null
  and u.id is null;

select
  count(*) as cancellation_log_count,
  count(*) filter (where r.id is null) as logs_without_matching_registration,
  count(*) filter (where r.id is not null and r.cancelled_at is null) as registrations_to_backfill
from public.activity_logs al
left join public.registrations r
  on r.id::text = al.entity_id
where al.action = 'cancel_registration'
  and al.entity = 'registration';

select 'registrations' as table_name, count(*) as row_count from public.registrations
union all select 'participants', count(*) from public.participants
union all select 'attendance', count(*) from public.attendance
union all select 'emergency_contacts', count(*) from public.emergency_contacts
union all select 'travel_companions', count(*) from public.travel_companions
union all select 'payments', count(*) from public.payments
union all select 'registration_forms', count(*) from public.registration_forms
union all select 'registration_fields', count(*) from public.registration_fields
union all select 'custom_responses', count(*) from public.custom_responses
union all select 'activity_logs', count(*) from public.activity_logs
order by table_name;

select
  (select count(*) from public.registration_forms where is_active) as active_form_count,
  (select count(*) from public.registration_forms) as form_version_count,
  (select count(*) from public.custom_responses) as historical_response_count;

select to_regclass('supabase_migrations.schema_migrations') as migration_history_table;
