import Link from "next/link";
import { Bell, CreditCard, Download, LayoutDashboard, Search, Star, UserCircle2 } from "lucide-react";
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
  showWorkspaceHeader = true,
  children
}: {
  title: string;
  subtitle: string;
  activeNav: "dashboard" | "saved-leads" | "exports" | "settings" | "pricing";
  showWorkspaceHeader?: boolean;
  children: ReactNode;
}) {
  const viewer = await getViewer();

  return (
    <main className="app-shell app-shell--authenticated">
      <div className="app-shell__frame">
        <div className="dashboard-shell">
          <aside className="app-sidebar surface-primary hidden rounded-[28px] p-5 xl:sticky xl:top-[104px] xl:grid xl:self-start">
            <div className="app-sidebar__header">
              <p className="eyebrow">Workspace</p>
              <p className="text-sm leading-6 text-slate-300">Lead discovery, qualification, exports, and account controls in one operating layer.</p>
            </div>
            <PlanStatus
              tier={viewer.subscription.tier}
              leadsUsed={viewer.subscription.leadsUsedThisMonth}
              leadsLimit={viewer.subscription.leadsLimit}
              compact
            />
            <nav className="app-sidebar__nav flex gap-3 xl:grid">
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
                    className={`app-sidebar__nav-link glass-button flex shrink-0 items-center gap-3 rounded-[16px] border px-4 py-3 text-sm xl:shrink ${
                      activeNav === key
                        ? "border-cyan-400/24 bg-cyan-400/12 text-white shadow-lg shadow-cyan-950/20"
                        : "border-white/8 bg-white/[0.02] text-slate-300 hover:border-white/12 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="app-sidebar__account subtle-panel rounded-[20px] section-subtle">
              <p className="meta-text text-slate-400">Signed in as</p>
              <p className="mt-2 truncate text-sm font-medium text-white">{viewer.user?.email ?? "Unknown user"}</p>
              <LogoutButton className="glass-button mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10" />
            </div>
          </aside>

          <section className="app-shell__main min-w-0">
            {showWorkspaceHeader ? (
              <div className="workspace-frame app-shell__hero">
                <div className="workspace-frame__header">
                  <div className="dashboard-header-grid">
                    <div className="workspace-header min-w-0">
                      <p className="workspace-kicker">Workspace</p>
                      <h1 className="workspace-title text-white">{title}</h1>
                      <p className="workspace-subtitle">{subtitle}</p>
                    </div>
                    <div className="hidden flex-wrap items-center gap-3 xl:justify-end">
                      <div className="surface-secondary hidden min-w-[320px] items-center gap-3 rounded-[16px] px-4 py-3 text-sm text-slate-300 lg:flex">
                        <Search className="h-4 w-4 text-cyan-300" />
                        Search markets, issues, or saved notes
                      </div>
                      <button className="glass-button surface-secondary rounded-[16px] p-3 text-slate-300 hover:text-white">
                        <Bell className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="app-shell__content">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
