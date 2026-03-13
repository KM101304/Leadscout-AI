import Link from "next/link";
import { AlertTriangle, SearchCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
import { LeadTable } from "@/components/LeadTable";
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
  }>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;

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
      businessSize: (params.businessSize as "any" | "solo" | "small-team" | "multi-location" | undefined) ?? "any"
    });

    const exportHref = `/api/export?${session.query.queryString}`;

    return (
      <AppShell
        title={`${session.query.location} ${session.query.niche}`}
        subtitle="Review one consistent scan session from query to pitch."
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
                {session.mode === "demo" ? <Badge tone="info">Demo mode</Badge> : null}
              </div>
            </div>
            <div className="metric-card">
              <p className="metric-label">Most common issue</p>
              <p className="metric-copy text-white">{session.summary.topIssueLabels[0] ?? "No issues detected"}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Best immediate angle</p>
              <p className="metric-copy text-white">{session.summary.recommendation}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Top niche fit</p>
              <p className="metric-copy text-white">{session.query.niche}</p>
            </div>
          </section>

          <section className="results-layout">
            <LeadTable leads={session.leads} />

            <aside className="results-rail">
              <section className="surface-primary rounded-[26px] section-block">
                <p className="eyebrow">Export manager</p>
                <p className="mt-3 text-[14px] leading-6 text-slate-300">
                  Download the full list or export selected leads from the same scan session.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  <a href={exportHref} className="cta-primary glass-button rounded-full px-5 py-3 text-center text-[14px] font-semibold">
                    Export full CSV
                  </a>
                  <ExportButton leads={session.leads.slice(0, 10)} filename="leadscout-top-10.csv" />
                </div>
              </section>
              <section className="surface-primary rounded-[26px] section-block">
                <p className="eyebrow">Pitch alignment</p>
                <div className="mt-4 divide-y divide-white/6">
                  <div className="grid gap-2 py-4 first:pt-0">
                    <p className="card-title text-white">Generated outreach pitch</p>
                    <p className="text-[14px] leading-6 text-slate-300">{session.summary.generatedPitch}</p>
                  </div>
                  <div className="grid gap-2 py-4">
                    <p className="card-title text-white">Session query</p>
                    <p className="text-[14px] leading-6 text-slate-300">
                      {session.query.niche} in {session.query.location}
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
