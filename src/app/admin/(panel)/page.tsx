import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import Flash from "@/components/Flash";
import ParticipantAttendanceTable from "./ParticipantAttendanceTable";
import { saveSafeguardingSettings } from "./actions";

interface Participant {
  id: string;
  registration_id: string;
  full_name: string;
  age: number | null;
  congregation: string | null;
  source: string;
  created_at: string;
  attendance: { checked_in_at: string } | { checked_in_at: string }[] | null;
}

export default async function Overview({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: statsData, error: statsError }, settings] = await Promise.all([
    supabase.rpc("admin_overview_stats"),
    getSettings(supabase),
  ]);
  if (statsError || !statsData) throw new Error(`Could not load overview totals: ${statsError?.message ?? "statistics missing"}`);
  const stats = statsData as { registrations: number; participants: number; present: number; walk_ins: number; congregations: { name: string; total: number; present: number }[] };

  const { data: firstPage, count: tableTotal, error: tableError } = await supabase.from("participants")
    .select("id, registration_id, full_name, age, congregation, source, created_at, attendance(checked_in_at), registrations!inner(cancelled_at)", { count: "exact" })
    .is("registrations.cancelled_at", null).order("created_at", { ascending: false }).order("id", { ascending: true }).range(0, 49);
  if (tableError) throw new Error(`Could not load participant attendance page: ${tableError.message}`);
  const tableParticipants = (firstPage ?? []) as Participant[];
  const cards: [string, number][] = [
    ["Registrations", stats.registrations],
    ["Participants", stats.participants],
    ["Present", stats.present],
    ["Absent", stats.participants - stats.present],
    ["Walk-ins", stats.walk_ins],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-forest-800">Overview</h1>
      <Flash error={sp.error} ok={sp.ok} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="card !p-4"><p className="text-xs uppercase tracking-wide text-forest-500">{label}</p><p className="mt-1 font-display text-3xl text-forest-800">{value}</p></div>
        ))}
      </div>

      <ParticipantAttendanceTable participants={tableParticipants} total={tableTotal ?? 0} />

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold text-forest-800">By congregation</h2>
        <div className="overflow-x-auto">
          <table className="w-full"><thead><tr><th className="th">Congregation</th><th className="th">Participants</th><th className="th">Present</th></tr></thead>
            <tbody>{stats.congregations.map((summary) => <tr key={summary.name} className="border-t border-forest-100"><td className="td">{summary.name}</td><td className="td">{summary.total}</td><td className="td">{summary.present}</td></tr>)}
              {stats.congregations.length === 0 && <tr><td className="td text-forest-500" colSpan={3}>No registrations yet.</td></tr>}</tbody></table>
        </div>
      </section>

      <form action={saveSafeguardingSettings} className="card grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="text-lg font-semibold text-forest-800">Safeguarding</h2>
          <p className="mt-1 text-sm text-forest-600">Set when a parent or guardian acknowledgement is needed for registration.</p>
        </div>
        <div><label className="label" htmlFor="minor_age">Guardian acknowledgement required under age</label><input id="minor_age" name="minor_age" type="number" min="0" max="25" defaultValue={settings.minor_age} className="input" /></div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="require_guardian_ack" defaultChecked={settings.require_guardian_ack} className="h-4 w-4 accent-forest-700" /> Require guardian acknowledgement</label>
        <button className="btn btn-primary sm:col-span-2">Save safeguarding settings</button>
        <p className="text-xs text-forest-500 sm:col-span-2">Set the age to 0 to effectively disable the minor check.</p>
      </form>
    </div>
  );
}
