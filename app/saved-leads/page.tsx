import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { LeadCard } from "@/components/LeadCard";
import { requireViewer } from "@/lib/auth";
import { listSavedLeads } from "@/services/indexedLeadRepository";

export default async function SavedLeadsPage() {
  const viewer = await requireViewer();
  const savedLeads = await listSavedLeads(viewer.user!.id);

  return (
    <AppShell title="Saved leads" subtitle="Keep promising opportunities close." activeNav="saved-leads">
      {savedLeads.length === 0 ? (
        <div className="empty-state text-slate-400">
          <p className="text-base text-white">No saved leads yet.</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Run a scan from the dashboard and save the leads you want to revisit later.
          </p>
          <Link
            href="/dashboard"
            className="glass-button mt-6 inline-flex h-[46px] items-center justify-center rounded-full border border-white/8 px-5 text-sm font-semibold text-white"
          >
            Start a scan
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {savedLeads.map((saved) => (
            <div key={saved.id} className="grid gap-3">
              <LeadCard lead={saved.lead} />
              <div className="subtle-panel rounded-[18px] p-4 text-sm text-slate-300">
                <p className="font-medium text-white">Saved status: {saved.status}</p>
                <p className="mt-2">{saved.notes || "No notes added yet."}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
