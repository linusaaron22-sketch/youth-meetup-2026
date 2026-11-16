import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Verifies session AND membership in admin_users. Call in every admin page/action. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/admin/login?error=unauthorized");
  return { supabase, user };
}

export async function logActivity(
  supabase: SupabaseClient, user: User, action: string, entity: string, entityId?: string, details?: Record<string, unknown>,
) {
  const { error } = await supabase.from("activity_logs").insert({
    actor_id: user.id, actor_email: user.email, action, entity, entity_id: entityId ?? null, details: details ?? null,
  });
  if (error) throw new Error(`Could not record admin activity: ${error.message}`);
}
