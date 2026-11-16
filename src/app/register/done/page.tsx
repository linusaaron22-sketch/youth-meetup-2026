import { createServiceClient } from "@/lib/supabase/service";
import { isUuid } from "@/lib/utils";
import { Sprig } from "@/components/Illustrations";
import { getLang } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import DoneContent from "./DoneContent";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return { title: translate(await getLang(), "done.meta") };
}

export default async function Done({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  let names: string[] = [];
  if (id && isUuid(id)) {
    const db = createServiceClient();
    const { data } = await db.from("participants").select("full_name, is_primary").eq("registration_id", id).order("is_primary", { ascending: false }).order("created_at");
    names = (data ?? []).map((p: { full_name: string }) => p.full_name);
  }
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-forest-800 to-forest-900 px-4 py-10 text-ivory-50">
      <Sprig className="pointer-events-none absolute -left-6 bottom-0 h-72 w-32 text-forest-600/40" />
      <DoneContent names={names} reference={id && names.length ? id.slice(0, 8).toUpperCase() : null} />
    </main>
  );
}
