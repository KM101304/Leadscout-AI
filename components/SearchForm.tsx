"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";

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
    setIsLoading(true);
    const params = new URLSearchParams({
      location,
      niche,
      radius,
      minimumReviewCount,
      websiteStatus,
      businessSize
    });
    router.push(`/results?${params.toString()}`);
  };

  return (
    <form onSubmit={onSubmit} className={`surface-primary rounded-[20px] ${compact ? "p-4" : "p-6"}`}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="meta-text uppercase tracking-[0.32em] text-cyan-300/80">Search intelligence</p>
          <h2 className="section-title mt-2 text-white">Build a local lead list</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/12 bg-violet-400/8 px-3 py-1.5 text-[12px] text-violet-100">
          <Sparkles className="h-3.5 w-3.5" />
          AI scoring + live data fallback
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2">
          <span className="meta-text text-slate-300">Location</span>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Vancouver"
            required
            className="w-full rounded-[16px] border border-white/8 bg-slate-950/70 px-4 py-3 text-[14px] text-white outline-none ring-0 placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-2">
          <span className="meta-text text-slate-300">Niche</span>
          <input
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            placeholder="dentists"
            required
            className="w-full rounded-[16px] border border-white/8 bg-slate-950/70 px-4 py-3 text-[14px] text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-2">
          <span className="meta-text text-slate-300">Radius</span>
          <input
            value={radius}
            onChange={(event) => setRadius(event.target.value)}
            type="number"
            min="1"
            className="w-full rounded-[16px] border border-white/8 bg-slate-950/70 px-4 py-3 text-[14px] text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-2">
          <span className="meta-text text-slate-300">Minimum reviews</span>
          <input
            value={minimumReviewCount}
            onChange={(event) => setMinimumReviewCount(event.target.value)}
            type="number"
            min="0"
            className="w-full rounded-[16px] border border-white/8 bg-slate-950/70 px-4 py-3 text-[14px] text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-2">
          <span className="meta-text text-slate-300">Website status</span>
          <select
            value={websiteStatus}
            onChange={(event) => setWebsiteStatus(event.target.value)}
            className="w-full rounded-[16px] border border-white/8 bg-slate-950/70 px-4 py-3 text-[14px] text-white outline-none"
          >
            <option value="any">Any</option>
            <option value="has-website">Website required</option>
            <option value="no-website">No website only</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="meta-text text-slate-300">Business size estimate</span>
          <select
            value={businessSize}
            onChange={(event) => setBusinessSize(event.target.value)}
            className="w-full rounded-[16px] border border-white/8 bg-slate-950/70 px-4 py-3 text-[14px] text-white outline-none"
          >
            <option value="any">Any</option>
            <option value="solo">Solo / micro</option>
            <option value="small-team">Small team</option>
            <option value="multi-location">Multi-location</option>
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="surface-minimal rounded-[16px] px-4 py-4 text-[14px] text-slate-300">
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
          className="glass-button inline-flex h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 px-7 font-semibold text-slate-950 transition hover:from-cyan-300 hover:to-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Search className="h-4 w-4" />
          {isLoading ? "Scanning businesses..." : "Scan businesses"}
        </button>
      </div>
    </form>
  );
}
