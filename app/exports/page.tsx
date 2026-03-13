import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui";

const exportRows = [
  { name: "Seattle contractors", type: "CSV", count: 28, status: "Ready" },
  { name: "Vancouver dentists", type: "CSV", count: 16, status: "Ready" },
  { name: "Toronto chiropractors", type: "CSV", count: 11, status: "Queued" }
];

export default function ExportsPage() {
  return (
    <AppShell
      title="Export manager"
      subtitle="Prepare outreach-ready files and track export status."
      activeNav="exports"
    >
      <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="surface-primary rounded-[24px] p-6">
          <p className="eyebrow">Export snapshot</p>
          <div className="mt-4 grid gap-4">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <p className="meta-text text-slate-400">Ready now</p>
              <p className="mt-2 text-2xl font-semibold text-white">{exportRows.filter((row) => row.status === "Ready").length}</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <p className="meta-text text-slate-400">Queued exports</p>
              <p className="mt-2 text-2xl font-semibold text-white">{exportRows.filter((row) => row.status === "Queued").length}</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
              Keep exports grouped by market so your outreach files stay easy to scan and re-run.
            </div>
          </div>
        </section>

        <div className="surface-primary rounded-[24px] p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Outbound files</p>
              <h2 className="section-title mt-2 text-white">Prepared exports</h2>
            </div>
            <Badge tone="success">{exportRows.length} lists</Badge>
          </div>
          <div className="mt-6 overflow-hidden rounded-[20px] border border-white/6">
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
                  {exportRows.map((row) => (
                    <tr key={row.name} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                      <td className="px-3 py-[18px] text-white">{row.name}</td>
                      <td className="px-3 py-[18px] text-slate-300">{row.type}</td>
                      <td className="px-3 py-[18px] text-slate-300">{row.count}</td>
                      <td className="px-3 py-4">
                        <Badge tone={row.status === "Ready" ? "success" : row.status === "Queued" ? "warning" : "info"}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4">
                        <button className="glass-button rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[14px] text-white">
                          Download
                        </button>
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
