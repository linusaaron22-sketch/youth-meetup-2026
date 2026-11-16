# Development status

## Reliability pass

This pass tightens the age check, preserves cancellation audit logs when old actor IDs no longer exist, keeps form publication inside its admin RPC, adds a recovery route for a missing active form, and uses database-filtered/keyset participant pages plus a fixed participant-ID snapshot for CSV export. Registration retries keep only an opaque UUID in tab-scoped `sessionStorage`; participant data is not written to browser storage. The Vercel rate limiter accepts only one valid `x-vercel-forwarded-for` address and stores its HMAC digest, not the raw address.

No Supabase migration was applied and no live data was queried or changed. No environment values were inspected or reported, and `.env.local` was not edited. `0002_backend_reliability.sql` is modified in place because the prior development record says it has not been applied. Before deployment, confirm the intended Youth Meet Up Supabase migration history does not already record version 0002. If it does, do not edit/re-run it; move these SQL changes into a new follow-up migration.

## Migration and historical data

Before applying `supabase/migrations/0002_backend_reliability.sql`, run these read-only checks in the intended Youth Meet Up database and review the returned rows/counts with the data owner:

```sql
select id, age
from public.participants
where age is null or age < 14;

select count(*) as orphaned_cancellation_actor_ids
from public.activity_logs al
left join auth.users u on u.id = al.actor_id
where al.action = 'cancel_registration'
  and al.entity = 'registration'
  and al.actor_id is not null
  and u.id is null;
```

The event rule is age 14 or older with no age-eligibility ceiling. The migration removes the legacy `participants_age_check` (0–120) and adds `age IS NOT NULL AND age >= 14` as `NOT VALID`. It reports but preserves historical NULL/under-14 values and rejects them on new or updated participant rows. PostgreSQL check constraints are rechecked on any update, so admins may be unable to edit an affected historical row until its age is manually corrected under an approved data-cleanup process. Participant ages are not rewritten; the four existing records aged 18, 20, 20, and 20 remain unchanged. The cancellation backfill preserves all activity logs and sets `cancelled_by` to NULL only where the historical actor is absent from `auth.users`; cancellation time/status still comes from the audit log.

The migration uses `security_invoker` view syntax and requires PostgreSQL 15 or newer. Confirm the actual Supabase database version. Migration SQL was not parsed or executed against PostgreSQL in this environment; no `psql` or Supabase CLI was available.

The admin form tables become read-only through authenticated PostgREST access. Form changes must use the validating `admin_publish_form` RPC. Its transaction and the existing unique active-form index prevent the normal workflow from committing zero or multiple active forms. If no active form exists, the Form Builder loads the latest saved version for republishing; if none exists, it can publish the standard registration form with no custom questions. A database owner/service-role operator can still bypass application policy through privileged SQL/API access.

## Vercel rate limiting

Vercel sets `VERCEL=1` and documents `x-vercel-forwarded-for` as the request client-IP header. The implementation accepts it only as one syntactically valid IPv4/IPv6 address; it does not fall back to arbitrary `x-forwarded-for` values or accept comma-separated chains. Direct Vercel hosting needs no added environment variable for IP detection. Existing `SUPABASE_SERVICE_ROLE_KEY` is required to HMAC the address. If the trusted header is absent/invalid or the app is behind an unconfigured proxy, production registration fails closed with a temporary-unavailable message. Only an HMAC digest is stored in the rate-limit tables; raw IP values are not persisted.

If using a proxy in front of Vercel, configure Vercel's Trusted Proxy feature for that proxy or send traffic directly to Vercel. Do not add a user-controlled forwarding header as a fallback. Verify preview and production headers with a real Vercel deployment before opening registration.

## Hindi and custom form content

The fixed public UI remains bilingual and the existing Hindi strings are unchanged. Dynamic administrator-created labels, help text, and choice options are single-language database values and are displayed as authored. A full bilingual custom-form solution should be proposed before implementation: add optional Hindi label/help/option values (or a structured translation object), keep English as fallback, update the admin editor and public renderer, and retain the existing field keys/responses. This pass does not change that data model.

## Verification

