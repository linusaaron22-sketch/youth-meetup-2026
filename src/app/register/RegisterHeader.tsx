"use client";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function RegisterHeader() {
  const { t } = useI18n();
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="text-sm text-forest-600 hover:underline">{t("reg.back", { name: t("event.name") })}</Link>
        <LanguageSwitcher />
      </div>
      <h1 className="mt-4 text-3xl font-semibold text-forest-800 sm:text-4xl">{t("reg.title")}</h1>
      <p className="mb-6 mt-1 text-sm text-forest-600">{t("event.date")} · {t("event.time")} · {t("event.venue")}</p>
    </>
  );
}
