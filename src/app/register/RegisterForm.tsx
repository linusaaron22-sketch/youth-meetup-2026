"use client";
import { useRef, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { registrationSchema, type RegistrationInput } from "@/lib/schemas";
import type { FormField } from "@/lib/types";
import FieldInput from "@/components/FieldInput";
import { submitRegistration } from "./actions";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { isUuid } from "@/lib/utils";

const STEP_KEYS = ["reg.step1", "reg.step2", "reg.step3"] as const;
const SUBMISSION_KEY_STORAGE = "youth-meetup:registration-retry-key";

function readRetryKey(): string | null {
  try {
    const value = sessionStorage.getItem(SUBMISSION_KEY_STORAGE);
    return value && isUuid(value) ? value : null;
  } catch { return null; }
}

function writeRetryKey(value: string | null) {
  try {
    if (value) sessionStorage.setItem(SUBMISSION_KEY_STORAGE, value);
    else sessionStorage.removeItem(SUBMISSION_KEY_STORAGE);
  } catch { /* Session storage may be disabled; in-memory idempotency still works. */ }
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="err">{error}</p>}
    </div>
  );
}

interface Props {
  fields: FormField[];
  minorAge: number;
  requireGuardian: boolean;
}

export default function RegisterForm({ fields, minorAge, requireGuardian }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const e = (m?: string) => (m ? t(m) : undefined); // validation messages are i18n keys
  const [step, setStep] = useState(0);
  // Stored as a key (+params) so it re-translates if the language changes after an error appears.
  const [serverError, setServerError] = useState<{ key: string; params?: Record<string, string | number> } | null>(null);
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const submissionKey = useRef<{ fingerprint: string; key: string } | null>(null);

  const { register, control, handleSubmit, trigger, watch, formState: { errors } } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      primary: { fullName: "", age: "", phone: "", congregation: "" },
      companions: [],
      selfRegisterNames: "",
      emergency: { name: "", relationship: "", phone: "" },
      guardian: { name: "", phone: "", acknowledged: false },
      custom: {},
      website: "",
    },
  });
  const { fields: companions, append, remove } = useFieldArray({ control, name: "companions" });

  const primaryAge = watch("primary.age");
  const companionList = watch("companions");
  const hasMinor = requireGuardian && [primaryAge, ...companionList.map((c) => c.age)].some((a) => /^\d+$/.test(a ?? "") && Number(a) < minorAge);

  async function next() {
    const ok = step === 0 ? await trigger("primary") : await trigger(["companions", "selfRegisterNames"]);
    if (ok) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const submit = handleSubmit((values) => {
    setServerError(null);
    const ce: Record<string, string> = {};
    for (const f of fields) {
      const v = values.custom[f.key];
      const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
      if (f.required && empty) ce[f.key] = "err.requiredQ";
    }
    setCustomErrors(ce);
    if (Object.keys(ce).length) return;
    if (hasMinor && (!values.guardian.acknowledged || values.guardian.name.trim().length < 2 || values.guardian.phone.trim().length < 7)) {
      setServerError({ key: "err.guardian", params: { age: minorAge } });
      return;
    }
    const fingerprint = JSON.stringify(values);
    if (!submissionKey.current) {
      submissionKey.current = { fingerprint, key: readRetryKey() ?? crypto.randomUUID() };
    } else if (submissionKey.current.fingerprint !== fingerprint) {
      submissionKey.current = { fingerprint, key: crypto.randomUUID() };
    }
    let key = submissionKey.current.key;
    writeRetryKey(key);
    startTransition(async () => {
      try {
        let res = await submitRegistration(values, key);
        if (!res.ok && res.error === "err.idempotencyConflict") {
          key = crypto.randomUUID();
          submissionKey.current = { fingerprint, key };
          writeRetryKey(key);
          res = await submitRegistration(values, key);
        }
        if (res.ok) {
          writeRetryKey(null);
          router.push(`/register/done?id=${res.registrationId}`);
        } else setServerError({ key: res.error, params: res.params });
      } catch {
        setServerError({ key: "err.generic" });
      }
    });
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (step < 2) void next();
        else void submit(e);
      }}
      className="space-y-5"
    >
      {/* progress */}
      <ol className="flex items-center gap-2" aria-label={t("reg.progress")}>
        {STEP_KEYS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${i <= step ? "bg-forest-800 text-ivory-50" : "bg-forest-100 text-forest-500"}`}>{i + 1}</span>
            <span className={`hidden text-xs sm:block ${i === step ? "font-semibold text-forest-800" : "text-forest-500"}`}>{t(s)}</span>
            {i < STEP_KEYS.length - 1 && <span className={`h-px flex-1 ${i < step ? "bg-forest-700" : "bg-forest-200"}`} />}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
          {step === 0 && (
            <section className="card space-y-4">
              <h2 className="text-xl font-semibold text-forest-800">{t("p.title")}</h2>
              <Field label={t("p.name")} error={e(errors.primary?.fullName?.message)}>
                <input className="input" autoComplete="name" {...register("primary.fullName")} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Field label={t("p.age")} error={e(errors.primary?.age?.message)}>
                    <input className="input" type="number" inputMode="numeric" min={14} step={1} {...register("primary.age")} />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label={t("p.phone")} error={e(errors.primary?.phone?.message)}>
                    <input className="input" type="tel" autoComplete="tel" placeholder="+91 …" {...register("primary.phone")} />
                  </Field>
                </div>
              </div>
              <Field label={t("p.congregation")} error={e(errors.primary?.congregation?.message)}>
                <input className="input" {...register("primary.congregation")} />
              </Field>
              <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" {...register("website")} />
            </section>
          )}

          {step === 1 && (
            <section className="card space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-forest-800">{t("c.title")}</h2>
                <p className="mt-1 text-sm text-forest-600">{t("c.intro")}</p>
              </div>
              {companions.map((c, i) => (
                <div key={c.id} className="space-y-3 rounded-xl border border-forest-100 bg-ivory-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-forest-700">{t("c.n", { n: i + 1 })}</p>
                    <button type="button" className="text-xs text-red-700 hover:underline" onClick={() => remove(i)}>{t("c.remove")}</button>
                  </div>
                  <Field label={t("p.name")} error={e(errors.companions?.[i]?.fullName?.message)}>
                    <input className="input" {...register(`companions.${i}.fullName`)} />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label={t("p.age")} error={e(errors.companions?.[i]?.age?.message)}>
                      <input className="input" type="number" inputMode="numeric" min={14} step={1} {...register(`companions.${i}.age`)} />
                    </Field>
                    <div className="col-span-2">
                      <Field label={t("c.phoneOpt")} error={e(errors.companions?.[i]?.phone?.message)}>
                        <input className="input" type="tel" {...register(`companions.${i}.phone`)} />
                      </Field>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={t("c.congregationDiff")}>
                      <input className="input" {...register(`companions.${i}.congregation`)} />
                    </Field>
                    <Field label={t("c.relationship")}>
                      <input className="input" placeholder={t("c.relationshipPh")} {...register(`companions.${i}.relationship`)} />
                    </Field>
                  </div>
                </div>
              ))}
              {companions.length < 15 && (
                <button type="button" className="btn btn-ghost w-full" onClick={() => append({ fullName: "", age: "", phone: "", congregation: "", relationship: "" })}>
                  {t("c.add")}
                </button>
              )}
              <Field label={t("c.self")} error={e(errors.selfRegisterNames?.message)}>
                <textarea className="input" rows={2} placeholder={t("c.selfPh")} {...register("selfRegisterNames")} />
              </Field>
            </section>
          )}

          {step === 2 && (
            <section className="card space-y-4">
              <h2 className="text-xl font-semibold text-forest-800">{t("e.title")}</h2>
              <Field label={t("e.name")} error={e(errors.emergency?.name?.message)}>
                <input className="input" {...register("emergency.name")} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("e.relationship")} error={e(errors.emergency?.relationship?.message)}>
                  <input className="input" placeholder={t("e.relationshipPh")} {...register("emergency.relationship")} />
                </Field>
                <Field label={t("e.phone")} error={e(errors.emergency?.phone?.message)}>
                  <input className="input" type="tel" {...register("emergency.phone")} />
                </Field>
              </div>

              {hasMinor && (
                <div className="space-y-3 rounded-xl border border-gold-300 bg-gold-50 p-4">
                  <p className="text-sm font-semibold text-forest-800">{t("g.title")}</p>
                  <p className="text-xs text-forest-600">{t("g.minor", { age: minorAge })}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={t("g.name")}><input className="input" {...register("guardian.name")} /></Field>
                    <Field label={t("g.phone")} error={e(errors.guardian?.phone?.message)}><input className="input" type="tel" {...register("guardian.phone")} /></Field>
                  </div>
                  <label className="flex items-start gap-3 text-sm text-forest-800">
                    <input type="checkbox" className="mt-1 h-4 w-4 accent-forest-700" {...register("guardian.acknowledged")} />
                    {t("g.consent")}
                  </label>
                </div>
              )}

              {fields.length > 0 && (
                <div className="space-y-4 border-t border-forest-100 pt-4">
                  <h2 className="text-xl font-semibold text-forest-800">{t("q.title")}</h2>
                  {fields.map((f) => (
                    <Controller
                      key={f.key}
                      control={control}
                      name={`custom.${f.key}`}
                      render={({ field }) => <FieldInput field={f} value={field.value} onChange={field.onChange} error={customErrors[f.key]} />}
                    />
                  ))}
                </div>
              )}

            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {serverError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{t(serverError.key, serverError.params)}</p>}

      <div className="flex gap-3">
        {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={pending}>{t("btn.back")}</button>}
        <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
          {step < 2 ? (step === 1 && companions.length === 0 ? t("btn.continueAlone") : t("btn.continue")) : pending ? t("btn.submitting") : t("btn.complete")}
        </button>
      </div>
    </form>
  );
}
