import { login } from "./actions";
import { Sprig } from "@/components/Illustrations";

export const metadata = { title: "Admin login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const msg = error === "unauthorized" ? "This account is not an authorised administrator." : error ? "Incorrect email or password." : "";
  return (
    <main lang="en" className="admin-root relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-forest-900 to-forest-700 px-4">
      <Sprig className="pointer-events-none absolute -left-4 bottom-0 h-72 w-32 text-forest-600/40" />
      <form action={login} className="card relative w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-forest-800">Admin login</h1>
        {msg && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{msg}</p>}
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
        <button className="btn btn-primary w-full" type="submit">Sign in</button>
      </form>
    </main>
  );
}
