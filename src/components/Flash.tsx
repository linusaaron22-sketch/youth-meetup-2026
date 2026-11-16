export default function Flash({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <div role="status" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-forest-200 bg-forest-50 text-forest-800"}`}>
      {error ?? ok}
    </div>
  );
}
