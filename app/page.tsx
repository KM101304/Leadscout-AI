import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { Badge, IssueBadge, SectionHeading, ScorePill } from "@/components/ui";
import { Bot, Download, SearchCheck, ShieldAlert, TableProperties } from "lucide-react";

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
  { name: "Pro", price: "$49", value: "Unlimited scans, exports, AI pitch generation", badge: "Best for solo operators" },
  { name: "Agency", price: "$149", value: "Team accounts, bulk exports, advanced scoring", badge: "Built for outbound teams" }
];

export default function HomePage() {
  return (
    <main>
      <section className="shell py-18 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Badge tone="success">Outbound prospecting for agencies, consultants, and AI operators</Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
              Find businesses that actually need your services.
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-slate-300">
              AI scans local businesses and reveals digital weaknesses you can sell solutions for, from outdated sites
              and weak SEO to missing booking systems, chatbots, and automation gaps.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="glass-button rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 px-6 py-3.5 font-semibold text-slate-950 transition hover:from-cyan-300 hover:to-sky-300"
              >
                Start scanning leads
              </Link>
              <Link
                href="/results?location=Vancouver&niche=dentists"
                className="glass-button rounded-full border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                See example results
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

          <div className="panel grid-glow rounded-[2rem] p-4 md:p-5">
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Live product preview</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Lead discovery console</h2>
                </div>
                <Badge tone="warning">Demo scan</Badge>
              </div>
              <SearchForm initialLocation="Vancouver" initialNiche="dentists" compact />
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-rose-400/15 bg-rose-400/8 p-4">
                  <p className="text-sm text-slate-300">Top opportunity</p>
                  <p className="mt-2 text-lg font-semibold text-white">No booking flow</p>
                  <p className="mt-2 text-sm text-slate-400">Most frequent weakness across this niche</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/8 p-4">
                  <p className="text-sm text-slate-300">Average lead score</p>
                  <div className="mt-2">
                    <ScorePill score={74} />
                  </div>
                </div>
                <div className="rounded-2xl border border-violet-400/15 bg-violet-400/8 p-4">
                  <p className="text-sm text-slate-300">Ready-made pitch</p>
                  <p className="mt-2 text-sm text-white">Website redesign + booking automation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <SectionHeading
          eyebrow="How It Works"
          title="Lead discovery built around speed, clarity, and action"
          description="From the first search to the final export, the workflow is optimized for fast outbound execution."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="panel rounded-[1.75rem] p-6">
              <p className="text-sm text-cyan-300">0{index + 1}</p>
              <h2 className="mt-4 text-2xl font-semibold text-white">{step.title}</h2>
              <p className="mt-3 text-slate-300">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell py-16">
        <div className="panel grid-glow rounded-[2rem] p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Product Preview"
              title="A sales intelligence workspace, not a generic scraper"
              description="LeadScout AI surfaces why a lead matters, what to pitch, and how to act on it without burying you in noise."
            />
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <span className="font-medium text-white">Harbor Dental Studio</span>
                    <div className="mt-2 flex gap-2">
                      <IssueBadge issue="Outdated Website" />
                      <IssueBadge issue="No Booking System" />
                    </div>
                  </div>
                  <ScorePill score={86} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <span className="font-medium text-white">Atlas Construction</span>
                    <div className="mt-2 flex gap-2">
                      <IssueBadge issue="Weak SEO" />
                      <IssueBadge issue="Broken Links" />
                    </div>
                  </div>
                  <ScorePill score={68} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
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
            <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-sky-400/10 via-slate-950 to-violet-400/12 p-6">
              <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/70 p-5">
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
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Suggested service</p>
                  <p className="mt-2 text-sm text-slate-300">Website redesign + booking automation + AI follow-up</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <SectionHeading
          eyebrow="Features"
          title="Everything needed to discover, qualify, pitch, and export"
          description="Built for data-heavy prospecting without the clutter."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <article key={feature.title} className="panel rounded-[1.75rem] p-6">
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

      <section className="shell py-16" id="pricing">
        <SectionHeading
          eyebrow="Pricing"
          title="Start free, upgrade when the pipeline gets serious"
          description="A clear path from solo prospecting to agency-scale outbound operations."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {pricing.map((plan) => (
            <article key={plan.name} className="panel rounded-[1.75rem] p-6">
              <Badge tone={plan.name === "Pro" ? "success" : "default"}>{plan.badge}</Badge>
              <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              <p className="mt-4 text-4xl font-semibold text-white">{plan.price}</p>
              <p className="mt-3 text-slate-300">{plan.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell py-20">
        <div className="panel rounded-[2rem] px-8 py-12 text-center">
          <div className="mx-auto inline-flex rounded-full border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-200">
            <TableProperties className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-3xl font-semibold text-white">Turn local business pain points into predictable pipeline.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            LeadScout AI gives consultants and agencies a premium operating layer for fast, clear, monetizable lead generation.
          </p>
          <Link
            href="/dashboard"
            className="glass-button mt-8 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 px-6 py-3 font-semibold text-slate-950 transition hover:from-cyan-300 hover:to-sky-300"
          >
            Start scanning leads
          </Link>
        </div>
      </section>
    </main>
  );
}
