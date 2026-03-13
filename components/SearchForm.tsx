"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPinned, Search, SlidersHorizontal, Sparkles } from "lucide-react";

export function SearchForm({
  initialLocation = "",
  initialNiche = "",
  compact = false
}: {
  initialLocation?: string;
  initialNiche?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [niche, setNiche] = useState(initialNiche);
  const [radius, setRadius] = useState("25");
  const [minimumReviewCount, setMinimumReviewCount] = useState("0");
  const [websiteStatus, setWebsiteStatus] = useState("any");
  const [businessSize, setBusinessSize] = useState("any");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!location.trim() || !niche.trim()) {
      return;
    }
    setIsLoading(true);
    const params = new URLSearchParams({
      location: location.trim(),
      niche: niche.trim(),
      radius,
      minimumReviewCount,
      websiteStatus,
      businessSize
    });
    router.push(`/results?${params.toString()}`);
  };

  return (
    <form onSubmit={onSubmit} className={`surface-primary rounded-[24px] ${compact ? "p-4" : "p-5 md:p-7"}`}>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="eyebrow">Search intelligence</p>
          <h2 className="section-title mt-2 text-white">Build a local lead list</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Choose the market, tighten the filters, and send the workspace straight into a scored results view.
          </p>
        </div>
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1.5 text-[12px] font-medium text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" />
          AI scoring + live data fallback
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2">
          <span className="field-label">Location</span>
          <div className="field-shell">
            <MapPinned className="h-4 w-4 text-slate-500" />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Vancouver"
              required
              className="field-input field-input-plain"
            />
          </div>
        </label>
        <label className="space-y-2">
          <span className="field-label">Niche</span>
          <div className="field-shell">
            <Building2 className="h-4 w-4 text-slate-500" />
            <input
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
              placeholder="dentists"
              required
              className="field-input field-input-plain"
            />
          </div>
        </label>
        <label className="space-y-2">
          <span className="field-label">Radius</span>
          <div className="field-shell">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <input
              value={radius}
              onChange={(event) => setRadius(event.target.value)}
              type="number"
              min="1"
              className="field-input field-input-plain"
            />
          </div>
        </label>
        <label className="space-y-2">
          <span className="field-label">Minimum reviews</span>
          <div className="field-shell">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <input
              value={minimumReviewCount}
              onChange={(event) => setMinimumReviewCount(event.target.value)}
              type="number"
              min="0"
              className="field-input field-input-plain"
            />
          </div>
        </label>
        <label className="space-y-2">
          <span className="field-label">Website status</span>
          <div className="field-shell">
            <select value={websiteStatus} onChange={(event) => setWebsiteStatus(event.target.value)} className="field-input">
              <option value="any">Any</option>
              <option value="has-website">Website required</option>
              <option value="no-website">No website only</option>
            </select>
          </div>
        </label>
        <label className="space-y-2">
          <span className="field-label">Business size estimate</span>
          <div className="field-shell">
            <select value={businessSize} onChange={(event) => setBusinessSize(event.target.value)} className="field-input">
              <option value="any">Any</option>
              <option value="solo">Solo / micro</option>
              <option value="small-team">Small team</option>
              <option value="multi-location">Multi-location</option>
            </select>
          </div>
        </label>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="surface-minimal rounded-[20px] border border-white/6 px-4 py-4 text-[14px] text-slate-300">
          <div className="flex flex-wrap gap-3">
            <span>Generate in under 10 seconds</span>
            <span className="text-slate-500">•</span>
            <span>Score instantly</span>
            <span className="text-slate-500">•</span>
            <span>Prepare outreach fast</span>
          </div>
          {isLoading ? (
            <div className="progress-shine mt-4 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400" />
          ) : null}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="cta-primary glass-button inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full px-7 font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 lg:w-auto"
        >
          <Search className="h-4 w-4" />
          {isLoading ? "Scanning businesses..." : "Scan businesses"}
        </button>
      </div>
    </form>
  );
}
