"use client";
import { useState, useTransition } from "react";
import FieldInput from "@/components/FieldInput";
import { CHOICE_TYPES, FIELD_TYPES, type FieldType, type FormField } from "@/lib/types";
import { publishForm } from "../actions";

const newKey = () => `q_${Math.random().toString(36).slice(2, 8)}`;

export default function FormBuilder({ initial, version, hasActiveForm }: { initial: FormField[]; version: number; hasActiveForm: boolean }) {
  const [fields, setFields] = useState<FormField[]>(initial);
  const [ver, setVer] = useState(version);
  const [preview, setPreview] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(!hasActiveForm);
  const [isActive, setIsActive] = useState(hasActiveForm);
  const [pending, start] = useTransition();

  const change = (next: FormField[]) => { setFields(next); setDirty(true); setMsg(null); };
  const patch = (i: number, p: Partial<FormField>) => change(fields.map((f, idx) => (idx === i ? { ...f, ...p } : f)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= fields.length) return;
    const n = [...fields];
    [n[i], n[j]] = [n[j], n[i]];
    change(n);
  };
  const add = (type: FieldType) =>
    change([...fields, { key: newKey(), label: "", help_text: null, type, options: CHOICE_TYPES.includes(type) ? ["Option 1", "Option 2"] : [], required: false, enabled: true, sort_order: fields.length }]);

  function publish() {
    const invalidChoice = fields.find((field) =>
      CHOICE_TYPES.includes(field.type) && field.options.map((option) => option.trim()).filter(Boolean).length < 2,
    );
    if (invalidChoice) {
      setMsg({ ok: false, text: `“${invalidChoice.label || "Untitled question"}” needs at least two options.` });
      return;
    }

    start(async () => {
      const res = await publishForm(fields.map((f, i) => ({
        ...f,
        options: CHOICE_TYPES.includes(f.type) ? f.options.map((option) => option.trim()).filter(Boolean) : [],
        sort_order: i,
      })));
      if (res.ok) { setVer(res.version ?? ver); setDirty(false); setIsActive(true); setMsg({ ok: true, text: `Published as version ${res.version}.` }); }
      else setMsg({ ok: false, text: res.error ?? "Could not publish." });
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${isActive ? "bg-forest-100 text-forest-800" : "bg-gold-100 text-gold-700"}`}>{isActive ? `Live version ${ver}` : ver ? `Latest saved version ${ver} (inactive)` : "No active form"}</span>
        {dirty && <span className="badge bg-gold-100 text-gold-600">Unpublished changes</span>}
        <div className="ml-auto flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPreview((p) => !p)}>{preview ? "Back to editing" : "Preview form"}</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={pending || !dirty} onClick={publish}>{pending ? "Publishing…" : isActive ? "Publish new version" : "Publish recovery version"}</button>
        </div>
      </div>
      {msg && <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${msg.ok ? "border-forest-200 bg-forest-50 text-forest-800" : "border-red-200 bg-red-50 text-red-800"}`}>{msg.text}</p>}

      {preview ? (
        <div className="card mx-auto max-w-xl space-y-4">
          <p className="text-xs uppercase tracking-wide text-forest-500">Preview – as participants will see it</p>
          {fields.filter((f) => f.enabled).map((f) => (
            <FieldInput lang="en" key={f.key} field={{ ...f, label: f.label || "(untitled question)" }} value={values[f.key]} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
          ))}
          {fields.filter((f) => f.enabled).length === 0 && <p className="text-sm text-forest-500">No active questions.</p>}
        </div>
      ) : (
        <>
          {fields.map((f, i) => (
            <div key={f.key} className={`card space-y-3 ${f.enabled ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-forest-100 text-forest-700">{FIELD_TYPES.find((t) => t.value === f.type)?.label}</span>
                <div className="ml-auto flex gap-1">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)} disabled={i === fields.length - 1} aria-label="Move down">↓</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => change(fields.filter((_, idx) => idx !== i))}>Remove</button>
                </div>
              </div>
              <input className="input" placeholder="Question" value={f.label} onChange={(e) => patch(i, { label: e.target.value })} />
              <input className="input" placeholder="Help text (optional)" value={f.help_text ?? ""} onChange={(e) => patch(i, { help_text: e.target.value || null })} />
              {CHOICE_TYPES.includes(f.type) && (
                <fieldset className="space-y-2 rounded-xl border border-forest-100 p-3">
                  <legend className="px-1 text-sm font-medium text-forest-800">Options</legend>
                  {f.options.map((option, optionIndex) => (
                    <div key={`${f.key}-option-${optionIndex}`} className="flex items-center gap-2">
                      <input
                        className="input"
                        type="text"
                        maxLength={100}
                        aria-label={`Option ${optionIndex + 1}`}
                        placeholder={`Option ${optionIndex + 1}`}
                        value={option}
                        onChange={(event) => patch(i, { options: f.options.map((value, index) => index === optionIndex ? event.target.value : value) })}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm shrink-0"
                        onClick={() => patch(i, { options: f.options.filter((_, index) => index !== optionIndex) })}
                        aria-label={`Remove option ${optionIndex + 1}`}
                        title="Remove option"
                      >Remove</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => patch(i, { options: [...f.options, ""] })}
                    disabled={f.options.length >= 30}
                  >+ Add option</button>
                  <p className="text-xs text-forest-500">At least two options are required to publish. Maximum 30 options.</p>
                </fieldset>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-forest-700" checked={f.required} onChange={(e) => patch(i, { required: e.target.checked })} /> Required</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-forest-700" checked={f.enabled} onChange={(e) => patch(i, { enabled: e.target.checked })} /> Enabled</label>
              </div>
            </div>
          ))}
          <div className="card">
            <p className="label">Add a question</p>
            <div className="flex flex-wrap gap-2">{FIELD_TYPES.map((t) => <button key={t.value} type="button" className="btn btn-ghost btn-sm" onClick={() => add(t.value)}>+ {t.label}</button>)}</div>
          </div>
        </>
      )}
    </div>
  );
}
