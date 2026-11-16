export const one = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));
}

export function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", { timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));
}

export function safeBack(p: string | null | undefined, fallback: string) {
  return p && p.startsWith("/admin") && !p.startsWith("//") ? p : fallback;
}

export const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export function sanitizeSearch(q: string) {
  return q.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);
}

export function csvCell(v: unknown) {
  let s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // block spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function normName(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}
