import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { Badge, IssueBadge, SectionHeading, ScorePill } from "@/components/ui";
import { Bot, Download, SearchCheck, ShieldAlert, TableProperties } from "lucide-react";
import { getViewer } from "@/lib/auth";

const steps = [
  {
    title: "Search a niche and city",
    text: "Target local markets like Vancouver dentists or Seattle roofing companies."
  },
  {
    title: "AI analyzes businesses",
    text: "LeadScout AI scores visible issues like weak SEO, missing booking flow, mobile friction, and no chat."
  },
  {
    title: "Get prioritized call lists",
    text: "Review ranked leads, open the detail panel, generate a pitch, and export your outreach list."
  }
];

const featureCards = [
  {
    icon: ShieldAlert,
    title: "Opportunity scoring",
    text: "Instantly rank businesses by urgency and service fit."
  },
  {
    icon: SearchCheck,
    title: "Website analysis",
    text: "Spot conversion gaps, trust issues, and missing systems in seconds."
  },
  {
    icon: Bot,
    title: "AI pitch generation",
    text: "Turn issue detection into cold-call openers and email angles."
  },
  {
    icon: Download,
    title: "CSV exports",
    text: "Move selected leads into your outbound workflow with one click."
  }
];

const pricing = [
  { name: "Free", price: "$0", value: "25 leads per month", badge: "For testing the workflow" },
  { name: "Starter", price: "$27", value: "Hybrid scans, exports, and limited live refresh", badge: "Best first paid tier" },
  { name: "Pro", price: "$49", value: "Semi-hybrid scans, exports, AI pitch generation", badge: "Best for solo operators" },
  { name: "Agency", price: "$149", value: "Team accounts, bulk exports, advanced scoring", badge: "Built for outbound teams" }
];

