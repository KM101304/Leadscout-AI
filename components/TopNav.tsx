import Link from "next/link";
import { Bell, ChevronRight, LayoutDashboard } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { BrandMark } from "@/components/BrandMark";
import { MobileTabNav } from "@/components/MobileTabNav";

export async function TopNav() {
  const viewer = await getViewer();
  const isSignedIn = Boolean(viewer.user);

  return (
    <>
      <header className="top-nav sticky top-0 z-40 border-b border-white/8 bg-slate-950/70 backdrop-blur-2xl">
        <div className="top-nav__frame top-nav__inner">
          <div className="top-nav__bar">
            <Link href="/" className="text-white">
              <BrandMark />
            </Link>
            <nav className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] p-1 text-sm text-slate-300 lg:flex">
              <Link href="/dashboard" className="rounded-full px-4 py-2 transition hover:bg-white/[0.05] hover:text-white">
                Dashboard
              </Link>
              <Link href="/saved-leads" className="rounded-full px-4 py-2 transition hover:bg-white/[0.05] hover:text-white">
                Saved Leads
              </Link>
              <Link href="/exports" className="rounded-full px-4 py-2 transition hover:bg-white/[0.05] hover:text-white">
                Exports
              </Link>
              <Link href="/pricing" className="rounded-full px-4 py-2 transition hover:bg-white/[0.05] hover:text-white">
                Pricing
              </Link>
            </nav>
            <div className="hidden items-center gap-2 lg:flex">
              <button className="glass-button rounded-full border border-white/10 bg-white/5 p-2.5 text-white transition hover:bg-white/10">
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
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              {isSignedIn ? null : (
                <Link
                  href="/login"
                  className="glass-button rounded-full border border-white/8 bg-white/[0.04] px-3.5 py-2 text-[13px] font-medium text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Login
                  </span>
                </Link>
              )}
              <button className="glass-button rounded-full border border-white/8 bg-white/[0.04] p-2 text-white">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>
      {isSignedIn ? (
        <>
          <MobileTabNav />
        </>
      ) : null}
    </>
  );
}
