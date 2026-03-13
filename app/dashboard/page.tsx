import { AppShell } from "@/components/AppShell";
import { SearchForm } from "@/components/SearchForm";
import { LeadCard } from "@/components/LeadCard";
import { Badge } from "@/components/ui";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { runLeadScan } from "@/services/scanningService";

export default async function DashboardPage() {
  const preview = await runLeadScan({
    location: "Seattle",
    niche: "contractors",
    minimumReviewCount: 0
  });

  return (
    <AppShell
      title="Search local markets and surface easy wins"
      subtitle="Surface high-opportunity leads and prepare outreach."
      activeNav="dashboard"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px] xl:items-start">
        <SearchForm initialLocation="Seattle" initialNiche="contractors" />

        <div className="surface-primary rounded-[20px] p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="meta-text uppercase tracking-[0.32em] text-cyan-300/80">Recent scans</p>
            <Badge tone="success">2 active markets</Badge>
          </div>
          <div className="mt-4 divide-y divide-white/6">
            <div className="grid gap-2 py-4 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <p className="card-title text-white">Seattle contractors</p>
                <Badge tone="success">8 high-opportunity</Badge>
              </div>
              <p className="text-[14px] text-slate-400">62 leads scanned · average score 71</p>
            </div>
            <div className="grid gap-2 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="card-title text-white">Vancouver dentists</p>
                <Badge tone="warning">5 medium-opportunity</Badge>
              </div>
              <p className="text-[14px] text-slate-400">44 leads scanned · weak SEO trends detected</p>
            </div>
          </div>
          <div className="divider mt-4 pt-4">
            <p className="meta-text uppercase tracking-[0.32em] text-cyan-300/80">Quick actions</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a href="/dashboard" className="glass-button surface-secondary rounded-[16px] px-4 py-3 text-[14px] font-medium text-white">
                New search
              </a>
              <a href="/exports" className="glass-button surface-secondary rounded-[16px] px-4 py-3 text-[14px] font-medium text-white">
                Export last list
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="surface-primary rounded-[20px] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title text-white">High-priority leads</h2>
            <p className="meta-text text-slate-400">Seattle contractors</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {preview.leads.slice(0, 6).map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </section>

        <div className="grid gap-6">
          <UpgradePrompt
            tier="pro"
            title="Pro makes the workspace feel complete"
            description="Right now the free tier helps you validate a market. Pro is where it becomes a daily outbound engine."
            bullets={[
              "Generate multiple pitch angles per lead instead of one default draft",
              "Save high-priority lists and revisit them as repeatable prospecting pipelines",
              "Export refined shortlists instead of one-off raw CSVs"
            ]}
          />
          <section className="surface-primary rounded-[20px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="meta-text uppercase tracking-[0.32em] text-cyan-300/80">Pro workspace preview</p>
                <h2 className="section-title mt-2 text-white">Saved prospecting pipelines</h2>
              </div>
              <Badge tone="warning">Paid</Badge>
            </div>
            <div className="mt-4 divide-y divide-white/6">
              <div className="grid gap-2 py-4 first:pt-0">
                <p className="card-title text-white">Chiropractor booking fixes</p>
                <p className="text-[14px] text-slate-400">14 leads · booking automation + after-hours conversion</p>
              </div>
              <div className="grid gap-2 py-4">
                <p className="card-title text-white">Dental SEO quick wins</p>
                <p className="text-[14px] text-slate-400">9 leads · local SEO + landing page cleanup</p>
              </div>
              <div className="grid gap-2 py-4">
                <p className="card-title text-white">No-website contractors</p>
                <p className="text-[14px] text-slate-400">21 leads · trust-first launch + intake funnel</p>
              </div>
            </div>
          </section>

          <UpgradePrompt
            tier="agency"
            title="Agency unlocks a team command center"
            description="If multiple reps touch the same lead pool, Agency adds coordination."
            bullets={[
              "Assign lead owners and avoid duplicate outreach",
              "Run shared exports by campaign, rep, or niche",
              "Track which pitch angles convert best across the team"
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