export default async function HomePage() {
  const viewer = await getViewer();
  const primaryHref = viewer.user ? "/dashboard" : "/login";
  const primaryLabel = viewer.user ? "Open dashboard" : "Login to start scanning";
  const demoHref = viewer.user ? "/dashboard" : "/login";
  const demoLabel = viewer.user ? "Open a demo scan from dashboard" : "Login to view demo scans";

  return (
    <main className="landing-stack pb-10 md:pb-14">
      <section className="shell pt-14 md:pt-24">
        <div className="grid gap-10 md:gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(480px,560px)] lg:items-center">
          <div className="max-w-3xl">
            <Badge tone="info">Lead discovery for agencies and consultants</Badge>
            <h1 className="mt-6 max-w-4xl font-heading text-4xl font-semibold tracking-tight text-white md:text-6xl xl:text-7xl">
              Find businesses that actually need your services.
            </h1>
            <p className="mt-5 max-w-3xl text-[16px] leading-8 text-slate-300 md:text-lg">
              AI scans local businesses and reveals digital weaknesses you can sell solutions for, from outdated sites
              and weak SEO to missing booking systems, chatbots, and automation gaps.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={primaryHref}
                className="cta-primary glass-button rounded-full px-6 py-3.5 font-semibold transition"
              >
                {primaryLabel}
              </Link>
              <Link
                href={demoHref}
                className="glass-button rounded-full border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                {demoLabel}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Badge>Website redesign</Badge>
              <Badge>AI automation</Badge>
              <Badge>No website</Badge>
              <Badge>Weak SEO</Badge>
              <Badge>No booking</Badge>
            </div>
          </div>

          <div className="workspace-frame max-w-[560px] lg:justify-self-end">
            <div className="workspace-frame__header">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Live product preview</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Lead discovery console</h2>
                </div>
                <Badge tone="warning">Demo scan</Badge>
              </div>
            </div>
            <div className="workspace-frame__body pt-0">
              <SearchForm
                initialLocation="Vancouver"
                initialNiche="dentists"
                compact
                tier={viewer.subscription.tier}
                isAuthenticated={Boolean(viewer.user)}
              />
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="subtle-panel rounded-2xl p-4">
                  <p className="text-sm text-slate-300">Top opportunity</p>
                  <p className="mt-2 text-lg font-semibold text-white">No booking flow</p>
                  <p className="mt-2 text-sm text-slate-400">Most frequent weakness across this niche</p>
                </div>
                <div className="subtle-panel rounded-2xl p-4">
                  <p className="text-sm text-slate-300">Average lead score</p>
                  <div className="mt-2">
                    <ScorePill score={74} />
                  </div>
                </div>
                <div className="subtle-panel rounded-2xl p-4">
                  <p className="text-sm text-slate-300">Ready-made pitch</p>
                  <p className="mt-2 text-sm text-white">Website redesign + booking automation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell">
        <SectionHeading
          eyebrow="How It Works"
          title="Lead discovery built around speed, clarity, and action"
          description="From the first search to the final export, the workflow is optimized for fast outbound execution."
        />
        <div className="landing-card-grid mt-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="surface-primary rounded-[28px] p-6 md:p-7">
              <p className="text-sm text-cyan-300">0{index + 1}</p>
              <h2 className="mt-4 text-2xl font-semibold text-white">{step.title}</h2>
              <p className="mt-3 text-slate-300">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell">
        <div className="surface-primary grid-glow rounded-[32px] p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Product Preview"
              title="A sales intelligence workspace, not a generic scraper"
              description="LeadScout AI surfaces why a lead matters, what to pitch, and how to act on it without burying you in noise."
            />
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="subtle-panel rounded-[1.5rem] p-6">
              <div className="space-y-4">
                <div className="subtle-panel flex items-center justify-between rounded-2xl p-4">
                  <div>
                    <span className="font-medium text-white">Harbor Dental Studio</span>
                    <div className="mt-2 flex gap-2">
                      <IssueBadge issue="Outdated Website" />
                      <IssueBadge issue="No Booking System" />
                    </div>
                  </div>
                  <ScorePill score={86} />
                </div>
                <div className="subtle-panel flex items-center justify-between rounded-2xl p-4">
                  <div>
                    <span className="font-medium text-white">Atlas Construction</span>
                    <div className="mt-2 flex gap-2">
                      <IssueBadge issue="Weak SEO" />
                      <IssueBadge issue="Broken Links" />
                    </div>
                  </div>
                  <ScorePill score={68} />
                </div>
                <div className="subtle-panel flex items-center justify-between rounded-2xl p-4">
                  <div>
                    <span className="font-medium text-white">Vital Chiropractic</span>
                    <div className="mt-2 flex gap-2">
                      <IssueBadge issue="Poor mobile layout" />
                    </div>
                  </div>
                  <ScorePill score={41} />
                </div>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-sky-400/10 via-slate-950 to-amber-200/8 p-6">
              <div className="subtle-panel rounded-[1.25rem] p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Lead detail</p>
                <h3 className="mt-3 text-xl font-semibold text-white">Why this is a good lead</h3>
                <p className="mt-3 text-sm text-slate-300">
                  This clinic appears to rely on phone bookings only, which likely limits after-hours conversions and
                  creates a clean automation pitch.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="danger">No booking</Badge>
                  <Badge tone="warning">Weak SEO</Badge>
                </div>
                <div className="subtle-panel mt-5 rounded-2xl p-4">
                  <p className="text-sm font-medium text-white">Suggested service</p>
                  <p className="mt-2 text-sm text-slate-300">Website redesign + booking automation + AI follow-up</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell">
        <SectionHeading
          eyebrow="Features"
          title="Everything needed to discover, qualify, pitch, and export"
          description="Built for data-heavy prospecting without the clutter."
        />
        <div className="landing-card-grid mt-8 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <article key={feature.title} className="surface-primary rounded-[1.75rem] p-6 md:p-7">
                <div className="inline-flex rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-slate-300">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="shell" id="pricing">
        <SectionHeading
          eyebrow="Pricing"
          title="Start free, upgrade when the pipeline gets serious"
          description="A clear path from solo prospecting to agency-scale outbound operations."
        />
        <div className="landing-card-grid mt-8 md:grid-cols-2 xl:grid-cols-4">
          {pricing.map((plan) => (
            <article key={plan.name} className="surface-primary rounded-[2rem] p-6 md:p-7">
              <Badge tone={plan.name === "Starter" ? "success" : "default"}>{plan.badge}</Badge>
              <h3 className="mt-5 text-xl font-semibold text-white">{plan.name}</h3>
              <p className="mt-4 text-4xl font-semibold text-white">{plan.price}</p>
              <p className="mt-3 text-slate-300">{plan.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell">
        <div className="surface-primary rounded-[2rem] px-8 py-12 text-center">
          <div className="mx-auto inline-flex rounded-full border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-200">
            <TableProperties className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-3xl font-semibold text-white">Turn local business pain points into predictable pipeline.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            LeadScout AI gives consultants and agencies a premium operating layer for fast, clear, monetizable lead generation.
          </p>
          <Link
            href={primaryHref}
            className="cta-primary glass-button mt-8 inline-flex rounded-full px-6 py-3 font-semibold transition"
          >
            {primaryLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
