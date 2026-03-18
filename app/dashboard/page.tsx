import Link from "next/link";
import { SearchCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SearchForm } from "@/components/SearchForm";
import { Badge } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { env } from "@/lib/env";

export default async function DashboardPage() {
  const viewer = await getViewer();

  return (
    <AppShell
      title="Search local markets and surface easy wins"
      subtitle="Use indexed search by default, then unlock cache-first live scans when premium users need fresh coverage."
      activeNav="dashboard"
      showWorkspaceHeader={false}
    >
      <div className="app-page-stack">
        <SearchForm tier={viewer.subscription.tier} />

        <section className="dashboard-mobile-priority-grid">
          <section className="surface-primary rounded-[28px] section-block">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-200">
                <SearchCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="eyebrow">Scan workflow</p>
                <h2 className="section-title mt-2 text-white">Start with a real market query</h2>
              </div>
            </div>
            <div className="mt-4 app-card-grid-tight text-sm leading-6 text-slate-300">
              <p>Enter a niche and location above to create a single scan session.</p>
              <p>The results, summaries, issue tags, recommendations, and pitch will all come from that exact request.</p>
            </div>
          </section>

          <section className="surface-primary rounded-[28px] section-block">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Workspace state</p>
                <h2 className="card-title mt-2 text-white">No scan session loaded yet</h2>
              </div>
              {viewer.subscription.tier === "free" ? (
                <Badge tone="warning">Indexed only</Badge>
              ) : env.enableDemoMode ? (
                <Badge tone="warning">Premium + demo available</Badge>
              ) : (
                <Badge>Premium live scans enabled</Badge>
              )}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Free searches stay inside the indexed dataset so they do not trigger paid APIs. Premium users can choose
              indexed-only, cache-first auto mode, or an explicit live scan when freshness matters.
            </p>
            <div className="mt-5">
              <Link
                href="/saved-leads"
                className="glass-button inline-flex h-[46px] items-center justify-center rounded-full border border-white/8 px-5 text-sm font-semibold text-white"
              >
                View saved leads
              </Link>
            </div>
          </section>
        </section>
      </div>
    </AppShell>
  );
}
