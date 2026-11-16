
"use client";

import Link from "next/link";
import { EVENT } from "@/lib/event";
import { Elephant } from "@/components/Illustrations";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/LanguageProvider";

const WHATSAPP_GROUP_LINK =
  "https://chat.whatsapp.com/Hx555ZdV2Oj40h2DX9WAXc?s=sw&p=a&iam=2";

export default function DoneContent({
  names,
  reference,
}: {
  names: string[];
  reference: string | null;
}) {
  const { t } = useI18n();

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-md px-4 text-center sm:px-6">
      <div className="mb-5 flex justify-end">
        <LanguageSwitcher tone="dark" />
      </div>

      <Elephant className="mx-auto h-20 w-auto max-w-full text-gold-400" />

      <h1 className="mt-5 break-words text-[clamp(2rem,8vw,3rem)] font-semibold leading-tight">
        {t("done.title")}
      </h1>

      {names.length > 0 ? (
        <>
          <p className="mt-3 break-words text-base leading-relaxed text-ivory-100/80 sm:text-lg">
            {names.length === 1
              ? t("done.seeOne", { first: names[0] })
              : t("done.seeMany", {
                  first: names[0],
                  n: names.length - 1,
                })}
          </p>

          <div className="card mt-6 min-w-0 overflow-hidden bg-white/10 text-left text-ivory-50">
            <p className="text-xs uppercase tracking-widest text-gold-300">
              {t("done.registered")}
            </p>

            <ul className="mt-3 space-y-2">
              {names.map((name, index) => (
                <li key={index} className="break-words">
                  <span className="mr-2 text-gold-300">•</span>
                  {name}
                </li>
              ))}
            </ul>

            {reference && (
              <p className="mt-4 break-words text-xs text-ivory-100/70">
                {t("done.ref")}{" "}
                <span className="break-all font-mono">{reference}</span>
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="mt-3 break-words text-base leading-relaxed text-ivory-100/80 sm:text-lg">
          {t("done.received")}
        </p>
      )}

      <div className="card mt-5 min-w-0 overflow-hidden bg-white/10 text-left text-ivory-50">
        <p className="text-xs uppercase tracking-widest text-gold-300">
          {t("done.details")}
        </p>

        <p className="mt-3 break-words font-display text-lg leading-snug">
          {t("event.name")} · {t("event.venue")}
        </p>

        <p className="mt-1 break-words text-sm">
          {t("event.date")} · {t("event.time")}
        </p>

        <p className="mt-4 text-sm leading-relaxed">
          {t("done.questions", { name: t("event.contact") })}{" "}
          <a
            className="break-words font-semibold text-gold-300 underline"
            href={EVENT.contactHref}
          >
            {EVENT.contactPhone}
          </a>
        </p>
      </div>

      {/* WhatsApp group invitation */}
      <div className="mt-6 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 p-5 text-center">
        <h2 className="text-lg font-semibold text-ivory-50">
          Join Our WhatsApp Group
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-ivory-100/80">
          Stay connected! Join our group for Youth Meet Up 2026 updates,
          announcements and important information.
        </p>

        <a
          href={WHATSAPP_GROUP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 font-semibold text-[#123524] transition hover:bg-[#20BD5A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
        >
          <span aria-hidden="true">◉</span>
          Join WhatsApp Group
        </a>
      </div>

      <Link
        href="/"
        className="btn btn-gold mt-6 inline-flex max-w-full justify-center"
      >
        {t("done.home")}
      </Link>
    </div>
  );
}
