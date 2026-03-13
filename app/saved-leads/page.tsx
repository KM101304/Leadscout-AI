import { AppShell } from "@/components/AppShell";
import { LeadCard } from "@/components/LeadCard";
import { Badge } from "@/components/ui";
import { runLeadScan } from "@/services/scanningService";

export default async function SavedLeadsPage() {
  const result = await runLeadScan({
    location: "Toronto",
    niche: "chiropractors",
    minimumReviewCount: 10
  });

  const saved = result.leads.slice(0, 4);

  return (
    <AppShell
      title="Saved leads"
      subtitle="Keep promising opportunities close."
      activeNav="saved-leads"
    >
      {saved.length > 0 ? (
        <div className="grid gap-6">
          <div className="flex flex-wrap gap-3">
            <Badge>{saved.length} saved</Badge>
            <Badge tone="success">{saved.filter((lead) => lead.leadScore >= 80).length} high opportunity</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {saved.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      ) : (
        <div className="surface-primary rounded-[20px] px-6 py-16 text-center text-slate-400">
          No saved leads yet. Start a search to discover opportunities worth tracking.
        </div>
      )}
    </AppShell>
  );
}
