"use server";
import { createHmac } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { registrationSchema } from "@/lib/schemas";
import { getActiveForm, getSettings } from "@/lib/data";
import { getRegistrationRateLimitSubjectHash } from "@/lib/registration-rate-limit";
import { CHOICE_TYPES } from "@/lib/types";
import { isUuid } from "@/lib/utils";

export type SubmitResult =
  | { ok: true; registrationId: string }
  | { ok: false; error: string; params?: Record<string, string | number> };

const GENERIC = "err.generic";
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function submitRegistration(input: unknown, submissionKey: string): Promise<SubmitResult> {
  if (!isUuid(submissionKey)) return { ok: false, error: "err.form" };
  let subjectHash: string | null;
  try { subjectHash = await getRegistrationRateLimitSubjectHash(); }
  catch { subjectHash = null; }
  if (!subjectHash) return { ok: false, error: "err.rateLimitUnavailable" };
  let db: ReturnType<typeof createServiceClient>;
  try { db = createServiceClient(); }
  catch { return { ok: false, error: GENERIC }; }
  const { error: rateError } = await db.rpc("consume_youth_registration_rate_limit", {
    p_submission_key: submissionKey,
    p_subject_hash: subjectHash,
  });
  if (rateError) {
    if (rateError.message.includes("rate limit")) return { ok: false, error: "err.rateLimit" };
    console.error("Registration rate limit check failed", rateError.code);
    return { ok: false, error: GENERIC };
  }

  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "err.form" };
  const d = parsed.data;
  if (d.website) return { ok: false, error: GENERIC };

  let settings: Awaited<ReturnType<typeof getSettings>>;
  let form: Awaited<ReturnType<typeof getActiveForm>>;
  try {
    [settings, form] = await Promise.all([getSettings(db), getActiveForm(db)]);
  } catch (error) {
    console.error("Registration configuration could not be loaded", error instanceof Error ? error.name : "unknown error");
    return { ok: false, error: GENERIC };
  }
  if (!form.formId) return { ok: false, error: "err.formUnavailable" };

  const ages = [Number(d.primary.age), ...d.companions.map((c) => Number(c.age))];
  const hasMinor = ages.some((a) => a < settings.minor_age);
  if (hasMinor && settings.require_guardian_ack) {
    if (d.guardian.name.length < 2 || !PHONE_RE.test(d.guardian.phone) || !d.guardian.acknowledged) {
      return { ok: false, error: "err.guardian", params: { age: settings.minor_age } };
    }
  }

  const answers: { f: (typeof form.fields)[number]; value: unknown }[] = [];
  for (const f of form.fields.filter((x) => x.enabled)) {
    const v = d.custom[f.key];
    const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (f.required) return { ok: false, error: "err.answer", params: { label: f.label } };
      continue;
    }
    if (f.type === "number") {
      if (Number.isNaN(Number(v))) return { ok: false, error: "err.number", params: { label: f.label } };
      answers.push({ f, value: Number(v) });
    } else if (f.type === "checkboxes") {
      if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !f.options.includes(x))) return { ok: false, error: "err.invalidAnswer", params: { label: f.label } };
      answers.push({ f, value: v });
    } else if (typeof v !== "string" || v.length > 2000) {
      return { ok: false, error: "err.invalidAnswer", params: { label: f.label } };
    } else if (f.type === "yes_no" && !["Yes", "No"].includes(v)) {
      return { ok: false, error: "err.invalidAnswer", params: { label: f.label } };
    } else if (CHOICE_TYPES.includes(f.type) && !f.options.includes(v)) {
      return { ok: false, error: "err.invalidAnswer", params: { label: f.label } };
    } else if (f.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return { ok: false, error: "err.invalidDate", params: { label: f.label } };
    } else {
      answers.push({ f, value: v });
    }
  }

  const selfNames = d.selfRegisterNames.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).slice(0, 15);
  const primaryId = crypto.randomUUID();
  const people = [
    { id: primaryId, is_primary: true, fullName: d.primary.fullName, age: d.primary.age, phone: d.primary.phone, congregation: d.primary.congregation, relationship: "" },
    ...d.companions.map((c) => ({ id: crypto.randomUUID(), is_primary: false, fullName: c.fullName, age: c.age, phone: c.phone,
      congregation: c.congregation || d.primary.congregation, relationship: c.relationship })),
  ];
  const guardianApplies = (age: string) => Number(age) < settings.minor_age && settings.require_guardian_ack;
  const participants = people.map((p) => ({
    id: p.id, full_name: p.fullName, age: Number(p.age), phone: p.phone || null, congregation: p.congregation || null,
    is_primary: p.is_primary, guardian_name: guardianApplies(p.age) ? d.guardian.name : null,
    guardian_phone: guardianApplies(p.age) ? d.guardian.phone : null,
    guardian_ack: guardianApplies(p.age) ? d.guardian.acknowledged : null,
  }));
  const travelCompanions = [
    ...people.filter((p) => !p.is_primary).map((p) => ({
      primary_participant_id: primaryId, companion_participant_id: p.id, name: p.fullName,
      relationship: p.relationship || null, mode: "added",
    })),
    ...selfNames.map((name) => ({ primary_participant_id: primaryId, companion_participant_id: null, name, relationship: null, mode: "self_register" })),
  ];
  const customResponses = answers.map(({ f, value }) => ({
    participant_id: primaryId, field_id: f.id ?? null, field_key: f.key, field_label: f.label, field_type: f.type, value,
  }));
  const idempotencySecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!idempotencySecret) return { ok: false, error: GENERIC };
  const requestHash = createHmac("sha256", idempotencySecret).update(stableJson(d)).digest("hex");

  const { data: registrationId, error } = await db.rpc("submit_youth_registration", {
    p_submission_key: submissionKey,
    p_request_hash: requestHash,
    p_registration: { self_register_names: selfNames.join(", ") },
    p_form_id: form.formId,
    p_participants: participants,
    p_emergency_contacts: people.map((p) => ({ participant_id: p.id, name: d.emergency.name, relationship: d.emergency.relationship, phone: d.emergency.phone })),
    p_travel_companions: travelCompanions,
    p_custom_responses: customResponses,
  });
  if (error) {
    if (error.message.includes("rate limit")) return { ok: false, error: "err.rateLimit" };
    if (error.message.includes("form changed")) return { ok: false, error: "err.formChanged" };
    if (error.message.includes("already used for different data")) return { ok: false, error: "err.idempotencyConflict" };
    console.error("Atomic registration failed", error.code);
    return { ok: false, error: GENERIC };
  }
  if (typeof registrationId !== "string") return { ok: false, error: GENERIC };
  return { ok: true, registrationId };
}
