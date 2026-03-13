import Link from "next/link";
import { ArrowRight, History, SearchCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SearchForm } from "@/components/SearchForm";
import { LeadCard } from "@/components/LeadCard";
import { Badge } from "@/components/ui";
import { runLeadScan } from "@/services/scanningService";

export default async function DashboardPage() {
  const preview = await runLeadScan({
    location: "Seattle",
    niche: "contractors",
    minimumReviewCount: 0
  });

  const recentScans = [
    {
      name: "Seattle contractors",
      summary: "62 leads scanned",
      detail: "8 high-opportunity leads ready for outreach",
      href: "/results?location=Seattle&niche=contractors&radius=25&minimumReviewCount=0&websiteStatus=any&businessSize=any",
      tone: "success" as const
    },
    {
      name: "Vancouver dentists",
      summary: "44 leads scanned",
      detail: "Weak SEO and booking gaps surfaced",
      href: "/results?location=Vancouver&niche=dentists&radius=25&minimumReviewCount=0&websiteStatus=any&businessSize=any",
      tone: "warning" as const
    }
  ];

  return (
    <AppShell
      title="Search local markets and surface easy wins"
      subtitle="Start a scan quickly, reopen recent results, and work the strongest leads first."
      activeNav="dashboard"
    >
      <div className="grid gap-5 md:gap-8">
        <SearchForm initialLocation="Seattle" initialNiche="contractors" />

        <section className="dashboard-mobile-priority-grid">
          <div className="surface-primary rounded-[24px] p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Quick access</p>
                <h2 className="section-title mt-2 text-white">Recent scans</h2>
              </div>
              <Badge tone="success">2 active markets</Badge>
            </div>
            <div className="mt-5 grid gap-3">
              {recentScans.map((scan) => (
                <a
                  key={scan.name}
                  href={scan.href}
                  className="glass-button rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="card-title text-white">{scan.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{scan.summary}</p>
                    </div>
                    <Badge tone={scan.tone}>{scan.tone === "success" ? "Open" : "Review"}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">
                    <span>{scan.detail}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-cyan-300" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="dashboard-mobile-action-rail">
            <section className="surface-primary rounded-[24px] p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-200">
                  <SearchCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="eyebrow">Action queue</p>
                  <h2 className="card-title mt-2 text-white">Next best move</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Reopen Seattle contractors and start with the leads scoring 80+ for the fastest outreach wins.
              </p>
              <Link
                href="/results?location=Seattle&niche=contractors&radius=25&minimumReviewCount=0&websiteStatus=any&businessSize=any"
                className="cta-primary glass-button mt-5 inline-flex h-[46px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"
              >
                Open best leads
              </Link>
            </section>

            <section className="surface-primary rounded-[24px] p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-slate-200">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <p className="eyebrow">Momentum</p>
                  <h2 className="card-title mt-2 text-white">Keep the queue moving</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                <p>Save strong prospects as soon as you spot a usable service angle.</p>
                <p>Switch to map view when you need geographic clustering for field outreach or local campaigns.</p>
              </div>
            </section>
          </div>
        </section>

        <section className="surface-primary rounded-[24px] p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Priority leads</p>
              <h2 className="section-title mt-2 text-white">Highest-value opportunities</h2>
            </div>
            <p className="meta-text text-slate-400">Seattle contractors</p>
          </div>
          <div className="mt-5 grid gap-4 md:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {preview.leads.slice(0, 6).map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
