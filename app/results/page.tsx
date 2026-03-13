import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
import { LeadTable } from "@/components/LeadTable";
import { Badge } from "@/components/ui";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { runLeadScan } from "@/services/scanningService";

interface ResultsPageProps {
  searchParams: Promise<{
    location?: string;
    niche?: string;
    radius?: string;
    minimumReviewCount?: string;
    websiteStatus?: string;
    businessSize?: string;
  }>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const location = params.location ?? "Vancouver";
  const niche = params.niche ?? "dentists";
  const minimumReviewCount = params.minimumReviewCount ? Number(params.minimumReviewCount) : 0;

  const result = await runLeadScan({
    location,
    niche,
    radius: params.radius ? Number(params.radius) : 25,
    minimumReviewCount,
    websiteStatus: (params.websiteStatus as "any" | "has-website" | "no-website" | undefined) ?? "any",
    businessSize: (params.businessSize as "any" | "solo" | "small-team" | "multi-location" | undefined) ?? "any"
  });

  const exportHref = `/api/export?location=${encodeURIComponent(location)}&niche=${encodeURIComponent(niche)}&minimumReviewCount=${minimumReviewCount}&radius=${encodeURIComponent(params.radius ?? "25")}&websiteStatus=${encodeURIComponent(params.websiteStatus ?? "any")}&businessSize=${encodeURIComponent(params.businessSize ?? "any")}`;

  return (
    <AppShell
      title={`${location} ${niche}`}
      subtitle="Review scores, inspect issues, and prepare outreach."
      activeNav="dashboard"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          <div className="flex flex-wrap gap-3">
            <Badge>{result.summary.scanned} scanned</Badge>
            <Badge tone="success">{result.summary.highPriority} high opportunity</Badge>
            <Badge tone="warning">{result.summary.averageScore} avg score</Badge>
          </div>
          <div className="mt-6">
            <LeadTable leads={result.leads} />
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="surface-primary rounded-[24px] p-6">
            <p className="eyebrow">Scan summary</p>
            <div className="mt-4 grid gap-4">
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                <p className="meta-text text-slate-400">Most common issue</p>
                <p className="mt-2 text-sm text-white">{result.leads[0]?.issueLabels[0] ?? "No issues detected"}</p>
              </div>
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                <p className="meta-text text-slate-400">Best immediate angle</p>
                <p className="mt-2 text-sm text-white">{result.leads[0]?.pitch.serviceSuggestion ?? "Website modernization"}</p>
              </div>
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                <p className="meta-text text-slate-400">Top niche fit</p>
                <p className="mt-2 text-sm text-white">{niche}</p>
              </div>
            </div>
            <div className="mt-6 border-t border-white/8 pt-6">
              <p className="eyebrow">Export manager</p>
              <p className="mt-3 text-[14px] text-slate-300">Download the full list or export selected leads from the table.</p>
              <div className="mt-4 flex flex-col gap-3">
                <a href={exportHref} className="cta-primary glass-button rounded-full px-5 py-3 text-center text-[14px] font-semibold">
                  Export full CSV
                </a>
                <ExportButton leads={result.leads.slice(0, 10)} filename="leadscout-top-10.csv" />
              </div>
            </div>
          </section>
          <section className="surface-primary rounded-[24px] p-6">
            <p className="eyebrow">Pro intelligence</p>
            <div className="mt-4 divide-y divide-white/6">
              <div className="grid gap-2 py-4 first:pt-0">
                <p className="card-title text-white">Winning pitch angle</p>
                <p className="text-[14px] text-slate-300">Lead with missed after-hours bookings, then offer chat + booking recovery.</p>
              </div>
              <div className="grid gap-2 py-4">
                <p className="card-title text-white">Suggested offer</p>
                <p className="text-[14px] text-slate-300">Website modernization sprint + booking automation setup.</p>
              </div>
            </div>
          </section>
          <UpgradePrompt
            tier="agency"
            title="Agency mode adds shared execution"
            description="The table is useful solo. Agency turns it into a coordinated outbound queue."
            bullets={[
              "Assign owners directly from shortlisted leads",
              "Split exports by market, rep, or campaign",
              "Keep notes, statuses, and conversion angles visible to the whole team"
            ]}
          />
        </aside>
      </div>
    </AppShell>
  );
}
