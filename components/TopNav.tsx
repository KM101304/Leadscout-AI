import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="shell flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-wide text-white">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-400/15 text-sm text-cyan-300">
            LS
          </span>
          LeadScout AI
        </Link>
        <nav className="flex items-center gap-6 text-sm text-slate-300">
          <Link href="/saved-leads" className="transition hover:text-white">
            Saved Leads
          </Link>
          <Link href="/exports" className="transition hover:text-white">
            Exports
          </Link>
          <Link href="/pricing" className="transition hover:text-white">
            Pricing
          </Link>
          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
          </Link>
          <button className="glass-button rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10">
            <Bell className="h-4 w-4" />
          </button>
          <a
            href="#"
            className="glass-button inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white transition hover:bg-white/10"
          >
            Login
            <ChevronRight className="h-4 w-4" />
          </a>
        </nav>
      </div>
    </header>
  );
}
