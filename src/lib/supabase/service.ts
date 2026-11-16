import "server-only";
import { createClient } from "@supabase/supabase-js";

// SERVER ONLY. Bypasses RLS – used solely by the public registration action.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing. See .env.example");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
