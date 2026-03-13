import Link from "next/link";
import { Badge } from "@/components/ui";
import { planDefinitions, PlanTier } from "@/lib/plans";

export function PlanStatus({
  tier,
  leadsUsed,
  leadsLimit
}: {
  tier: PlanTier;
  leadsUsed: number;
  leadsLimit: number;
}) {
  const plan = planDefinitions.find((entry) => entry.tier === tier)!;
  const usagePct = Math.min(100, Math.round((leadsUsed / Math.max(leadsLimit, 1)) * 100));

  return (
    <div className="rounded-[20px] border border-cyan-400/12 bg-cyan-400/8 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Plan status</p>
          <p className="mt-2 card-title text-white">{plan.name}</p>
        </div>
        <Badge tone={tier === "free" ? "warning" : "success"}>{plan.monthlyLeadLimit}</Badge>
      </div>
      <p className="mt-3 text-[14px] text-slate-300">{plan.headline}</p>
      <div className="mt-4 h-2 rounded-full bg-white/8">
        <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400" style={{ width: `${usagePct}%` }} />
      </div>
      <p className="mt-3 text-[14px] text-slate-300">
        {leadsUsed} of {leadsLimit} included leads used this month
      </p>
      {tier === "free" ? (
        <Link
          href="/pricing"
          className="glass-button mt-4 inline-flex rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[14px] font-medium text-white"
        >
          Upgrade for unlimited workflow
        </Link>
      ) : null}
    </div>
  );
}
