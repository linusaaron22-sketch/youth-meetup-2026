-- 1. Supabase Dashboard > Authentication > Users > "Add user" (create yourself and Craig, set passwords).
-- 2. Authentication > Sign In / Providers > turn OFF "Allow new users to sign up".
-- 3. Replace the emails below and run this in the SQL editor.
insert into public.admin_users (user_id, email)
select id, email from auth.users
where email in ('YOUR_EMAIL@example.com', 'CRAIG_EMAIL@example.com');
