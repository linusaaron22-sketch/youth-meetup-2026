"use client";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function LanguageSwitcher({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const { lang, setLang, t } = useI18n();
  const shell = tone === "dark" ? "border-gold-400/50 bg-white/10" : "border-forest-200 bg-white";
  const on = tone === "dark" ? "bg-gold-400 text-forest-900" : "bg-forest-800 text-ivory-50";
  const off = tone === "dark" ? "text-ivory-100" : "text-forest-700";
  return (
    <div role="group" aria-label={t("lang.label")} className={`inline-flex rounded-full border p-0.5 text-sm ${shell} ${className}`}>
      {([["en", "English"], ["hi", "हिन्दी"]] as const).map(([code, label]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`min-h-9 rounded-full px-3.5 py-1 font-medium transition ${lang === code ? on : off}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
