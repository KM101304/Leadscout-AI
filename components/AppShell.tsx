import Link from "next/link";
import { Bell, CreditCard, Download, LayoutDashboard, Search, Settings, Star, UserCircle2 } from "lucide-react";
import { ReactNode } from "react";
import { placeholderAuth } from "@/lib/placeholders";
import { PlanStatus } from "@/components/PlanStatus";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Search Leads", icon: Search },
  { href: "/saved-leads", label: "Saved Leads", icon: Star },
  { href: "/exports", label: "Exports", icon: Download },
  { href: "/settings", label: "Account", icon: UserCircle2 },
  { href: "/pricing", label: "Billing", icon: CreditCard }
] as const;

export function AppShell({
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
  return (
    <main className="shell py-12">
      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="panel rounded-[20px] p-6">
          <PlanStatus
            tier={placeholderAuth.subscription.tier}
            leadsUsed={placeholderAuth.subscription.leadsUsedThisMonth}
            leadsLimit={placeholderAuth.subscription.leadsLimit}
          />
          <nav className="mt-6 grid gap-3">
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
                  className={`glass-button flex items-center gap-3 rounded-[16px] border px-4 py-2.5 text-sm ${
                    activeNav === key
                      ? "border-cyan-400/14 bg-cyan-400/10 text-white"
                      : "border-white/6 bg-white/[0.02] text-slate-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="surface-primary rounded-[20px] px-6 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="meta-text uppercase tracking-[0.32em] text-cyan-300/80">Workspace</p>
                <h1 className="page-title mt-3 text-white">{title}</h1>
                <p className="mt-2 max-w-3xl text-[14px] text-slate-300">{subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="surface-secondary flex items-center gap-3 rounded-[16px] px-4 py-3 text-sm text-slate-300">
                  <Search className="h-4 w-4 text-cyan-300" />
                  Search markets, issues, or saved notes
                </div>
                <button className="glass-button surface-secondary rounded-[16px] p-3 text-slate-300 hover:text-white">
                  <Bell className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
