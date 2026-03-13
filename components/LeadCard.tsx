import { Lead } from "@/lib/types";
import { IssueBadge, ScorePill } from "@/components/ui";

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <div className="surface-secondary glass-button rounded-[16px] p-6 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="card-title text-white">{lead.businessName}</h3>
          <p className="mt-2 text-[14px] text-slate-400">{lead.opportunityType}</p>
        </div>
        <ScorePill score={lead.leadScore} />
      </div>
      <div className="mt-4 grid gap-1 text-[14px] text-slate-300">
        <p>{lead.phone}</p>
        <p>{lead.address}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {lead.issueLabels.slice(0, 2).map((issue) => (
          <IssueBadge key={issue} issue={issue} />
        ))}
      </div>
    </div>
  );
}
