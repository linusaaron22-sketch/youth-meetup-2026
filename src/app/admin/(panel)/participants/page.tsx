import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { fmtTime, isUuid, one, sanitizeSearch } from "@/lib/utils";

interface Row {
  id: string; registration_id: string; full_name: string; age: number | null; phone: string | null; congregation: string | null; source: string; created_at: string;
  attendance: { checked_in_at: string } | { checked_in_at: string }[] | null;
  registrations: { cancelled_at: string | null } | { cancelled_at: string | null }[] | null;
  is_duplicate: boolean;
}

export default async function Participants({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const q = sanitizeSearch(sp.q ?? "");
  const registrationStatus = sp.registrationStatus === "cancelled" || sp.registrationStatus === "all" ? sp.registrationStatus : "active";
  const page = Math.max(1, Math.min(100000, Number.parseInt(sp.page ?? "1", 10) || 1));
  const status = sp.status === "present" || sp.status === "absent" ? sp.status : null;
  const source = sp.source === "online" || sp.source === "walk_in" ? sp.source : null;
  const cursorParts = (sp.cursor ?? "").split("|");
  const cursorDate = cursorParts.length === 2 && Number.isFinite(Date.parse(cursorParts[0])) ? cursorParts[0] : null;
  const cursorId = cursorParts.length === 2 && isUuid(cursorParts[1]) ? cursorParts[1] : null;
  const direction = sp.direction === "before" ? "before" : "after";
  const { data, error } = await supabase.rpc("admin_participant_page", {
    p_query: q || null,
    p_status: status,
    p_source: source,
    p_registration_status: registrationStatus,
    p_duplicates_only: sp.dup === "1",
    p_page_size: 100,
    p_cursor_created_at: cursorDate,
    p_cursor_id: cursorId,
    p_direction: direction,
  });
  if (error) throw new Error(`Could not load participants: ${error.message}`);
  const result = data as { total?: number; rows?: Row[]; has_previous?: boolean; has_next?: boolean } | null;
  const rows = result?.rows ?? [];
  const duplicateIds = new Set(rows.filter((row) => row.is_duplicate).map((row) => row.id));
  const count = result?.total ?? 0;
  const exportParams = new URLSearchParams(Object.entries(sp).filter(([key, value]) => !["page", "cursor", "direction"].includes(key) && value) as [string, string][]).toString();
  const totalPages = Math.max(1, Math.ceil(count / 100));
  const pageHref = (target: number, way: "before" | "after") => {
    const cursorRow = way === "after" ? rows.at(-1) : rows[0];
    if (!cursorRow) return "/admin/participants";
    const params = new URLSearchParams(Object.entries(sp).filter(([key, value]) => !["page", "cursor", "direction"].includes(key) && value) as [string, string][]);
    params.set("page", String(target));
    params.set("cursor", `${cursorRow.created_at}|${cursorRow.id}`);
    params.set("direction", way);
    return `/admin/participants?${params}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-forest-800">Participants <span className="text-lg text-forest-500">({count})</span></h1>
        <a href={`/admin/participants/export?${exportParams}`} className="btn btn-gold">Export CSV</a>
      </div>
      <form className="card grid gap-3 sm:grid-cols-6" method="get">
        <input name="q" defaultValue={q} placeholder="Search name, phone, congregation" className="input sm:col-span-2" />
        <select name="status" defaultValue={status ?? ""} className="input"><option value="">Any status</option><option value="present">Present</option><option value="absent">Absent</option></select>
        <select name="source" defaultValue={sp.source ?? ""} className="input"><option value="">Any source</option><option value="online">Online</option><option value="walk_in">Walk-in</option></select>
        <select name="registrationStatus" defaultValue={registrationStatus} className="input"><option value="active">Active registrations</option><option value="cancelled">Cancelled registrations</option><option value="all">All registrations</option></select>
        <div className="flex gap-2">
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="dup" value="1" defaultChecked={sp.dup === "1"} /> Possible duplicates</label>
          <button className="btn btn-primary btn-sm ml-auto">Filter</button>
        </div>
      </form>
      <div className="card overflow-x-auto !p-2">
        <table className="w-full">
          <thead><tr><th className="th">Name</th><th className="th">Age</th><th className="th">Phone</th><th className="th">Congregation</th><th className="th">Source</th><th className="th">Arrival</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const a = one(r.attendance);
              const registration = one(r.registrations);
              return <tr key={r.id} className="border-t border-forest-100 hover:bg-forest-50/50">
                <td className="td font-medium"><Link className="text-forest-800 underline-offset-2 hover:underline" href={`/admin/participants/${r.id}`}>{r.full_name}</Link>{registration?.cancelled_at && <span className="badge ml-2 bg-red-100 text-red-800">cancelled</span>}{duplicateIds.has(r.id) && <span className="badge ml-2 bg-gold-100 text-gold-600">possible duplicate</span>}</td>
                <td className="td">{r.age ?? "—"}</td><td className="td">{r.phone ?? "—"}</td><td className="td">{r.congregation ?? "—"}</td>
                <td className="td">{r.source === "walk_in" ? <span className="badge bg-gold-100 text-gold-600">walk-in</span> : "online"}</td>
                <td className="td">{a ? <span className="badge bg-forest-100 text-forest-800">{fmtTime(a.checked_in_at)}</span> : <span className="text-forest-400">absent</span>}</td>
              </tr>;
            })}
            {rows.length === 0 && <tr><td className="td text-forest-500" colSpan={6}>No participants match.</td></tr>}
          </tbody>
        </table>
      </div>
      <nav className="flex items-center justify-between text-sm" aria-label="Participant pages">
        <span className="text-forest-600">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          {result?.has_previous && <Link className="btn btn-ghost btn-sm" href={pageHref(Math.max(1, page - 1), "before")}>Previous</Link>}
          {result?.has_next && <Link className="btn btn-ghost btn-sm" href={pageHref(page + 1, "after")}>Next</Link>}
        </div>
      </nav>
    </div>
  );
}
