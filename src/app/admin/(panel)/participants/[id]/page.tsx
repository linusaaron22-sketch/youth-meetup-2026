import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import Flash from "@/components/Flash";
import ConfirmButton from "@/components/ConfirmButton";
import { fmtDateTime, isUuid, one } from "@/lib/utils";
import { cancelRegistration, checkIn, undoCheckIn, updateEmergency, updateParticipant } from "../../actions";

interface Detail {
  id: string; registration_id: string; full_name: string; age: number | null; phone: string | null; congregation: string | null; source: string;
  is_primary: boolean; guardian_name: string | null; guardian_phone: string | null; guardian_ack: boolean | null; created_at: string;
  emergency_contacts: { name: string; relationship: string; phone: string } | { name: string; relationship: string; phone: string }[] | null;
  attendance: { checked_in_at: string; checked_in_by_email: string | null; method: string } | { checked_in_at: string; checked_in_by_email: string | null; method: string }[] | null;
  custom_responses: { id: string; field_label: string; value: unknown }[] | null;
  registrations: { cancelled_at: string | null } | { cancelled_at: string | null }[] | null;
}

export default async function ParticipantPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("participants")
    .select("*, registrations!inner(cancelled_at), emergency_contacts(*), attendance(*), custom_responses(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as Detail;
  const [{ data: group }, { data: self }] = await Promise.all([
    supabase.from("participants").select("id, full_name, is_primary").eq("registration_id", p.registration_id).neq("id", id),
    supabase.from("travel_companions").select("name").eq("registration_id", p.registration_id).eq("mode", "self_register"),
  ]);
  const ec = one(p.emergency_contacts), a = one(p.attendance);
  const isCancelled = one(p.registrations)?.cancelled_at != null;
  const back = `/admin/participants/${id}`;

  return (
    <div className="space-y-5">
      <Link href="/admin/participants" className="text-sm text-forest-600 hover:underline">← Participants</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-forest-800">{p.full_name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {isCancelled && <span className="badge bg-red-100 text-red-800">Registration cancelled</span>}
          {a ? (
            <form action={undoCheckIn} className="flex items-center gap-3">
              <input type="hidden" name="participantId" value={id} /><input type="hidden" name="back" value={back} />
              <span className="badge bg-forest-100 text-forest-800">Present · {fmtDateTime(a.checked_in_at)}</span>
              <ConfirmButton message="Remove this check-in? Use only to correct a mistake." className="btn btn-danger btn-sm">Undo check-in</ConfirmButton>
            </form>
          ) : !isCancelled ? (
            <form action={checkIn}><input type="hidden" name="participantId" value={id} /><input type="hidden" name="back" value={back} /><button className="btn btn-primary">Check in now</button></form>
          ) : null}
          {!isCancelled && <form action={cancelRegistration}>
            <input type="hidden" name="registrationId" value={p.registration_id} /><input type="hidden" name="back" value={back} />
            <ConfirmButton message="Cancel this entire registration? All participants and companions will be moved out of active lists. Their records and submitted answers will be kept." className="btn btn-danger btn-sm">Cancel registration</ConfirmButton>
          </form>}
        </div>
      </div>
      <Flash error={sp.error} ok={sp.ok} />

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={updateParticipant} className="card space-y-3">
          <h2 className="text-lg font-semibold text-forest-800">Details <span className="badge ml-2 bg-gold-100 text-gold-600">{p.source === "walk_in" ? "walk-in" : "online"}</span></h2>
          <input type="hidden" name="participantId" value={id} />
          <div><label className="label">Full name</label><input name="fullName" defaultValue={p.full_name} required className="input" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Age</label><input name="age" type="number" defaultValue={p.age ?? ""} required inputMode="numeric" min={14} step={1} className="input" /></div>
            <div className="col-span-2"><label className="label">Phone</label><input name="phone" defaultValue={p.phone ?? ""} className="input" /></div>
          </div>
          <div><label className="label">Congregation</label><input name="congregation" defaultValue={p.congregation ?? ""} className="input" /></div>
          {p.guardian_name && <p className="text-sm text-forest-700">Guardian: {p.guardian_name} · {p.guardian_phone} · acknowledged: {p.guardian_ack ? "yes" : "no"}</p>}
          <p className="text-xs text-forest-500">Registered {fmtDateTime(p.created_at)}</p>
          <button className="btn btn-primary">Save details</button>
        </form>

        <form action={updateEmergency} className="card space-y-3">
          <h2 className="text-lg font-semibold text-forest-800">Emergency contact</h2>
          <input type="hidden" name="participantId" value={id} />
          <div><label className="label">Name</label><input name="name" defaultValue={ec?.name ?? ""} required className="input" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Relationship</label><input name="relationship" defaultValue={ec?.relationship ?? ""} required className="input" /></div>
            <div><label className="label">Phone</label><input name="phone" defaultValue={ec?.phone ?? ""} required className="input" /></div>
          </div>
          <button className="btn btn-primary">Save emergency contact</button>
        </form>
      </div>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold text-forest-800">Group & companions</h2>
        {(group ?? []).length === 0 && (self ?? []).length === 0 && <p className="text-sm text-forest-500">Registered alone.</p>}
        <ul className="space-y-1 text-sm">
          {(group ?? []).map((g: { id: string; full_name: string; is_primary: boolean }) => (
            <li key={g.id}><Link className="text-forest-800 underline" href={`/admin/participants/${g.id}`}>{g.full_name}</Link>{g.is_primary && <span className="text-forest-500"> (registered the group)</span>}</li>
          ))}
          {(self ?? []).map((s: { name: string }, i: number) => <li key={i} className="text-forest-600">{s.name} <span className="text-xs">– will register individually</span></li>)}
        </ul>
      </section>

      {(p.custom_responses ?? []).length > 0 && (
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold text-forest-800">Form answers</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {p.custom_responses!.map((c) => (<div key={c.id}><dt className="text-xs text-forest-500">{c.field_label}</dt><dd>{Array.isArray(c.value) ? c.value.join(", ") : String(c.value ?? "—")}</dd></div>))}
          </dl>
        </section>
      )}

    </div>
  );
}
