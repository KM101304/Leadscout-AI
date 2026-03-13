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
      <div className="surface-primary rounded-[20px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            <label className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search within results"
                className="w-full rounded-[16px] border border-white/8 bg-slate-950/90 py-3 pl-11 pr-4 text-[14px] text-white outline-none"
              />
            </label>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="rounded-[16px] border border-white/8 bg-slate-950/90 px-4 py-3 text-[14px] text-white outline-none"
            >
              <option value="leadScore">Sort by score</option>
              <option value="businessName">Sort by name</option>
              <option value="reviewCount">Sort by reviews</option>
            </select>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-[16px] border border-white/8 bg-slate-950/90 px-4 py-3 text-[14px] text-white outline-none"
            >
              <option value="all">All issues</option>
              <option value="no-website">No website</option>
              <option value="no-booking">No booking</option>
              <option value="weak-seo">Weak SEO</option>
              <option value="slow-site">Slow site</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[14px] text-slate-400">{filteredLeads.length} matching leads</p>
            {selectedLeads.length > 0 ? (
              <ExportButton leads={selectedLeads} filename="leadscout-selected-leads.csv" />
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge>{selectedLeads.length} selected</Badge>
          <Badge tone="success">{filteredLeads.filter((lead) => lead.leadScore >= 80).length} high opportunity</Badge>
          <Badge tone="warning">{filteredLeads.filter((lead) => lead.issueTags.includes("weak-seo")).length} weak SEO</Badge>
        </div>

        <div className="mt-6 overflow-x-auto rounded-[16px] border border-white/6">
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

        {filteredLeads.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-white/10 px-6 py-12 text-center text-slate-400">
            No leads yet. Try widening the market or adjusting filters.
          </div>
        ) : null}
      </div>

      {selectedLead ? <LeadDetails lead={selectedLead} onClose={() => setSelectedLead(null)} /> : null}
    </>
  );
}
