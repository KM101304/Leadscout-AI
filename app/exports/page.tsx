import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { listExportHistory } from "@/services/indexedLeadRepository";

export default async function ExportsPage() {
  const viewer = await requireViewer();
  const exportRows = await listExportHistory(viewer.user!.id);

  return (
    <AppShell
      title="Export manager"
      subtitle="Prepare outreach-ready files and track export status."
      activeNav="exports"
    >
      <div className="app-page-stack xl:grid-cols-[320px_minmax(0,1fr)] xl:grid">
        <section className="surface-primary rounded-[28px] section-block">
          <p className="eyebrow">Export snapshot</p>
          <div className="mt-4 app-card-grid-tight">
            <div className="subtle-panel rounded-[18px] section-subtle">
              <p className="meta-text text-slate-400">Ready now</p>
              <p className="mt-2 text-2xl font-semibold text-white">{exportRows.filter((row) => row.status === "ready").length}</p>
            </div>
            <div className="subtle-panel rounded-[18px] section-subtle">
              <p className="meta-text text-slate-400">Queued exports</p>
              <p className="mt-2 text-2xl font-semibold text-white">{exportRows.filter((row) => row.status === "queued").length}</p>
            </div>
            <div className="subtle-panel rounded-[18px] section-subtle text-sm text-slate-300">
              Keep exports grouped by market so your outreach files stay easy to scan and re-run.
            </div>
          </div>
        </section>

        <div className="surface-primary rounded-[28px] section-block">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Outbound files</p>
              <h2 className="section-title mt-2 text-white">Prepared exports</h2>
            </div>
            <Badge tone="success">{exportRows.length} lists</Badge>
          </div>
          <div className="table-surface mt-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr className="border-b border-white/8">
                    <th className="px-3 py-3 font-medium">List</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Lead count</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exportRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-slate-400" colSpan={5}>
                        No exports recorded yet. Export a scan session to build a real history.
                      </td>
                    </tr>
                  ) : exportRows.map((row) => (
                    <tr key={row.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                      <td className="px-3 py-[18px] text-white">{row.name}</td>
                      <td className="px-3 py-[18px] text-slate-300">{row.exportType.toUpperCase()}</td>
                      <td className="px-3 py-[18px] text-slate-300">{row.leadCount}</td>
                      <td className="px-3 py-4">
                        <Badge tone={row.status === "ready" ? "success" : row.status === "queued" ? "warning" : "info"}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4">
                        <a
                          href={`/api/export?sessionId=${row.scanSessionId}`}
                          className="glass-button inline-flex rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[14px] text-white"
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
