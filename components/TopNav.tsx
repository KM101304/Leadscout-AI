import Link from "next/link";
import { Bell, ChevronRight, LayoutDashboard } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { BrandMark } from "@/components/BrandMark";

export async function TopNav() {
  const viewer = await getViewer();
  const isSignedIn = Boolean(viewer.user);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-2xl">
      <div className="shell flex items-center justify-between gap-4 py-4">
        <Link href="/" className="text-white">
          <BrandMark />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
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
          {isSignedIn ? (
            <>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {viewer.user?.email}
              </div>
              <LogoutButton className="glass-button inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white transition hover:bg-white/10" />
            </>
          ) : (
            <Link
              href="/login"
              className="glass-button inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white transition hover:bg-white/10"
            >
              Login
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={isSignedIn ? "/dashboard" : "/login"}
            className="glass-button rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[14px] font-medium text-white"
          >
            <span className="inline-flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              {isSignedIn ? "Dashboard" : "Login"}
            </span>
          </Link>
          <button className="glass-button rounded-full border border-white/8 bg-white/[0.04] p-2 text-white">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
