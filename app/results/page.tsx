import Link from "next/link";
import { AlertTriangle, SearchCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
import { LeadTable } from "@/components/LeadTable";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { getViewer } from "@/lib/auth";
import { ScanConfigurationError, ScanExecutionError, ScanQueryError } from "@/lib/scanErrors";
import { Badge } from "@/components/ui";
import { runLeadScan } from "@/services/scanningService";

interface ResultsPageProps {
  searchParams: Promise<{
    location?: string;
    niche?: string;
    radius?: string;
    minimumReviewCount?: string;
    websiteStatus?: string;
    businessSize?: string;
    mode?: string;
  }>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const viewer = await getViewer();

  if (!params.location?.trim() || !params.niche?.trim()) {
    return (
      <AppShell title="Results workspace" subtitle="Run a scan to populate this workspace." activeNav="dashboard">
        <EmptyResultsState />
      </AppShell>
    );
  }

  try {
    const session = await runLeadScan({
      location: params.location,
      niche: params.niche,
      radius: params.radius ? Number(params.radius) : 25,
      minimumReviewCount: params.minimumReviewCount ? Number(params.minimumReviewCount) : 0,
      websiteStatus: (params.websiteStatus as "any" | "has-website" | "no-website" | undefined) ?? "any",
      businessSize: (params.businessSize as "any" | "solo" | "small-team" | "multi-location" | undefined) ?? "any",
      mode: (params.mode as "auto" | "indexed" | "live" | "demo" | undefined) ?? "auto",
      userId: viewer.user?.id ?? null,
      planTier: viewer.subscription.tier
    });

    const exportHref = session.isEmpty ? null : `/api/export?${session.queryString}`;

    return (
      <AppShell
        title={`${session.location} ${session.niche}`}
        subtitle="Every visible result, pitch, summary, and map marker comes from this one scan session."
        activeNav="dashboard"
      >
        <div className="results-page-grid">
          <section className="metric-grid">
            <div className="metric-card">
              <p className="eyebrow">Scan snapshot</p>
              <div className="results-summary-bar mt-4">
                <Badge>{session.summary.scanned} scanned</Badge>
                <Badge tone="success">{session.summary.highPriority} high opportunity</Badge>
                <Badge tone="warning">{session.summary.averageScore} avg score</Badge>
                <Badge tone={session.mode === "live" ? "success" : session.mode === "demo" ? "info" : "default"}>
                  {session.sourceSummary.label}
                </Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{session.sourceSummary.detail}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">{session.sourceSummary.freshnessText}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Most common issue</p>
              <p className="metric-copy text-white">{session.summary.topIssueLabels[0] ?? "No issues detected"}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Best immediate angle</p>
              <p className="metric-copy text-white">{session.pitchContext.recommendation}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Live scan usage</p>
              <p className="metric-copy text-white">
                {session.usage.liveScansThisMonth} / {session.usage.liveScanLimit || 0}
              </p>
            </div>
          </section>

          <section className="results-layout">
            {session.isEmpty ? (
              <section className="surface-secondary rounded-[26px] section-block">
                <p className="eyebrow">Empty market</p>
                <h2 className="section-title mt-3 text-white">{session.emptyStateTitle}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{session.emptyStateMessage}</p>
                {viewer.subscription.tier === "free" ? (
                  <div className="mt-6">
                    <UpgradePrompt
                      tier="starter"
                      title="Unlock hybrid scans for uncovered markets"
                      description="Starter introduces the hybrid framework so free users can upgrade into indexed search plus limited live refresh without jumping straight to Pro."
                      bullets={[
                        "Starter unlocks hybrid scan routing with limited live refresh.",
                        "Free users still stay fully indexed so costs stay protected.",
                        "Fresh markets get stored for future indexed reuse.",
                        "Pro keeps a broader semi-hybrid refresh envelope for heavier usage."
                      ]}
                    />
                  </div>
                ) : null}
              </section>
            ) : (
              <LeadTable leads={session.leads} />
            )}

            <aside className="results-rail">
              <section className="surface-secondary rounded-[26px] section-block">
                <p className="eyebrow">Export manager</p>
                <p className="mt-3 text-[14px] leading-6 text-slate-300">
                  Download the full list or export selected leads from the same scan session.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  {exportHref ? (
                    <a href={exportHref} className="cta-primary glass-button rounded-full px-5 py-3 text-center text-[14px] font-semibold">
                      Export full CSV
                    </a>
                  ) : (
                    <div className="surface-minimal rounded-[18px] px-4 py-3 text-sm text-slate-400">
                      Export is available after a scan returns leads.
                    </div>
                  )}
                  {session.leads.length > 0 ? <ExportButton leads={session.leads.slice(0, 10)} filename="leadscout-top-10.csv" /> : null}
                </div>
              </section>
              <section className="surface-secondary rounded-[26px] section-block">
                <p className="eyebrow">Session alignment</p>
                <div className="mt-4 divide-y divide-white/6">
                  <div className="grid gap-2 py-4 first:pt-0">
                    <p className="card-title text-white">Generated outreach pitch</p>
                    <p className="text-[14px] leading-6 text-slate-300">{session.pitchContext.generatedPitch}</p>
                  </div>
                  <div className="grid gap-2 py-4">
                    <p className="card-title text-white">Session query</p>
                    <p className="text-[14px] leading-6 text-slate-300">
                      {session.niche} in {session.location}
                    </p>
                  </div>
                  <div className="grid gap-2 py-4">
                    <p className="card-title text-white">Cost guardrail</p>
                    <p className="text-[14px] leading-6 text-slate-300">
                      Estimated live API cost for this session: ${session.sourceSummary.estimatedLiveCostUsd.toFixed(2)}
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </section>
        </div>
      </AppShell>
    );
  } catch (error) {
    const message =
      error instanceof ScanConfigurationError || error instanceof ScanExecutionError || error instanceof ScanQueryError
        ? error.message
        : "The scan failed. Please try again.";

    return (
      <AppShell title="Results workspace" subtitle="Run a scan to populate this workspace." activeNav="dashboard">
        <ErrorResultsState message={message} />
      </AppShell>
    );
  }
}

function EmptyResultsState() {
  return (
    <div className="empty-state">
      <div className="mx-auto inline-flex rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-200">
        <SearchCheck className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold text-white">No scan has been run yet</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        Enter a niche and location on the dashboard to create a scan session. The results table, issue summaries, and
        outreach pitch will all use that same request.
      </p>
      <Link
        href="/dashboard"
        className="glass-button mt-6 inline-flex h-[46px] items-center justify-center rounded-full border border-white/8 px-5 text-sm font-semibold text-white"
      >
        Go to dashboard
      </Link>
    </div>
  );
}

function ErrorResultsState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <div className="mx-auto inline-flex rounded-2xl border border-rose-400/18 bg-rose-400/10 p-3 text-rose-200">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold text-white">Scan unavailable</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">{message}</p>
      <Link
        href="/dashboard"
        className="glass-button mt-6 inline-flex h-[46px] items-center justify-center rounded-full border border-white/8 px-5 text-sm font-semibold text-white"
      >
        Try another scan
      </Link>
    </div>
  );
}
