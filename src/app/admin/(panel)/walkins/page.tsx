import { requireAdmin } from "@/lib/auth";
import Flash from "@/components/Flash";
import { createWalkIn } from "../actions";
import { fmtTime } from "@/lib/utils";

export default async function WalkIns({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: activeRecent, error: recentError } = await supabase.from("participants")
    .select("id, registration_id, full_name, created_at, registrations!inner(cancelled_at)")
    .eq("source", "walk_in").is("registrations.cancelled_at", null)
    .order("created_at", { ascending: false }).limit(10);
  if (recentError) throw new Error(`Could not load recent walk-ins: ${recentError.message}`);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold text-forest-800">Add walk-in</h1>
      <p className="text-sm text-forest-600">Saved as a normal participant with source “walk-in” and marked present immediately.</p>
      <Flash error={sp.error} ok={sp.ok} />
      <form action={createWalkIn} className="card space-y-3">
        <div><label className="label">Full name</label><input name="fullName" required className="input" /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Age</label><input name="age" type="number" required inputMode="numeric" min={14} step={1} className="input" /></div>
          <div className="col-span-2"><label className="label">Phone (optional)</label><input name="phone" type="tel" className="input" /></div>
        </div>
        <div><label className="label">Congregation</label><input name="congregation" className="input" /></div>
        <fieldset className="space-y-2 rounded-xl border border-forest-100 p-3"><legend className="px-1 text-xs font-semibold uppercase text-forest-600">Emergency contact (optional)</legend>
          <input name="ecName" placeholder="Name" className="input" />
          <div className="grid gap-2 sm:grid-cols-2"><input name="ecRelationship" placeholder="Relationship" className="input" /><input name="ecPhone" type="tel" placeholder="Phone" className="input" /></div>
        </fieldset>
        <button className="btn btn-primary w-full">Add & mark present</button>
      </form>
      <section className="card"><h2 className="mb-2 text-lg font-semibold text-forest-800">Recent walk-ins</h2>
        <ul className="space-y-1 text-sm">{activeRecent.map((r) => <li key={r.id} className="flex justify-between"><span>{r.full_name}</span><span className="text-forest-500">{fmtTime(r.created_at)}</span></li>)}
          {activeRecent.length === 0 && <li className="text-forest-500">None yet.</li>}</ul></section>
    </div>
  );
}
