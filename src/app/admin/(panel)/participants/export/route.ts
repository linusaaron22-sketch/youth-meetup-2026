import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { csvCell, one, sanitizeSearch } from "@/lib/utils";

interface R {
  id: string; registration_id: string; full_name: string; age: number | null; phone: string | null; congregation: string | null;
  source: string; is_primary: boolean; guardian_name: string | null; guardian_phone: string | null; created_at: string;
  registrations: { cancelled_at: string | null } | { cancelled_at: string | null }[] | null;
  emergency_contacts: { name: string; relationship: string; phone: string } | { name: string; relationship: string; phone: string }[] | null;
  attendance: { checked_in_at: string } | { checked_in_at: string }[] | null;
  custom_responses: { field_label: string; value: unknown }[] | null;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: admin, error: adminError } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (adminError) return new NextResponse("Authorization check failed", { status: 500 });
  if (!admin) return new NextResponse("Forbidden", { status: 403 });

  const sp = req.nextUrl.searchParams;
  const q = sanitizeSearch(sp.get("q") ?? "");
  const registrationStatus = sp.get("registrationStatus") === "cancelled" || sp.get("registrationStatus") === "all" ? sp.get("registrationStatus") : "active";
  const status = sp.get("status");
  const source = sp.get("source");
  const { data: snapshotData, error: snapshotError } = await supabase.rpc("admin_participant_export_ids", {
    p_query: q || null,
    p_status: status === "present" || status === "absent" ? status : null,
    p_source: source === "online" || source === "walk_in" ? source : null,
    p_registration_status: registrationStatus,
    p_duplicates_only: sp.get("dup") === "1",
  });
  if (snapshotError) return new NextResponse("Could not create a consistent export snapshot", { status: 500 });
  const ids = Array.isArray(snapshotData) ? snapshotData.filter((id): id is string => typeof id === "string") : [];
  const rowsById = new Map<string, R>();
  for (let offset = 0; offset < ids.length; offset += 500) {
    const batchIds = ids.slice(offset, offset + 500);
    const { data, error } = await supabase.from("participants").select(
      "id, registration_id, full_name, age, phone, congregation, source, is_primary, guardian_name, guardian_phone, created_at, emergency_contacts(name, relationship, phone), attendance(checked_in_at), custom_responses(field_label, value)",
    ).in("id", batchIds);
    if (error) return new NextResponse("Export failed while loading the snapshot", { status: 500 });
    for (const row of (data ?? []) as unknown as R[]) rowsById.set(row.id, row);
  }
  if (rowsById.size !== ids.length) return new NextResponse("The participant snapshot changed during export; please retry.", { status: 409 });
  const exportRows = ids.map((id) => rowsById.get(id)!);
  const labels = new Set<string>();
  for (const row of exportRows) for (const response of row.custom_responses ?? []) labels.add(response.field_label);

  const labelList = [...labels];
  const head = ["Name", "Age", "Phone", "Congregation", "Source", "Registered by (primary)", "Group ref", "Emergency name", "Emergency relationship", "Emergency phone",
    "Guardian name", "Guardian phone", "Present", "Arrival time (IST)", "Registered at", ...labelList];
  const { error: logError } = await supabase.from("activity_logs").insert({
    actor_id: user.id, actor_email: user.email, action: "export_csv", entity: "participants", details: { rows: exportRows.length },
  });
  if (logError) return new NextResponse("Could not record export activity", { status: 500 });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode("\uFEFF" + head.map(csvCell).join(",") + "\r\n"));
        for (let offset = 0; offset < exportRows.length; offset += 500) {
          const lines: string[] = [];
          for (const r of exportRows.slice(offset, offset + 500)) {
            const emergency = one(r.emergency_contacts), attendance = one(r.attendance);
            const answers = new Map((r.custom_responses ?? []).map((response) => [response.field_label, response.value]));
            lines.push([
              r.full_name, r.age, r.phone, r.congregation, r.source, r.is_primary ? "yes" : "no", r.registration_id.slice(0, 8).toUpperCase(),
              emergency?.name, emergency?.relationship, emergency?.phone, r.guardian_name, r.guardian_phone, attendance ? "yes" : "no",
              attendance ? new Date(attendance.checked_in_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "",
              new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), ...labelList.map((label) => answers.get(label) as unknown),
            ].map(csvCell).join(","));
          }
          if (lines.length) controller.enqueue(encoder.encode(lines.join("\r\n") + "\r\n"));
        }
        controller.close();
      } catch {
        controller.error(new Error("CSV export failed while reading participants."));
      }
    },
  });
  return new NextResponse(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="participants-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
