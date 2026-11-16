import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { getLang } from "@/lib/i18n/server";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const hindi = Noto_Sans_Devanagari({ subsets: ["devanagari", "latin"], variable: "--font-hindi", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const hi = (await getLang()) === "hi";
  return {
    title: hi ? "यूथ मीट अप – भायखला चिड़ियाघर" : "Youth Meet Up – Byculla Zoo",
    description: hi
      ? "21 नवंबर 2026, सुबह 9:30 बजे भायखला चिड़ियाघर में यूथ मीट अप के लिए रजिस्टर करें।"
      : "Register for the Youth Meet Up at Byculla Zoo, 21 November 2026, 9:30 AM.",
  };
}
export const viewport: Viewport = { themeColor: "#1f3d2b", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${sans.variable} ${display.variable} ${hindi.variable}${lang === "hi" ? " lang-hi" : ""}`}>
      <body>
        <LanguageProvider initial={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
