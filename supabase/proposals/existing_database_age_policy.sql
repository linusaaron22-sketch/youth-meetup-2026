-- REVIEW PROPOSAL ONLY. Do not execute before reviewing the live schema snapshot.
--
-- This is the only database change justified by the live facts supplied so far:
-- participants_age_check currently permits ages 0 through 120, while the event
-- requires integer ages >= 14 with no event-policy upper limit.
--
-- This proposal deliberately does not replay 0001_init.sql or the complete
-- 0002_backend_reliability.sql. The live column/index/function/policy inventory
-- has not been supplied, so installing those objects safely requires a catalog
-- diff first. It does not update, delete, or rewrite any participant row.

begin;

do $$
declare
  v_age_type oid;
  v_constraint record;
  v_normalized text;
  v_has_target boolean := false;
  v_has_legacy boolean := false;
  v_legacy_count bigint;
begin
  if to_regclass('public.participants') is null then
    raise exception 'Preflight failed: public.participants is missing; no changes made.';
  end if;

  select a.atttypid into v_age_type
  from pg_attribute a
  where a.attrelid = 'public.participants'::regclass
    and a.attname = 'age'
    and a.attnum > 0
    and not a.attisdropped;

  if v_age_type is distinct from 'integer'::regtype::oid then
    raise exception 'Preflight failed: public.participants.age must be PostgreSQL integer; actual type OID is %. No changes made.', v_age_type;
  end if;

  -- Abort on any unrecognized age check instead of silently leaving a ceiling
  -- or dropping a constraint whose intent has not been reviewed.
  for v_constraint in
    select c.conname, pg_get_constraintdef(c.oid) as definition
    from pg_constraint c
    where c.conrelid = 'public.participants'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ~* '\mage\M'
  loop
    v_normalized := regexp_replace(lower(v_constraint.definition), '[^a-z0-9><=]', '', 'g');
    if v_constraint.conname = 'participants_age_check'
       and v_normalized = 'checkage>=0andage<=120' then
      v_has_legacy := true;
    elsif v_normalized = 'checkageisnotnullandage>=14' then
      v_has_target := true;
    else
      raise exception 'Preflight failed: unreviewed age constraint %: %. No changes made.',
        v_constraint.conname, v_constraint.definition;
    end if;
  end loop;

  select count(*) into v_legacy_count
  from public.participants
  where age is null or age < 14;
  raise notice 'Preflight: % existing participant rows are NULL or below age 14; this proposal preserves them unchanged.', v_legacy_count;

  if v_has_legacy then
    alter table public.participants drop constraint participants_age_check;
  end if;

  if not v_has_target then
    alter table public.participants
      add constraint participants_event_age_check
      check (age is not null and age >= 14) not valid;
  end if;
end;
$$;

commit;

-- Review queries (run separately after reviewing this proposal):
-- select conname, pg_get_constraintdef(oid), convalidated
-- from pg_constraint
-- where conrelid = 'public.participants'::regclass and contype = 'c';
-- select count(*) from public.participants where age is null or age < 14;
-- Only after the second query returns zero should the new constraint be validated.
-- alter table public.participants validate constraint participants_event_age_check;
