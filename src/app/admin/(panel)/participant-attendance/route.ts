import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid, sanitizeSearch } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: admin, error: adminError } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (adminError) return NextResponse.json({ error: "Authorization check failed" }, { status: 500 });
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const page = Math.max(1, Math.min(100000, Number.parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1));
  const q = sanitizeSearch(req.nextUrl.searchParams.get("q") ?? "");
  const [cursorTime, cursorId] = (req.nextUrl.searchParams.get("cursor") ?? "").split("|");
  const validCursor = cursorTime && Number.isFinite(Date.parse(cursorTime)) && isUuid(cursorId ?? "");
  const direction = req.nextUrl.searchParams.get("direction") === "before" ? "before" : "after";
  const { data, error } = await supabase.rpc("admin_participant_page", {
    p_query: q || null,
    p_status: null,
    p_source: null,
    p_registration_status: "active",
    p_duplicates_only: false,
    p_page_size: 50,
    p_cursor_created_at: validCursor ? cursorTime : null,
    p_cursor_id: validCursor ? cursorId : null,
    p_direction: direction,
  });
  if (error) return NextResponse.json({ error: "Could not load participant attendance" }, { status: 500 });
  const result = data as { rows?: unknown[]; total?: number; has_previous?: boolean; has_next?: boolean } | null;
  return NextResponse.json({ participants: result?.rows ?? [], total: result?.total ?? 0, hasPrevious: result?.has_previous ?? false, hasNext: result?.has_next ?? false, page, pageSize: 50 }, { headers: { "Cache-Control": "no-store" } });
}
