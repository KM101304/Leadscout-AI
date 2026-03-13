"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { LeadDetails } from "@/components/LeadDetails";
import { LeadMap } from "@/components/LeadMap";
import { Badge, IssueBadge, ScorePill } from "@/components/ui";
import { Lead } from "@/lib/types";

type SortKey = "businessName" | "leadScore" | "reviewCount";
type ViewMode = "table" | "map";

export function LeadTable({ leads }: { leads: Lead[] }) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("leadScore");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const filteredLeads = useMemo(() => {
    return [...leads]
      .filter((lead) => (filter === "all" ? true : lead.issueTags.includes(filter as never)))
      .filter((lead) => {
        const haystack = `${lead.businessName} ${lead.address} ${lead.issueLabels.join(" ")} ${lead.opportunityType}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .sort((a, b) => {
        if (sortKey === "businessName") {
          return a.businessName.localeCompare(b.businessName);
        }

        return b[sortKey] - a[sortKey];
      });
  }, [filter, leads, query, sortKey]);

  const selectedLeads = filteredLeads.filter((lead) => selectedIds.includes(lead.id));
  const highOpportunityCount = filteredLeads.filter((lead) => lead.leadScore >= 80).length;
  const weakSeoCount = filteredLeads.filter((lead) => lead.issueTags.includes("weak-seo")).length;

  const toggleLead = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <>
      <section className="results-workspace">
        <div className="results-workspace__topbar">
          <div className="min-w-0">
            <p className="eyebrow">Results workspace</p>
            <h2 className="section-title mt-3 text-balance text-white">Lead table first, insights second, clutter removed</h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
              Review the scored scan, tighten the list, and switch between the table and geographic map without losing
              selection state.
            </p>
          </div>
          <div className="results-workspace__actions">
            <p className="text-sm text-slate-400">{filteredLeads.length} matching leads</p>
            {selectedLeads.length > 0 ? (
              <ExportButton leads={selectedLeads} filename="leadscout-selected-leads.csv" />
            ) : null}
          </div>
        </div>

        <div className="results-workspace__stats">
          <Badge>{selectedLeads.length} selected</Badge>
          <Badge tone="success">{highOpportunityCount} high opportunity</Badge>
          <Badge tone="warning">{weakSeoCount} weak SEO</Badge>
        </div>

        <div className="results-workspace__controls">
          <div className="results-workspace__view-toggle">
            {(["table", "map"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={viewMode === mode ? "is-active" : ""}
              >
                {mode === "table" ? "Table view" : "Map view"}
              </button>
            ))}
          </div>

          <div className="results-workspace__filters">
            <label className="relative min-w-0 xl:col-span-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by business, address, issue, or opportunity"
                className="field-input min-h-[54px] rounded-[18px] border border-white/8 bg-slate-950/92 py-3 pl-11 pr-4 text-[14px] text-white"
              />
            </label>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="field-input min-h-[54px] rounded-[18px] border border-white/8 bg-slate-950/92 px-4 text-[14px] text-white"
            >
              <option value="leadScore">Sort by score</option>
              <option value="businessName">Sort by name</option>
              <option value="reviewCount">Sort by reviews</option>
            </select>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="field-input min-h-[54px] rounded-[18px] border border-white/8 bg-slate-950/92 px-4 text-[14px] text-white"
            >
              <option value="all">All issues</option>
              <option value="no-website">No website</option>
              <option value="no-booking">No booking</option>
              <option value="weak-seo">Weak SEO</option>
              <option value="slow-site">Slow site</option>
            </select>
          </div>
        </div>

        {viewMode === "map" ? (
          <LeadMap
            leads={filteredLeads}
            activeLeadId={selectedLead?.id}
            onSelectLead={(lead) => setSelectedLead(lead)}
          />
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:hidden">
              {filteredLeads.map((lead) => (
                <article key={lead.id} className="surface-primary rounded-[22px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="card-title text-white">{lead.businessName}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{lead.opportunityType}</p>
                    </div>
                    <ScorePill score={lead.leadScore} />
                  </div>
                  <div className="mt-4 grid gap-1 text-sm leading-6 text-slate-300">
                    <p>{lead.phone}</p>
                    <p className="text-slate-400">{lead.address}</p>
                    <p className="meta-text text-slate-500">
                      {lead.googleRating.toFixed(1)} stars · {lead.reviewCount} reviews
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {lead.issueLabels.slice(0, 3).map((issue) => (
                      <IssueBadge key={issue} issue={issue} />
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => toggleLead(lead.id)}
                        className="h-4 w-4 rounded border-white/15 bg-slate-950"
                      />
                      Select
                    </label>
                    <button
                      type="button"
                      onClick={() => setSelectedLead(lead)}
                      className="glass-button rounded-full border border-white/8 px-4 py-2 text-sm text-white transition hover:bg-white/[0.05]"
                    >
                      View lead
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="results-table-shell mt-8 hidden md:block">
              <div className="overflow-x-auto">
                <table className="results-table min-w-full text-left text-sm">
                  <colgroup>
                    <col style={{ width: "44px" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "110px" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th />
                      <th>Business</th>
                      <th>Phone</th>
                      <th>Website</th>
                      <th>Address</th>
                      <th>Lead score</th>
                      <th>Issue tags</th>
                      <th>Opportunity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(lead.id)}
                            onChange={() => toggleLead(lead.id)}
                            className="h-4 w-4 rounded border-white/15 bg-slate-950"
                          />
                        </td>
                        <td>
                          <div className="grid gap-1.5">
                            <p className="card-title text-[15px] text-white">{lead.businessName}</p>
                            <p className="text-[12px] text-slate-500">
                              {lead.googleRating.toFixed(1)} stars · {lead.reviewCount} reviews
                            </p>
                          </div>
                        </td>
                        <td className="text-slate-200">{lead.phone}</td>
                        <td className="break-words text-slate-400">{lead.website}</td>
                        <td className="text-slate-400">{lead.address}</td>
                        <td>
                          <ScorePill score={lead.leadScore} />
                        </td>
                        <td>
                          <div className="flex max-w-[240px] flex-wrap gap-2">
                            {lead.issueLabels.slice(0, 3).map((issue) => (
                              <IssueBadge key={issue} issue={issue} />
                            ))}
                          </div>
                        </td>
                        <td className="text-slate-200">{lead.opportunityType}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="glass-button rounded-full border border-white/8 px-4 py-2 text-sm text-white transition hover:bg-white/[0.05]"
                          >
                            View lead
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {filteredLeads.length === 0 ? (
          <div className="mt-6 rounded-[20px] border border-dashed border-white/10 px-6 py-12 text-center text-slate-400">
            No leads yet. Try widening the market or adjusting filters.
          </div>
        ) : null}
      </section>

      {selectedLead ? <LeadDetails lead={selectedLead} onClose={() => setSelectedLead(null)} /> : null}
    </>
  );
}
