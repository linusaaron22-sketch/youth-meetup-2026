import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormField, Settings } from "@/lib/types";

export async function getSettings(db: SupabaseClient): Promise<Settings> {
  const { data, error } = await db.from("event_settings").select("event_name, event_date, minor_age, require_guardian_ack").eq("id", 1).single();
  if (error || !data) throw new Error(`Could not load event settings: ${error?.message ?? "settings row missing"}`);
  return {
    event_name: data?.event_name ?? "Youth Meet Up – Byculla Zoo",
    event_date: data?.event_date ?? "2026-11-21",
    minor_age: data?.minor_age ?? 18,
    require_guardian_ack: data?.require_guardian_ack ?? true,
  };
}

export async function getActiveForm(db: SupabaseClient): Promise<{ formId: string | null; version: number; fields: FormField[] }> {
  const { data: form, error: formError } = await db.from("registration_forms").select("id, version").eq("is_active", true).maybeSingle();
  if (formError) throw new Error(`Could not load active registration form: ${formError.message}`);
  if (!form) return { formId: null, version: 0, fields: [] };
  const { data, error } = await db.from("registration_fields").select("*").eq("form_id", form.id).order("sort_order");
  if (error) throw new Error(`Could not load registration questions: ${error.message}`);
  const fields = ((data ?? []) as FormField[]).map((f) => ({ ...f, options: Array.isArray(f.options) ? f.options : [] }));
  return { formId: form.id, version: form.version, fields };
}

/** Admin-only recovery source when a legacy/manual change left no form active. */
export async function getLatestForm(db: SupabaseClient): Promise<{ formId: string; version: number; fields: FormField[] } | null> {
  const { data: form, error: formError } = await db.from("registration_forms")
    .select("id, version").order("version", { ascending: false }).limit(1).maybeSingle();
  if (formError) throw new Error(`Could not load the latest registration form: ${formError.message}`);
  if (!form) return null;
  const { data, error } = await db.from("registration_fields").select("*").eq("form_id", form.id).order("sort_order");
  if (error) throw new Error(`Could not load the latest registration questions: ${error.message}`);
  const fields = ((data ?? []) as FormField[]).map((field) => ({ ...field, options: Array.isArray(field.options) ? field.options : [] }));
  return { formId: form.id, version: form.version, fields };
}