- `npm.cmd run typecheck -- --incremental false` — passed.
- `npm.cmd run lint` — passed with one warning: unused `action` at `src/components/StitchWildlifeScene.tsx:10`.
- `npm.cmd run i18n:check` — passed all 12 checks (89 English/Hindi keys).
- `npm.cmd run build` — final attempt passed, including production compilation, lint/type validation, static page generation, and route tracing. An earlier attempt in the same OneDrive workspace failed transiently with `EINVAL: invalid argument, readlink '...\\.next\\types\\app'`; the later normal build completed successfully.
- No PostgreSQL parser, live Supabase query, migration execution, or staging smoke test was run.

## Manual testing before staging

1. Review the age and orphan-actor preflight results before migration; verify age 13 is rejected and ages 14, 15, and older values are accepted for public registration, companions, admin edits, and walk-ins. Test edits to historical under-14/NULL rows in staging.
2. Submit individual and group registrations, simulate lost responses and page refreshes, retry identical data, submit changed data, and test simultaneous submissions.
3. Create walk-ins with and without emergency contacts; verify attendance and audit entries commit together.
4. Check in, undo check-in, cancel registrations, and attempt check-in on cancelled participants; verify active counts and audit history.
5. Edit participant and emergency details, including historical rows affected by the age constraint.
6. Publish valid/invalid form changes concurrently, verify old responses remain, test the missing-active-form recovery path, and confirm authenticated direct table writes are denied.
7. Test English/Hindi switching and persistence, plus authored custom labels/options in both languages. Dynamic fields are not automatically translated yet.
8. Exercise search, duplicate/status/source/cancellation filters, cursor pagination, and CSV during concurrent registrations/cancellations; verify one output row per snapshotted participant.
9. On Vercel, verify the platform header, spoofed/missing headers, rate-limit behavior, and fail-closed behavior through the actual proxy path.

## Readiness

Ready for controlled staging validation, not production. The final local build passed, but migration SQL has not been parsed/applied in a matching Supabase staging database, historical preflight values are unknown, the deployed migration history must be checked, and Vercel headers require deployment verification.

## Existing database adoption follow-up — 2026-11-17

The supplied live inventory reports all 13 `0001_init.sql` tables, the baseline age constraint, baseline admin functions/trigger, RLS on all baseline tables, broad `anon`/`authenticated` grants, and no `0002_backend_reliability.sql` objects. `supabase/migrations/0003_existing_database_adoption.sql` is a transactional, repeatable post-0002 hardening migration. It fails closed unless 0002 tables/RPCs, the age >=14 check, the duplicate view, RLS, and a clean age preflight are present. It revokes broad API table privileges, grants admin reads under existing RLS, preserves admin activity-log inserts, restricts rate-limit/registration writes to `service_role`, and pins routine search paths. It does not rewrite business records.

Do not run `supabase db push` while migration history is empty. First compare the live catalog with every object from 0001. Only if it matches should migration version 0001 be recorded as already applied; do not mark 0002 applied because its reliability objects are reported missing. Then preview the pending 0002/0003 changes, test both on a clean database and staging schema copy, and apply only after reviewing backup/recovery status and data preflight. `0002` still contains one-time, non-idempotent DDL and must only be run after confirming its target objects are absent.

The real-database smoke script now refuses database writes unless `SMOKE_TEST_ALLOW_DATABASE_WRITES=1` is explicitly set for an approved staging project. It tests ages 14 and 130 as accepted, age 13 as rejected, and treats either a permission-denied response or an empty RLS result as anonymous read denial. It was not run because no staging target was verified. Supabase CLI, Vercel CLI, and Vercel project linkage were not available in this workspace; no deployment or live database operation was attempted.

Verification on 2026-11-17: TypeScript passed; ESLint passed with the existing unused `action` warning in `StitchWildlifeScene.tsx`; all 12 i18n checks passed; production build passed with that same warning; `node --check scripts/smoke-test.mjs` passed. No PostgreSQL parser/staging instance was available, so migration SQL was not executed or database-tested. No app browser flow, staging smoke run, production migration, or Vercel deployment was performed.
