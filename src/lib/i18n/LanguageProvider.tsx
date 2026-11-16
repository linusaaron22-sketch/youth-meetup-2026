"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LANG_COOKIE, translate, type Lang } from "./messages";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}
const I18nContext = createContext<Ctx | null>(null);

export function LanguageProvider({ initial, children }: { initial: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);

  // Client-side only: no navigation, no refresh -> React state (form data, wizard step) is untouched.
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = l;
    document.documentElement.classList.toggle("lang-hi", l === "hi");
  }, []);

  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (k, p) => translate(lang, k, p) }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n must be used inside LanguageProvider");
  return c;
}
