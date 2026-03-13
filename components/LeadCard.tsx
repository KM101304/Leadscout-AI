import { Lead } from "@/lib/types";
import { IssueBadge, ScorePill } from "@/components/ui";

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <article className="surface-secondary glass-button rounded-[20px] p-4 md:p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <h3 className="card-title text-white">{lead.businessName}</h3>
          <p className="mt-2 line-clamp-2 text-[14px] text-slate-400">{lead.opportunityType}</p>
        </div>
        <ScorePill score={lead.leadScore} />
      </div>
      <div className="mt-4 rounded-[18px] border border-white/6 bg-slate-950/35 p-3.5 md:mt-5 md:p-4">
        <div className="grid gap-1 text-[14px] text-slate-300">
          <p>{lead.phone}</p>
          <p className="line-clamp-2">{lead.address}</p>
        </div>
      </div>
      <div className="issue-chip-grid mt-4 md:mt-5">
        {lead.issueLabels.slice(0, 2).map((issue) => (
          <IssueBadge key={issue} issue={issue} />
        ))}
      </div>
    </article>
  );
}
