# Youth Meet Up – Byculla Zoo · Registration

Next.js 15 · React 19 · TypeScript · Tailwind 3 · Supabase (Postgres + Auth) · React Hook Form + Zod · Framer Motion

## Setup (about 15 minutes)
1. Create a **new** Supabase project (free tier).
2. SQL editor → run `supabase/migrations/0001_init.sql`.
3. Authentication → Users → add yourself and Craig (email + password). Authentication → Sign In / Providers → turn **off** "Allow new users to sign up".
4. Edit the two emails in `supabase/seed_admins.sql`, run it. (A DB trigger blocks a third admin.)
5. `cp .env.example .env.local` and fill the three values (Project Settings → API).
6. `npm install && npm run dev` → http://localhost:3000, admin at `/admin`.
7. Verify: `npm run smoke` (real DB save, RLS lockout, duplicate check-in prevention), then `npm run typecheck && npm run lint && npm run build`.

## Environment variables
| Name | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client+server | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client+server | public anon key; RLS blocks it from all data |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | used only by public registration + smoke test. Never commit or prefix with NEXT_PUBLIC |

## Free hosting
- **Vercel Hobby**: import the repo, add the 3 env vars, deploy. Note: Hobby is for non-commercial use; a free church event fits. If you start charging fees through the site, consider Cloudflare instead.
- **Cloudflare Pages/Workers**: use the `@opennextjs/cloudflare` adapter; no code changes needed (no Node-only APIs besides `node:crypto`, which Workers supports with `nodejs_compat`).

## Security model
- RLS enabled on every table. Anonymous users have **no** direct access; only the logged-in admins listed in `admin_users` (via `is_admin()`).
- Public registration runs as a server action with Zod validation + honeypot; the service-role key never reaches the browser.
- `/admin/*` guarded by middleware **and** `requireAdmin()` in the layout and every server action. Activity log is insert/read-only.
