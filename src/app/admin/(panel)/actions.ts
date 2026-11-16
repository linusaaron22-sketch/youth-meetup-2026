"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ageField, nameField, phoneOptional, phoneRequired, walkInSchema } from "@/lib/schemas";
import { getActiveForm } from "@/lib/data";
import { isUuid, safeBack } from "@/lib/utils";
import { translate } from "@/lib/i18n/messages";
import { CHOICE_TYPES, FIELD_TYPES, type FormField } from "@/lib/types";

const m = (key: string | undefined, fallback: string) => translate("en", key ?? fallback);
function done(path: string, kind: "error" | "ok", msg: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`);
}
const backOf = (fd: FormData, fallback: string) => safeBack(String(fd.get("back") ?? ""), fallback);
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function checkIn(fd: FormData) {
  const { supabase } = await requireAdmin();
  const path = backOf(fd, "/admin/checkin");
  const id = s(fd, "participantId");
  if (!isUuid(id)) done(path, "error", "Invalid participant.");
  const { error } = await supabase.rpc("admin_check_in", { p_participant_id: id });
  if (error) done(path, "error", error.code === "23505" ? "Already checked in; no duplicate was recorded." : error.message.includes("cancelled") ? "This registration has been cancelled and cannot be checked in." : "Could not check in.");
  revalidatePath("/admin", "layout");
  done(path, "ok", "Checked in.");
}

export async function undoCheckIn(fd: FormData) {
  const { supabase } = await requireAdmin();
  const path = backOf(fd, "/admin/checkin");
  const id = s(fd, "participantId");
  if (!isUuid(id)) done(path, "error", "Invalid participant.");
  const { error } = await supabase.rpc("admin_undo_check_in", { p_participant_id: id });
  if (error) done(path, "error", "Could not undo check-in. The attendance and audit records were left unchanged.");
  revalidatePath("/admin", "layout");
  done(path, "ok", "Check-in removed.");
}

export async function cancelRegistration(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = s(fd, "registrationId");
  const path = backOf(fd, "/admin/participants");
  if (!isUuid(id)) done(path, "error", "Invalid registration.");
  const { data, error } = await supabase.rpc("admin_cancel_registration", { p_registration_id: id });
  if (error) done(path, "error", "Could not cancel this registration.");
  revalidatePath("/admin", "layout");
  done(path, "ok", data ? "Registration cancelled. Its records remain available in the cancelled registrations list." : "This registration was already cancelled.");
}

export async function updateParticipant(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = s(fd, "participantId");
  const path = `/admin/participants/${id}`;
  if (!isUuid(id)) redirect("/admin/participants");
  const parsed = z.object({ fullName: nameField, age: ageField, phone: phoneOptional, congregation: z.string().trim().max(120) })
    .safeParse({ fullName: fd.get("fullName"), age: fd.get("age"), phone: fd.get("phone"), congregation: fd.get("congregation") });
  if (!parsed.success) done(path, "error", m(parsed.error.issues[0]?.message, "Invalid details."));
  const { error } = await supabase.rpc("admin_update_participant", { p_participant_id: id, p_values: {
    full_name: parsed.data.fullName, age: Number(parsed.data.age), phone: parsed.data.phone || null, congregation: parsed.data.congregation || null,
  } });
  if (error) done(path, "error", "Could not save changes.");
  revalidatePath("/admin", "layout");
  done(path, "ok", "Details saved.");
}

export async function updateEmergency(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = s(fd, "participantId");
  const path = `/admin/participants/${id}`;
  if (!isUuid(id)) redirect("/admin/participants");
  const parsed = z.object({ name: nameField, relationship: z.string().trim().min(2).max(60), phone: phoneRequired })
    .safeParse({ name: fd.get("name"), relationship: fd.get("relationship"), phone: fd.get("phone") });
  if (!parsed.success) done(path, "error", m(parsed.error.issues[0]?.message, "Invalid emergency contact."));
  const { error } = await supabase.rpc("admin_update_emergency_contact", { p_participant_id: id, p_values: parsed.data });
  if (error) done(path, "error", "Could not save emergency contact.");
  revalidatePath("/admin", "layout");
  done(path, "ok", "Emergency contact saved.");
}

export async function createWalkIn(fd: FormData) {
  const { supabase } = await requireAdmin();
  const path = "/admin/walkins";
  const parsed = walkInSchema.safeParse({ fullName: fd.get("fullName"), age: fd.get("age"), phone: fd.get("phone"), congregation: fd.get("congregation") });
  if (!parsed.success) done(path, "error", m(parsed.error.issues[0]?.message, "Invalid details."));
  const ecName = s(fd, "ecName").trim(), ecRel = s(fd, "ecRelationship").trim(), ecPhone = s(fd, "ecPhone").trim();
  const hasEmergency = Boolean(ecName || ecRel || ecPhone);
  if (hasEmergency && !z.object({ a: nameField, b: z.string().min(2).max(60), c: phoneRequired }).safeParse({ a: ecName, b: ecRel, c: ecPhone }).success)
    done(path, "error", "Emergency contact needs name, relationship and a valid phone, or leave all three empty.");
  let form: Awaited<ReturnType<typeof getActiveForm>>;
  try { form = await getActiveForm(supabase); }
  catch { done(path, "error", "Could not verify the active registration form."); }
  if (!form.formId) done(path, "error", "Could not add a walk-in while the active registration form is missing.");
  const participantId = randomUUID();
  const { error } = await supabase.rpc("admin_create_walk_in", {
    p_participant: { id: participantId, full_name: parsed.data.fullName, age: Number(parsed.data.age), phone: parsed.data.phone || null, congregation: parsed.data.congregation || null },
    p_emergency: hasEmergency ? { name: ecName, relationship: ecRel, phone: ecPhone } : null,
    p_form_id: form.formId,
  });
  if (error) done(path, "error", "Could not save walk-in. No partial walk-in or attendance record was created.");
  revalidatePath("/admin", "layout");
  done(path, "ok", `${parsed.data.fullName} added and marked present.`);
}

export async function saveSafeguardingSettings(fd: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = z.object({ minor_age: z.coerce.number().int().min(0).max(25), require_guardian_ack: z.boolean() })
    .safeParse({ minor_age: fd.get("minor_age"), require_guardian_ack: fd.get("require_guardian_ack") === "on" });
  if (!parsed.success) done("/admin", "error", "Please check the safeguarding settings.");
  const { error } = await supabase.rpc("admin_update_safeguarding", { p_values: parsed.data });
  if (error) done("/admin", "error", "Could not save safeguarding settings.");
  revalidatePath("/admin", "layout");
  revalidatePath("/register");
  done("/admin", "ok", "Settings saved.");
}

const fieldSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]{2,40}$/),
  label: z.string().trim().min(1, "Every question needs a label").max(200),
  help_text: z.string().trim().max(300).nullable(),
  type: z.enum(FIELD_TYPES.map((t) => t.value) as [string, ...string[]]),
  options: z.array(z.string().trim().min(1).max(100)).max(30),
  required: z.boolean(),
  enabled: z.boolean(),
  sort_order: z.number().int(),
}).refine((field) => !CHOICE_TYPES.includes(field.type as FormField["type"]) || field.options.length >= 2, "Choice questions need at least two options");

export async function publishForm(fields: FormField[]): Promise<{ ok: boolean; error?: string; version?: number }> {
  const { supabase } = await requireAdmin();
  const parsed = z.array(fieldSchema).max(60).safeParse(fields);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid form." };
  const keys = parsed.data.map((field) => field.key);
  if (new Set(keys).size !== keys.length) return { ok: false, error: "Duplicate question keys." };
  const p_fields = parsed.data.map((field, index) => ({ ...field, help_text: field.help_text || null, sort_order: index,
    options: CHOICE_TYPES.includes(field.type as FormField["type"]) ? field.options : [] }));
  const { data: version, error } = await supabase.rpc("admin_publish_form", { p_fields });
  if (error || typeof version !== "number") return { ok: false, error: "Could not publish the form. No new version was activated; retry or ask an administrator to review the form state." };
  revalidatePath("/register");
  revalidatePath("/admin/forms");
  return { ok: true, version };
}
