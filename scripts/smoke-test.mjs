// Run after applying the migration:  npm run smoke   (needs .env.local)
// Verifies real DB saving, RLS lockout of anonymous users, and duplicate check-in prevention.
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

if (process.env.SMOKE_TEST_ALLOW_DATABASE_WRITES !== "1") {
  console.error("Refusing to write to Supabase. Set SMOKE_TEST_ALLOW_DATABASE_WRITES=1 only for an approved staging project.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !svc) { console.error("Missing env vars"); process.exit(1); }
const admin = createClient(url, svc, { auth: { persistSession: false } });
const anonDb = createClient(url, anon, { auth: { persistSession: false } });
let failed = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${extra}`); if (!ok) failed++; };

const regId = randomUUID(), p1 = randomUUID(), p2 = randomUUID();
try {
  check("create registration", !(await admin.from("registrations").insert({ id: regId })).error);
  const ins = await admin.from("participants").insert([
    { id: p1, registration_id: regId, full_name: "Smoke Test One", age: 14, phone: "+91 90000 00001", congregation: "Test", is_primary: true },
    { id: p2, registration_id: regId, full_name: "Smoke Test Two", age: 130, phone: "+91 90000 00001", congregation: "Test" },
  ]);
  check("ages 14 and above without an eligibility ceiling save", !ins.error, ins.error?.message);
  const underage = await admin.from("participants").insert({
    id: randomUUID(), registration_id: regId, full_name: "Smoke Test Underage", age: 13,
  });
  check("age 13 is rejected", !!underage.error, underage.error?.message);
  check("emergency contact saves", !(await admin.from("emergency_contacts").insert({ participant_id: p1, name: "EC", relationship: "Parent", phone: "+91 90000 00002" })).error);

  const a = await anonDb.from("participants").select("id").eq("registration_id", regId);
  check("anon cannot read participants (RLS/grants)", a.error?.code === "42501" || (!a.error && a.data.length === 0));
  const w = await anonDb.from("participants").insert({ registration_id: regId, full_name: "Hacker" });
  check("anon cannot insert participants (RLS)", !!w.error);
  const s = await anonDb.from("event_settings").select("*");
  check("anon cannot read settings (RLS/grants)", s.error?.code === "42501" || (!s.error && s.data.length === 0));

  check("first check-in OK", !(await admin.from("attendance").insert({ participant_id: p1 })).error);
  const dup = await admin.from("attendance").insert({ participant_id: p1 });
  check("duplicate check-in rejected", dup.error?.code === "23505");

  const wi = await admin.from("participants").insert({ registration_id: regId, full_name: "Walk In", age: 30, source: "walk_in" });
  check("walk_in source accepted", !wi.error, wi.error?.message);
} finally {
  await admin.from("registrations").delete().eq("id", regId);
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
