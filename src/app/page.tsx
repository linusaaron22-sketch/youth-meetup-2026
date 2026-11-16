"use client";

import Link from "next/link";
import { EVENT } from "@/lib/event";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import StitchWildlifeScene from "@/components/StitchWildlifeScene";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function Home() {
  const { t, lang } = useI18n();
  const isHindi = lang === "hi";

  return (
    <main className="stitch-home relative flex min-h-screen w-full flex-col overflow-hidden bg-[#0c1a14] text-[#f8f5ee]">
      <div className="fixed right-3 top-3 z-50 sm:right-8 sm:top-6">
        <LanguageSwitcher tone="dark" className="stitch-language-switcher" />
      </div>

      <StitchWildlifeScene>
        <header className="relative z-30 mx-auto flex w-full max-w-4xl flex-col items-center space-y-1 px-4 pt-5 text-center sm:space-y-2.5 sm:pt-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="h-px w-4 bg-[#d4af37]/60 sm:w-10" />
            <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-[#d4af37] sm:text-xs sm:tracking-[0.28em]">
              {t("home.presents", { org: t("event.organiser") })}
            </p>
            <span className="h-px w-4 bg-[#d4af37]/60 sm:w-10" />
          </div>

          <div className="pt-0.5">
            <h1 className="font-display px-1 text-[clamp(2rem,7vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.025em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]">
              {isHindi ? "मुंबई यूथ मीट अप" : "MUMBAI YOUTH MEET UP"}
            </h1>
            <p className="mt-1 font-display text-xl italic tracking-wide text-[#f3e5ab] drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] sm:text-3xl">
              {t("home.at", { venue: t("event.venue") })}
            </p>
          </div>

          <p className="max-w-xl px-3 pt-1 font-sans text-[11px] leading-relaxed text-[#e5e2db]/90 sm:text-sm lg:text-base">
            {isHindi
              ? "जुड़ने, दोस्ती बढ़ाने और साथ में संगति का आनंद लेने का एक दिन।"
              : "A day to connect, build friendships and enjoy fellowship together."}
          </p>
        </header>
      </StitchWildlifeScene>

      <div className="relative z-30 mx-auto mb-4 mt-2 flex w-full flex-col items-center px-4 text-center sm:mb-6 sm:mt-3">
        <Link
          href="/register"
          className="group inline-flex min-h-10 w-full max-w-[220px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-[#0a1811] shadow-[0_4px_16px_rgba(212,175,55,0.28)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_6px_22px_rgba(212,175,55,0.35)] active:scale-[0.98] sm:min-h-11 sm:max-w-[240px] sm:text-sm"
        >
          <span>{t("home.register")}</span>
          <span
            aria-hidden="true"
            className="text-base transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>

      <section className="relative z-30 mx-auto mb-6 mt-1 w-full max-w-5xl px-4 sm:mb-8 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-[#0b1b13] shadow-[0_12px_34px_rgba(0,0,0,0.28)]">
          <div className="px-5 pb-5 pt-5 text-center sm:px-10 sm:pb-6 sm:pt-6">
            <p className="mb-2 flex items-center justify-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[#d4af37] sm:text-base sm:tracking-[0.16em]">
              <span aria-hidden="true">✦</span>
              {isHindi ? "अपना दिन तय करें" : "PLAN YOUR DAY"}
              <span aria-hidden="true">✦</span>
            </p>

            <h2 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-semibold leading-tight text-[#f3e5ab]">
              {isHindi ? "21 नवंबर 2026" : "21 November 2026"}
            </h2>

            <p className="mt-2 font-sans text-base font-semibold text-[#f8f5ee] sm:text-xl">
              {isHindi ? "शनिवार" : "Saturday"} · {t("event.time")}
            </p>

            <div className="my-5 h-px w-full bg-[#8ca58f]/35 sm:my-6" />

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-sans text-sm sm:gap-x-5 sm:text-lg">
              <span className="font-medium uppercase tracking-wide text-[#d4af37]">
  {isHindi ? "न्यूनतम आयु: 14 वर्ष" : "MINIMUM AGE: 14 YEARS"}
              </span>
              <span aria-hidden="true" className="text-[#78947c]">✦</span>
              <span className="font-medium uppercase text-[#f3e5ab]">
                {isHindi ? "बायकुला चिड़ियाघर" : "BYCULLA ZOO"}
              </span>
            </div>

            <p className="mt-2 font-sans text-sm tracking-wide text-[#aab7ac] sm:text-lg">
              {isHindi ? "मुंबई" : "MUMBAI"}
            </p>
          </div>

          <div className="bg-[#142d20] px-5 py-4 text-center sm:py-5">
            <p className="font-sans text-sm text-[#d4af37] sm:text-lg">
              {isHindi ? "कोई सवाल है? संपर्क करें" : "Questions? Contact"}{" "}
              <span className="font-medium">{t("event.contact")}</span>
            </p>
            <a
              className="mt-1 inline-block font-sans text-lg font-bold text-white transition-colors hover:text-[#f3e5ab] sm:text-xl"
              href={EVENT.contactHref}
            >
              {EVENT.contactPhone}
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-30 mt-auto w-full border-t border-[#d4af37]/15 bg-[#08120d] px-4 py-4 sm:py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-center text-center">
          <p className="font-sans text-[9px] uppercase leading-relaxed tracking-wide text-[#c3c8c3]/80 sm:text-[11px] lg:text-xs">
            {isHindi
              ? "युवा संगति सभा • वीरमाता जीजाबाई भोसले उद्यान (बायकुला चिड़ियाघर), मुंबई • © 2026 चर्च ऑफ क्राइस्ट, मुंबई"
              : "YOUTH FELLOWSHIP GATHERING • VEERMATA JIJABAI BHOSALE UDYAN (BYCULLA ZOO), MUMBAI • © 2026 CHURCH OF CHRIST, MUMBAI"}
          </p>
        </div>
      </footer>
    </main>
  );
}
