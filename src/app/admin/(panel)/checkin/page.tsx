import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import Flash from "@/components/Flash";
import ConfirmButton from "@/components/ConfirmButton";
import { fmtTime, one, sanitizeSearch } from "@/lib/utils";
import { checkIn, undoCheckIn } from "../actions";

interface Row { id: string; registration_id: string; full_name: string; age: number | null; phone: string | null; congregation: string | null; attendance: { checked_in_at: string } | { checked_in_at: string }[] | null }

export default async function CheckInPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const q = sanitizeSearch(sp.q ?? "");
  const [{ count: total, error: totalError }, { count: present, error: presentError }] = await Promise.all([
    supabase.from("participants").select("id, registrations!inner(cancelled_at)", { count: "exact", head: true }).is("registrations.cancelled_at", null),
    supabase.from("participants").select("id, registrations!inner(cancelled_at), attendance!inner(checked_in_at)", { count: "exact", head: true })
      .is("registrations.cancelled_at", null).not("attendance.checked_in_at", "is", null),
  ]);
  if (totalError || presentError) throw new Error(`Could not load check-in totals: ${totalError?.message ?? presentError?.message}`);

  const data: Row[] = [];
  if (q) {
    let query = supabase.from("participants").select("id, registration_id, full_name, age, phone, congregation, attendance(checked_in_at), registrations!inner(cancelled_at)").order("full_name").order("id");
    query = query.is("registrations.cancelled_at", null);
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
    const { data: matches, error } = await query.limit(40);
    if (error) throw new Error(`Could not search participants: ${error.message}`);
    data.push(...((matches ?? []) as Row[]));
  }
  const { data: recent, error: recentError } = await supabase.from("attendance")
    .select("checked_in_at, participants!inner(id, full_name, registration_id, registrations!inner(cancelled_at))")
    .is("participants.registrations.cancelled_at", null)
    .order("checked_in_at", { ascending: false }).limit(8);
  if (recentError) throw new Error(`Could not load recent arrivals: ${recentError.message}`);
  const activeRecent = recent ?? [];
  const back = `/admin/checkin${q ? `?q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between"><h1 className="text-3xl font-semibold text-forest-800">Check-in</h1><p className="text-sm text-forest-600">{present} / {total} present</p></div>
      <Flash error={sp.error} ok={sp.ok} />
      <form method="get" className="flex gap-2"><input name="q" defaultValue={q} autoFocus placeholder="Search by name or phone" className="input" /><button className="btn btn-primary">Search</button></form>
      <div className="space-y-2">
        {data.map((r) => {
          const a = one(r.attendance);
          return (
            <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 !p-4">
              <div><p className="font-semibold text-forest-800">{r.full_name}</p><p className="text-xs text-forest-600">{[r.age != null && `Age ${r.age}`, r.phone, r.congregation].filter(Boolean).join(" · ")}</p></div>
              {a ? (
                <form action={undoCheckIn} className="flex items-center gap-2">
                  <input type="hidden" name="participantId" value={r.id} /><input type="hidden" name="back" value={back} />
                  <span className="badge bg-forest-100 text-forest-800">Arrived {fmtTime(a.checked_in_at)}</span>
                  <ConfirmButton message={`Remove check-in for ${r.full_name}? Use only to correct a mistake.`} className="btn btn-danger btn-sm">Undo</ConfirmButton>
                </form>
              ) : (
                <form action={checkIn}><input type="hidden" name="participantId" value={r.id} /><input type="hidden" name="back" value={back} /><button className="btn btn-primary">Check in</button></form>
              )}
            </div>
          );
        })}
        {q && data.length === 0 && <p className="text-sm text-forest-500">No one found. Not registered? Add them under <a className="underline" href="/admin/walkins">Walk-ins</a>.</p>}
      </div>
      {!q && (
        <section className="card"><h2 className="mb-2 text-lg font-semibold text-forest-800">Latest arrivals</h2>
          <ul className="space-y-2 text-sm">{activeRecent.map((r: { checked_in_at: string; participants: { id: string; full_name: string; registration_id: string } | { id: string; full_name: string; registration_id: string }[] | null }) => {
            const participant = one(r.participants);
            if (!participant) return null;
            return <li key={participant.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-forest-100 pt-2 first:border-0 first:pt-0">
              <Link href={`/admin/participants/${participant.id}`} className="font-medium text-forest-800 hover:underline">{participant.full_name}</Link>
              <div className="flex items-center gap-3"><span className="text-forest-500">{fmtTime(r.checked_in_at)}</span>
                <form action={undoCheckIn} className="flex items-center gap-2"><input type="hidden" name="participantId" value={participant.id} /><input type="hidden" name="back" value="/admin/checkin" />
                  <ConfirmButton message={`Remove check-in for ${participant.full_name}? Use only to correct a mistake.`} className="btn btn-danger btn-sm">Undo</ConfirmButton>
                </form>
              </div>
            </li>;
          })}
            {activeRecent.length === 0 && <li className="text-forest-500">No one has checked in yet.</li>}</ul></section>
      )}
    </div>
  );
}
