"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { LeadDetails } from "@/components/LeadDetails";
import { LeadMap } from "@/components/LeadMap";
import { Badge, IssueBadge, ScorePill } from "@/components/ui";
import { Lead } from "@/lib/types";

type SortKey = "businessName" | "leadScore" | "reviewCount";
type ViewMode = "table" | "map";

export function LeadTable({ leads, sessionId }: { leads: Lead[]; sessionId: string }) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [focusedLeadId, setFocusedLeadId] = useState<string | null>(leads[0]?.id ?? null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(leads[0]?.id ?? null);
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
  const focusedLead = filteredLeads.find((lead) => lead.id === focusedLeadId) ?? filteredLeads[0] ?? null;

  const toggleLead = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <>
      <section className="results-workspace workspace-frame">
        <div className="workspace-frame__header">
          <div className="results-workspace__topbar">
            <div className="min-w-0">
              <p className="workspace-kicker">Results workspace</p>
              <h2 className="section-title mt-2.5 text-balance text-white md:mt-3">Review the lead list in a cleaner operating view</h2>
              <p className="mt-2.5 max-w-3xl text-[14px] leading-6 text-slate-300 md:mt-3 md:text-[15px] md:leading-7">
                Filter aggressively, hold onto context, and move from scan to outreach without the table fighting for space.
              </p>
            </div>
            <div className="results-workspace__actions">
              <p className="text-sm text-slate-400">{filteredLeads.length} matching leads</p>
              {selectedLeads.length > 0 ? (
                <ExportButton
                  sessionId={sessionId}
                  leadIds={selectedLeads.map((lead) => lead.id)}
                  filename="leadscout-selected-leads.csv"
                />
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
                  className="field-input rounded-[16px] border border-white/8 bg-slate-950/92 py-3 pl-11 pr-4 text-[14px] text-white"
                />
              </label>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="field-input rounded-[16px] border border-white/8 bg-slate-950/92 px-4 text-[14px] text-white"
              >
                <option value="leadScore">Sort by score</option>
                <option value="businessName">Sort by name</option>
                <option value="reviewCount">Sort by reviews</option>
              </select>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="field-input rounded-[16px] border border-white/8 bg-slate-950/92 px-4 text-[14px] text-white"
              >
                <option value="all">All issues</option>
                <option value="no-website">No website</option>
                <option value="no-booking">No booking</option>
                <option value="weak-seo">Weak SEO</option>
                <option value="slow-site">Slow site</option>
              </select>
            </div>
          </div>
        </div>

        <div className="workspace-frame__body pt-0">
          {viewMode === "map" ? (
            <LeadMap
              leads={filteredLeads}
              activeLeadId={focusedLead?.id}
              onSelectLead={(lead) => setFocusedLeadId(lead.id)}
              onViewLead={(lead) => setSelectedLead(lead)}
            />
          ) : (
            <>
              <div className="grid gap-4 md:hidden">
                {filteredLeads.map((lead) => (
                  <article key={lead.id} className="subtle-panel rounded-[20px] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="card-title text-white">{lead.businessName}</p>
                        <p className="mt-1.5 text-sm leading-6 text-slate-300">{lead.opportunityType}</p>
                      </div>
                      <ScorePill score={lead.leadScore} />
                    </div>
                    <div className="mt-3.5 grid gap-1 text-sm leading-6 text-slate-300">
                      <p>{lead.phone}</p>
                      <p className="break-words text-slate-400">{lead.website}</p>
                      <p className="text-slate-400">{lead.address}</p>
                      <p className="meta-text text-slate-500">
                        {lead.googleRating.toFixed(1)} stars · {lead.reviewCount} reviews
                      </p>
                    </div>
                    <div className="issue-chip-grid mt-3.5">
                      {lead.issueLabels.map((issue) => (
                        <IssueBadge key={issue} issue={issue} />
                      ))}
                    </div>
                    <div className="subtle-panel mt-3.5 rounded-[18px] p-3 text-sm leading-6 text-slate-300">
                      <p className="font-medium text-white">{lead.pitch.serviceSuggestion}</p>
                      <p className="mt-2">{lead.opportunityInsight}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
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
                        className="glass-button rounded-full border border-white/8 px-4 py-2 text-[13px] text-white transition hover:bg-white/[0.05]"
                      >
                        View lead
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="table-surface hidden md:block">
                <div className="table-frame">
                  <div className="results-table">
                    <div className="results-table__head">
                      <div />
                      <div>Business</div>
                      <div>Contact</div>
                      <div>Score and issues</div>
                      <div>Next best move</div>
                      <div>Actions</div>
                    </div>

                    <div className="results-table__body">
                      {filteredLeads.map((lead) => {
                        const isExpanded = expandedLeadId === lead.id;

                        return (
                          <article key={lead.id} className={`results-row ${focusedLeadId === lead.id ? "is-focused" : ""}`}>
                            <div className="results-row__summary">
                              <div className="results-row__cell">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(lead.id)}
                                  onChange={() => toggleLead(lead.id)}
                                  className="h-4 w-4 rounded border-white/15 bg-slate-950"
                                  aria-label={`Select ${lead.businessName}`}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setFocusedLeadId(lead.id);
                                  setExpandedLeadId((current) => (current === lead.id ? null : lead.id));
                                }}
                                className="results-row__cell results-row__business"
                              >
                                <div className="grid gap-1.5 text-left">
                                  <p className="card-title text-[15px] text-white">{lead.businessName}</p>
                                  <p className="text-[12px] text-slate-500">
                                    {lead.googleRating.toFixed(1)} stars · {lead.reviewCount} reviews
                                  </p>
                                  <p className="text-[12px] uppercase tracking-[0.12em] text-cyan-300/75">{lead.niche}</p>
                                </div>
                              </button>

                              <div className="results-row__cell">
                                <div className="grid gap-1.5 text-sm text-slate-300">
                                  <p className="text-slate-100">{lead.phone}</p>
                                  <p className="break-all text-slate-400">{lead.website}</p>
                                  <p className="text-slate-500">{lead.address}</p>
                                </div>
                              </div>

                              <div className="results-row__cell">
                                <div className="grid gap-3">
                                  <ScorePill score={lead.leadScore} />
                                  <div className="flex flex-wrap gap-2">
                                    {lead.issueLabels.slice(0, 2).map((issue) => (
                                      <IssueBadge key={issue} issue={issue} />
                                    ))}
                                    {lead.issueLabels.length > 2 ? <Badge>+{lead.issueLabels.length - 2} more</Badge> : null}
                                  </div>
                                </div>
                              </div>

                              <div className="results-row__cell">
                                <div className="grid gap-1.5">
                                  <p className="font-medium text-white">{lead.opportunityType}</p>
                                  <p className="results-row__summary-preview text-sm text-slate-300">{lead.pitch.serviceSuggestion}</p>
                                  <p className="results-row__summary-preview results-row__summary-preview--secondary text-[13px] text-slate-500">
                                    {lead.opportunityInsight}
                                  </p>
                                </div>
                              </div>

                              <div className="results-row__cell">
                                <div className="results-row__actions">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFocusedLeadId(lead.id);
                                      setExpandedLeadId((current) => (current === lead.id ? null : lead.id));
                                    }}
                                    className="glass-button inline-flex h-[42px] items-center justify-center gap-2 rounded-full border border-white/8 px-4 text-sm text-white transition hover:bg-white/[0.05]"
                                  >
                                    Details
                                    <ChevronDown className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFocusedLeadId(lead.id);
                                      setSelectedLead(lead);
                                    }}
                                    className="glass-button inline-flex h-[42px] items-center justify-center rounded-full border border-white/8 px-4 text-sm text-white transition hover:bg-white/[0.05]"
                                  >
                                    View lead
                                  </button>
                                </div>
                              </div>
                            </div>

                            {isExpanded ? (
                              <div className="results-row__details">
                                <div className="results-row__detail-card">
                                  <p className="meta-text text-slate-400">Business and contact</p>
                                  <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
                                    <p>{lead.phone}</p>
                                    <p className="break-all">{lead.website}</p>
                                    <p>{lead.address}</p>
                                    <p className="text-slate-500">{lead.location}</p>
                                  </div>
                                </div>

                                <div className="results-row__detail-card">
                                  <p className="meta-text text-slate-400">Opportunity and recommendation</p>
                                  <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
                                    <p className="font-medium text-white">{lead.opportunityType}</p>
                                    <p>{lead.opportunityInsight}</p>
                                    <p className="text-slate-100">{lead.pitch.serviceSuggestion}</p>
                                  </div>
                                </div>

                                <div className="results-row__detail-card">
                                  <p className="meta-text text-slate-400">Issue tags</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {lead.issueLabels.map((issue) => (
                                      <IssueBadge key={issue} issue={issue} />
                                    ))}
                                  </div>
                                </div>

                                <div className="results-row__detail-card">
                                  <p className="meta-text text-slate-400">Pitch preview</p>
                                  <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-300">
                                    <p>{lead.pitch.emailPitch}</p>
                                    <p className="text-slate-100">{lead.pitch.coldCallOpener}</p>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {filteredLeads.length === 0 ? (
            <div className="mt-6 rounded-[20px] border border-dashed border-white/10 px-6 py-12 text-center text-slate-400">
              No leads yet. Try widening the market or adjusting filters.
            </div>
          ) : null}
        </div>
      </section>

      {selectedLead ? <LeadDetails lead={selectedLead} sessionId={sessionId} onClose={() => setSelectedLead(null)} /> : null}
    </>
  );
}
