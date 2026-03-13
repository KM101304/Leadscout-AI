"use client";

import { useMemo, useState } from "react";
import { Lead } from "@/lib/types";
import { Badge, IssueBadge, ScorePill } from "@/components/ui";
import { LeadDetails } from "@/components/LeadDetails";
import { ExportButton } from "@/components/ExportButton";
import { Search } from "lucide-react";

type SortKey = "businessName" | "leadScore" | "reviewCount";

export function LeadTable({ leads }: { leads: Lead[] }) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("leadScore");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredLeads = useMemo(() => {
    const next = [...leads]
      .filter((lead) => (filter === "all" ? true : lead.issueTags.includes(filter as never)))
      .filter((lead) => {
        const haystack = `${lead.businessName} ${lead.address} ${lead.issueLabels.join(" ")} ${lead.opportunityType}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .sort((a, b) => {
        if (sortKey === "businessName") return a.businessName.localeCompare(b.businessName);
        return b[sortKey] - a[sortKey];
      });

    return next;
  }, [filter, leads, query, sortKey]);

  const selectedLeads = filteredLeads.filter((lead) => selectedIds.includes(lead.id));

  const toggleLead = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <>
      <div className="surface-primary rounded-[24px] p-5 md:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Results workspace</p>
              <h2 className="section-title mt-2 text-white">Rank, filter, and export without losing context</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[14px] text-slate-400">{filteredLeads.length} matching leads</p>
              {selectedLeads.length > 0 ? (
                <ExportButton leads={selectedLeads} filename="leadscout-selected-leads.csv" />
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_190px_220px]">
            <label className="relative min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search within results"
                className="field-input min-h-[52px] rounded-[18px] border border-white/8 bg-slate-950/90 py-3 pl-11 pr-4 text-[14px] text-white"
              />
            </label>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="field-input min-h-[52px] rounded-[18px] border border-white/8 bg-slate-950/90 px-4 text-[14px] text-white"
            >
              <option value="leadScore">Sort by score</option>
              <option value="businessName">Sort by name</option>
              <option value="reviewCount">Sort by reviews</option>
            </select>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="field-input min-h-[52px] rounded-[18px] border border-white/8 bg-slate-950/90 px-4 text-[14px] text-white"
            >
              <option value="all">All issues</option>
              <option value="no-website">No website</option>
              <option value="no-booking">No booking</option>
              <option value="weak-seo">Weak SEO</option>
              <option value="slow-site">Slow site</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge>{selectedLeads.length} selected</Badge>
          <Badge tone="success">{filteredLeads.filter((lead) => lead.leadScore >= 80).length} high opportunity</Badge>
          <Badge tone="warning">{filteredLeads.filter((lead) => lead.issueTags.includes("weak-seo")).length} weak SEO</Badge>
        </div>

        <div className="mt-8 grid gap-4 md:hidden">
          {filteredLeads.map((lead) => (
            <article key={lead.id} className="surface-secondary rounded-[20px] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="card-title truncate text-white">{lead.businessName}</p>
                  <p className="mt-1 text-[14px] text-slate-400">{lead.opportunityType}</p>
                </div>
                <ScorePill score={lead.leadScore} />
              </div>
              <div className="mt-3 grid gap-1 text-[14px] text-slate-300">
                <p>{lead.phone}</p>
                <p className="text-slate-400">{lead.address}</p>
                <p className="meta-text text-slate-500">{lead.googleRating.toFixed(1)} stars · {lead.reviewCount} reviews</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {lead.issueLabels.slice(0, 3).map((issue) => (
                  <IssueBadge key={issue} issue={issue} />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-[14px] text-slate-300">
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
                  className="glass-button rounded-full border border-white/8 px-4 py-2 text-[14px] text-white transition hover:bg-white/[0.05]"
                >
                  View lead
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 hidden overflow-hidden rounded-[20px] border border-white/6 md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.02] text-slate-400">
                <tr className="border-b border-white/8">
                  <th className="px-3 py-3 font-medium"></th>
                  <th className="px-3 py-3 font-medium">Business</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="px-3 py-3 font-medium">Website</th>
                  <th className="px-3 py-3 font-medium">Address</th>
                  <th className="px-3 py-3 font-medium">Lead score</th>
                  <th className="px-3 py-3 font-medium">Issue tags</th>
                  <th className="px-3 py-3 font-medium">Opportunity</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 text-slate-200 transition hover:bg-white/[0.04]">
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => toggleLead(lead.id)}
                        className="h-4 w-4 rounded border-white/15 bg-slate-950"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <div>
                        <p className="card-title text-white">{lead.businessName}</p>
                        <p className="meta-text mt-1 text-slate-500">
                          {lead.googleRating.toFixed(1)} stars · {lead.reviewCount} reviews
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-4">{lead.phone}</td>
                    <td className="px-3 py-4 text-slate-400">{lead.website}</td>
                    <td className="px-3 py-4 text-slate-400">{lead.address}</td>
                    <td className="px-3 py-4">
                      <ScorePill score={lead.leadScore} />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex max-w-xs flex-wrap gap-2">
                        {lead.issueLabels.slice(0, 3).map((issue) => (
                          <IssueBadge key={issue} issue={issue} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4">{lead.opportunityType}</td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedLead(lead)}
                        className="glass-button rounded-full border border-white/8 px-4 py-2 text-[14px] text-white transition hover:bg-white/[0.05]"
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

        {filteredLeads.length === 0 ? (
          <div className="mt-6 rounded-[20px] border border-dashed border-white/10 px-6 py-12 text-center text-slate-400">
            No leads yet. Try widening the market or adjusting filters.
          </div>
        ) : null}
      </div>

      {selectedLead ? <LeadDetails lead={selectedLead} onClose={() => setSelectedLead(null)} /> : null}
    </>
  );
}
