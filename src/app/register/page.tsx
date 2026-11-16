import { createServiceClient } from "@/lib/supabase/service";
import { getActiveForm, getSettings } from "@/lib/data";
import RegisterForm from "./RegisterForm";
import { Sprig } from "@/components/Illustrations";
import RegisterHeader from "./RegisterHeader";
import { getLang } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return { title: translate(await getLang(), "reg.meta") };
}

export default async function RegisterPage() {
  const db = createServiceClient();
  const [settings, form] = await Promise.all([getSettings(db), getActiveForm(db)]);
  return (
    <main className="relative min-h-screen overflow-hidden bg-ivory-50">
      <Sprig className="pointer-events-none absolute -right-8 top-0 h-60 w-28 rotate-12 text-forest-200/60" />
      <div className="relative mx-auto max-w-xl px-4 pb-16 pt-8 sm:pt-12">
        <RegisterHeader />
        <RegisterForm
          fields={form.fields.filter((f) => f.enabled)}
          minorAge={settings.minor_age}
          requireGuardian={settings.require_guardian_ack}
        />
      </div>
    </main>
  );
}
