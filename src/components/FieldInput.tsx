"use client";
import type { FormField } from "@/lib/types";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { translate, type Lang } from "@/lib/i18n/messages";

interface Props {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
  /** Force a display language (admin preview stays English). */
  lang?: Lang;
}

export default function FieldInput({ field, value, onChange, error, lang }: Props) {
  const ctx = useI18n();
  const t = (k: string) => translate(lang ?? ctx.lang, k);
  const id = `f_${field.key}`;
  const str = typeof value === "string" || typeof value === "number" ? String(value) : "";
  const arr = Array.isArray(value) ? (value as string[]) : [];

  let control: React.ReactNode;
  switch (field.type) {
    case "long_text":
      control = <textarea id={id} rows={4} maxLength={2000} className="input" value={str} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "number":
      control = <input id={id} type="number" inputMode="decimal" className="input" value={str} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "date":
      control = <input id={id} type="date" className="input" value={str} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "dropdown":
      control = (
        <select id={id} className="input" value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">{t("f.select")}</option>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
      break;
    case "multiple_choice":
    case "yes_no": {
      const opts = field.type === "yes_no" ? ["Yes", "No"] : field.options;
      control = (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={`${id}_l`}>
          {opts.map((o) => (
            <label key={o} className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm transition ${str === o ? "border-forest-700 bg-forest-800 text-ivory-50" : "border-forest-200 bg-white hover:bg-forest-50"}`}>
              <input type="radio" className="sr-only" name={id} checked={str === o} onChange={() => onChange(o)} />
              {field.type === "yes_no" ? t(o === "Yes" ? "f.yes" : "f.no") : o}
            </label>
          ))}
        </div>
      );
      break;
    }
    case "checkboxes":
      control = (
        <div className="flex flex-wrap gap-2">
          {field.options.map((o) => {
            const on = arr.includes(o);
            return (
              <label key={o} className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm transition ${on ? "border-forest-700 bg-forest-800 text-ivory-50" : "border-forest-200 bg-white hover:bg-forest-50"}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => onChange(on ? arr.filter((x) => x !== o) : [...arr, o])} />
                {o}
              </label>
            );
          })}
        </div>
      );
      break;
    default:
      control = <input id={id} type="text" maxLength={300} className="input" value={str} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <div>
      <label id={`${id}_l`} htmlFor={id} className="label">
        {field.label}{field.required ? <span className="text-gold-600"> *</span> : <span className="text-forest-400"> {t("f.optional")}</span>}
      </label>
      {field.help_text && <p className="-mt-1 mb-2 text-xs text-forest-500">{field.help_text}</p>}
      {control}
      {error && <p className="err">{translate(lang ?? ctx.lang, error)}</p>}
    </div>
  );
}
