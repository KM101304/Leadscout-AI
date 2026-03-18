import Link from "next/link";
import { featureMatrix, planDefinitions, PlanTier } from "@/lib/plans";
import { Badge } from "@/components/ui";
import { Check, LockKeyhole, Sparkles, Users } from "lucide-react";
import { BillingActionButton } from "@/components/BillingActionButton";

export function PricingExperience({ currentTier }: { currentTier: PlanTier }) {
  return (
    <div className="grid gap-8 md:gap-10">
      <div className="landing-card-grid xl:grid-cols-3">
        {planDefinitions.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const isFeatured = plan.tier === "starter";

          return (
            <article
              key={plan.tier}
              className={`surface-primary rounded-[2rem] p-6 md:p-7 ${isFeatured ? "ring-1 ring-cyan-400/30" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <Badge tone={isCurrent ? "success" : isFeatured ? "warning" : "default"}>
                  {isCurrent ? "Current plan" : plan.bestFor}
                </Badge>
                {plan.tier === "agency" ? <Users className="h-5 w-5 text-violet-300" /> : <Sparkles className="h-5 w-5 text-cyan-300" />}
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">{plan.name}</h2>
              <p className="mt-3 text-5xl font-semibold text-white">{plan.price}</p>
              <p className="mt-4 text-slate-300">{plan.summary}</p>
              <p className="subtle-panel mt-4 rounded-[20px] p-4 text-sm text-slate-200">{plan.headline}</p>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">What you feel</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 text-cyan-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Unlocks</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  {plan.unlocks.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {isCurrent ? (
                <div className="glass-button mt-8 inline-flex w-full justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white">
                  You are here
                </div>
              ) : plan.tier === "free" ? (
                <Link
                  href="/dashboard"
                  className="glass-button mt-8 inline-flex w-full justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white"
                >
                  Return to free
                </Link>
              ) : (
                <BillingActionButton
                  action="checkout"
                  planTier={plan.tier}
                  label={plan.cta}
                  className={`glass-button mt-8 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold ${
                    isFeatured
                      ? "bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950"
                      : "border border-white/10 bg-white/[0.04] text-white"
                  }`}
                />
              )}
            </article>
          );
        })}
      </div>

      <div className="surface-primary rounded-[2rem] p-6 md:p-7">
        <div className="flex items-center gap-3">
          <LockKeyhole className="h-5 w-5 text-cyan-300" />
          <h3 className="font-heading text-xl font-semibold text-white">Feature comparison</h3>
        </div>
        <div className="table-surface mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr className="border-b border-white/10">
                <th className="px-3 py-3 font-medium">Capability</th>
                <th className="px-3 py-3 font-medium">Free</th>
                <th className="px-3 py-3 font-medium">Starter</th>
                <th className="px-3 py-3 font-medium">Pro</th>
                <th className="px-3 py-3 font-medium">Agency</th>
              </tr>
            </thead>
            <tbody>
              {featureMatrix.map((row) => (
                <tr key={row.name} className="border-b border-white/5">
                  <td className="px-3 py-4 text-white">{row.name}</td>
                  <td className="px-3 py-4 text-slate-300">{row.free}</td>
                  <td className="px-3 py-4 text-slate-200">{row.starter}</td>
                  <td className="px-3 py-4 text-slate-200">{row.pro}</td>
                  <td className="px-3 py-4 text-slate-200">{row.agency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
