"use client";

import { Lead } from "@/lib/types";
import { Badge, IssueBadge, ScorePill } from "@/components/ui";
import { CircleAlert, PhoneCall, Star, StickyNote, WandSparkles, X } from "lucide-react";
import { useState } from "react";

const statuses = [
  { key: "called", label: "Called" },
  { key: "follow-up", label: "Follow up" },
  { key: "not-interested", label: "Not interested" },
  { key: "meeting-booked", label: "Meeting booked" }
] as const;

export function LeadDetails({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes);

  return (
    <aside className="slide-in-panel fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 p-3 backdrop-blur-xl md:inset-y-0 md:left-auto md:right-0 md:max-w-2xl md:p-6">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto rounded-[24px] border border-white/8 bg-slate-950/95 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Lead detail</p>
          <h2 className="section-title mt-2 text-white">{lead.businessName}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <ScorePill score={lead.leadScore} />
            <Badge>{lead.opportunityType}</Badge>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 app-card-grid md:mt-8">
        <section className="surface-secondary rounded-[16px] section-block">
          <h3 className="card-title text-white">Business overview</h3>
          <div className="mt-4 grid gap-4 text-[14px] text-slate-300 md:grid-cols-2">
            <p>{lead.phone}</p>
            <p>{lead.website}</p>
            <p>{lead.address}</p>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-300" />
              {lead.googleRating.toFixed(1)} rating · {lead.reviewCount} reviews
            </div>
          </div>
        </section>

        <section className="surface-secondary rounded-[16px] section-block">
          <h3 className="card-title flex items-center gap-2 text-white">
            <CircleAlert className="h-5 w-5 text-amber-300" />
            Detected digital issues
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {lead.issueLabels.map((issue) => (
              <IssueBadge key={issue} issue={issue} />
            ))}
          </div>
          <p className="mt-4 text-[14px] text-slate-300">{lead.opportunityInsight}</p>
        </section>

        <section className="surface-secondary rounded-[16px] section-block">
          <h3 className="card-title flex items-center gap-2 text-white">
            <WandSparkles className="h-5 w-5 text-cyan-300" />
            AI pitch assistant
          </h3>
          <div className="mt-4 space-y-4 text-[14px] text-slate-300">
            <p>
              <span className="inline-flex items-center gap-2 font-medium text-white"><PhoneCall className="h-4 w-4 text-cyan-300" />Cold call:</span>{" "}
              {lead.pitch.coldCallOpener}
            </p>
            <p>
              <span className="font-medium text-white">Email:</span> {lead.pitch.emailPitch}
            </p>
            <p>
              <span className="font-medium text-white">Recommendation:</span> {lead.pitch.serviceSuggestion}
            </p>
          </div>
        </section>

        <section className="surface-secondary rounded-[16px] section-block">
          <h3 className="card-title text-white">Status tracker</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {statuses.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setStatus(option.key)}
                className={`rounded-full border px-4 py-2 text-[14px] transition ${
                  status === option.key
                    ? "border-cyan-400/18 bg-cyan-400/10 text-cyan-100"
                    : "border-white/8 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="surface-secondary rounded-[16px] section-block">
          <h3 className="card-title flex items-center gap-2 text-white">
            <StickyNote className="h-5 w-5 text-violet-300" />
            Notes
          </h3>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add custom objections, talking points, or next steps..."
            className="mt-4 min-h-32 w-full rounded-[16px] border border-white/8 bg-slate-950/80 p-4 text-[14px] text-white"
          />
        </section>
      </div>
      </div>
    </aside>
  );
}
