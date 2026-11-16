"use client";
import Link from "next/link";
import { EVENT } from "@/lib/event";
import { Elephant } from "@/components/Illustrations";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function DoneContent({ names, reference }: { names: string[]; reference: string | null }) {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto max-w-md text-center">
      <div className="mb-4 flex justify-end"><LanguageSwitcher tone="dark" /></div>
      <Elephant className="mx-auto h-16 w-24 text-gold-400" />
      <h1 className="mt-4 text-4xl font-semibold">{t("done.title")}</h1>
      {names.length > 0 ? (
        <>
          <p className="mt-2 text-ivory-100/80">
            {names.length === 1 ? t("done.seeOne", { first: names[0] }) : t("done.seeMany", { first: names[0], n: names.length - 1 })}
          </p>
          <div className="card mt-6 bg-white/10 text-left text-ivory-50">
            <p className="text-xs uppercase tracking-widest text-gold-300">{t("done.registered")}</p>
            <ul className="mt-2 space-y-1">{names.map((n, i) => <li key={i}>• {n}</li>)}</ul>
            {reference && <p className="mt-4 text-xs text-ivory-100/70">{t("done.ref")} <span className="font-mono">{reference}</span></p>}
          </div>
        </>
      ) : (
        <p className="mt-2 text-ivory-100/80">{t("done.received")}</p>
      )}
      <div className="card mt-4 bg-white/10 text-left text-ivory-50">
        <p className="text-xs uppercase tracking-widest text-gold-300">{t("done.details")}</p>
        <p className="mt-2 font-display text-lg">{t("event.name")} · {t("event.venue")}</p>
        <p className="text-sm">{t("event.date")} · {t("event.time")}</p>
        <p className="mt-3 text-sm">{t("done.questions", { name: t("event.contact") })} <a className="whitespace-nowrap font-semibold text-gold-300 underline" href={EVENT.contactHref}>{EVENT.contactPhone}</a></p>
      </div>
      <Link href="/" className="btn btn-gold mt-6">{t("done.home")}</Link>
    </div>
  );
}
