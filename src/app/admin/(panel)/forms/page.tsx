import { requireAdmin } from "@/lib/auth";
import { getActiveForm, getLatestForm } from "@/lib/data";
import FormBuilder from "./FormBuilder";

export default async function FormsPage() {
  const { supabase } = await requireAdmin();
  const activeForm = await getActiveForm(supabase);
  const hasActiveForm = activeForm.formId !== null;
  const form = hasActiveForm ? activeForm : (await getLatestForm(supabase)) ?? activeForm;
  const { count } = await supabase.from("custom_responses").select("id", { count: "exact", head: true });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold text-forest-800">Form builder</h1>
      <p className="text-sm text-forest-600">Custom questions appear on the final registration step. Publishing creates a new version – earlier answers ({count ?? 0} stored) are never changed or lost.</p>
      {!hasActiveForm && <p role="alert" className="rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-forest-800">No active registration form is available. The latest saved version is loaded for recovery; publish it to restore registration. If no version exists yet, publish a form with no custom questions to restore the standard registration fields.</p>}
      <FormBuilder key={`${form.version}-${hasActiveForm}`} initial={form.fields} version={form.version} hasActiveForm={hasActiveForm} />
    </div>
  );
}
