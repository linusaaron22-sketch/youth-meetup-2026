import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

const NAV = [
  ["/admin", "Overview"],
  ["/admin/participants", "Participants"],
  ["/admin/checkin", "Check-in"],
  ["/admin/walkins", "Walk-ins"],
  ["/admin/forms", "Form builder"],
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div lang="en" className="admin-root min-h-screen bg-ivory-50">
      <header className="sticky top-0 z-10 bg-forest-800 text-ivory-50 shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <span className="font-display text-lg">Youth Meet Up · Admin</span>
          <form action={logout} className="flex items-center gap-3 text-xs">
            <span className="hidden text-ivory-100/70 sm:inline">{user.email}</span>
            <button className="rounded-lg border border-gold-400/50 px-3 py-1.5 text-gold-300 hover:bg-white/10">Sign out</button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2 text-sm">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-ivory-100/90 hover:bg-white/10">{label}</Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
