import Link from "next/link";
import { Bell, CreditCard, Download, LayoutDashboard, Search, Settings, Star, UserCircle2 } from "lucide-react";
import { ReactNode } from "react";
import { PlanStatus } from "@/components/PlanStatus";
import { getViewer } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Search Leads", icon: Search },
  { href: "/saved-leads", label: "Saved Leads", icon: Star },
  { href: "/exports", label: "Exports", icon: Download },
  { href: "/settings", label: "Account", icon: UserCircle2 },
  { href: "/pricing", label: "Billing", icon: CreditCard }
] as const;

export async function AppShell({
  title,
  subtitle,
  activeNav,
  children
}: {
  title: string;
  subtitle: string;
  activeNav: "dashboard" | "saved-leads" | "exports" | "settings" | "pricing";
  children: ReactNode;
}) {
  const viewer = await getViewer();

  return (
    <main className="shell py-6 md:py-10">
      <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="panel content-stack rounded-[24px] p-4 md:p-6">
          <PlanStatus
            tier={viewer.subscription.tier}
            leadsUsed={viewer.subscription.leadsUsedThisMonth}
            leadsLimit={viewer.subscription.leadsLimit}
          />
          <nav className="flex gap-3 overflow-x-auto pb-1 xl:grid xl:overflow-visible xl:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const key =
                item.label === "Dashboard" || item.label === "Search Leads"
                  ? "dashboard"
                  : item.href.slice(1);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`glass-button flex shrink-0 items-center gap-3 rounded-[18px] border px-4 py-3 text-sm xl:shrink ${
                    activeNav === key
                      ? "border-cyan-400/20 bg-cyan-400/12 text-white shadow-lg shadow-cyan-950/20"
                      : "border-white/6 bg-white/[0.02] text-slate-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
            <p className="meta-text text-slate-400">Signed in as</p>
            <p className="mt-2 truncate text-sm font-medium text-white">{viewer.user?.email ?? "Unknown user"}</p>
            <LogoutButton className="glass-button mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10" />
          </div>
        </aside>

        <section className="min-w-0">
          <div className="surface-primary rounded-[24px] px-5 py-5 md:px-7 md:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="meta-text uppercase tracking-[0.32em] text-cyan-300/80">Workspace</p>
                <h1 className="mt-3 font-heading text-[28px] font-semibold leading-[1.1] text-white md:page-title">{title}</h1>
                <p className="mt-2 max-w-3xl text-[15px] text-slate-300">{subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="surface-secondary hidden min-w-[280px] items-center gap-3 rounded-[18px] px-4 py-3 text-sm text-slate-300 lg:flex">
                  <Search className="h-4 w-4 text-cyan-300" />
                  Search markets, issues, or saved notes
                </div>
                <button className="glass-button surface-secondary rounded-[16px] p-3 text-slate-300 hover:text-white">
                  <Bell className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
