// npm run i18n:check – static checks for the English/Hindi dictionaries.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const { en, hi, translate } = await import("../src/lib/i18n/messages.ts");

let failed = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${extra}`); if (!ok) failed++; };
const ph = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const DEVA = /[\u0900-\u097F]/;

const enKeys = Object.keys(en), hiKeys = Object.keys(hi);
check("same keys in en and hi", enKeys.length === hiKeys.length && enKeys.every((k) => k in hi), `(${enKeys.length} keys)`);
const badPh = enKeys.filter((k) => ph(en[k]) !== ph(hi[k]));
check("placeholders match in both languages", badPh.length === 0, badPh.join(", "));
// strings that are only placeholders/symbols (e.g. "← {name}") need no Devanagari of their own
const noDeva = hiKeys.filter((k) => /[A-Za-z\u0900-\u097F]/.test(hi[k].replace(/\{\w+\}/g, "")) && !DEVA.test(hi[k]));
check("every Hindi string contains Devanagari", noDeva.length === 0, noDeva.join(", "));
const empty = enKeys.filter((k) => !en[k].trim() || !hi[k].trim());
check("no empty strings", empty.length === 0, empty.join(", "));

// every key referenced in source exists
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) {
      walk(p);
    } else if (/\.(tsx?|mjs)$/.test(f) && !p.includes("i18n/messages")) {
      files.push(p);
    }
  }
})("src");
const used = new Set();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/\bt\(\s*"([a-zA-Z]+\.[a-zA-Z0-9]+)"/g)) used.add(m[1]);
  for (const m of src.matchAll(/"((?:err|f|btn|reg|home|event|done|p|c|e|g|q|fee|lang)\.[a-zA-Z0-9]+)"/g)) used.add(m[1]);
}
const missing = [...used].filter((k) => !(k in en));
check("every key used in code exists", missing.length === 0, missing.join(", "));
const unused = enKeys.filter((k) => !used.has(k));
check("no unused keys", unused.length === 0, unused.join(", "));

// translate()
check("params substitute (hi)", translate("hi", "g.minor", { age: 18 }) === "इस ग्रुप में कोई 18 साल से छोटा है।");
check("params substitute (en)", translate("en", "c.n", { n: 2 }) === "Companion 2");
check("unknown text passes through (admin/default messages)", translate("hi", "String must contain at least 2 character(s)") === "String must contain at least 2 character(s)");
check("admin English fallback of keys", translate("en", "err.phone") === "Enter a valid phone number");

// Values that must never be translated stay as-is in code
const form = readFileSync("src/app/register/RegisterForm.tsx", "utf8");
check("API/field keys untouched and retry uses an opaque key", /register\("primary\.fullName"\)/.test(form) && /submitRegistration\(values,\s*key\)/.test(form) && /sessionStorage\.setItem\(SUBMISSION_KEY_STORAGE, value\)/.test(form));
const fi = readFileSync("src/components/FieldInput.tsx", "utf8");
check("yes/no stored values stay 'Yes'/'No'", /\["Yes", "No"\]/.test(fi) && /onChange\(o\)/.test(fi));
console.log(failed ? `\n${failed} check(s) failed` : "\nAll i18n checks passed");
process.exit(failed ? 1 : 0);
