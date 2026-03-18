"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPinned, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { PlanTier } from "@/lib/plans";

export function SearchForm({
  initialLocation = "",
  initialNiche = "",
  compact = false,
  tier = "free",
  isAuthenticated = true
}: {
  initialLocation?: string;
  initialNiche?: string;
  compact?: boolean;
  tier?: PlanTier;
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [niche, setNiche] = useState(initialNiche);
  const [radius, setRadius] = useState("25");
  const [minimumReviewCount, setMinimumReviewCount] = useState("0");
  const [websiteStatus, setWebsiteStatus] = useState("any");
  const [businessSize, setBusinessSize] = useState("any");
  const [mode, setMode] = useState<"auto" | "indexed" | "live">(tier === "free" ? "indexed" : "auto");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const sourceOptions =
    tier === "free"
      ? [{ value: "indexed", label: "Indexed results" }]
      : [
          { value: "auto", label: "Auto: cache first" },
          { value: "indexed", label: "Indexed only" },
          { value: "live", label: "Live refresh" }
        ];

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!location.trim() || !niche.trim()) {
      return;
    }

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/dashboard")}`);
      return;
    }

    setIsLoading(true);
    setError("");

    const params = new URLSearchParams({
      location: location.trim(),
      niche: niche.trim(),
      radius,
      minimumReviewCount,
      websiteStatus,
      businessSize,
      mode: tier === "free" ? "indexed" : mode
    });

    try {
      const response = await fetch(`/api/search?${params.toString()}`, { cache: "no-store" });
      const raw = await response.text();
      let payload: { id?: string; error?: string } = {};

      if (raw) {
        try {
          payload = JSON.parse(raw) as { id?: string; error?: string };
        } catch {
          payload = {};
        }
      }

      if (!response.ok || !payload.id) {
        const fallbackMessage =
          !response.ok && raw && !raw.trim().startsWith("<") ? raw.trim() : "Unable to create a scan session.";
        throw new Error(normalizeScanError(payload.error || fallbackMessage));
      }

      router.push(`/results?sessionId=${encodeURIComponent(payload.id)}`);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to create a scan session.";
      setError(normalizeScanError(message));
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className={compact ? "grid gap-5" : "workspace-frame"}>
      <div className={compact ? "grid gap-3" : "workspace-frame__header"}>
        <div>
          <p className="workspace-kicker">Search intelligence</p>
          <h2 className="section-title mt-2 text-white">Build a local lead list</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-300">
            Choose the market, tighten the filters, and send the workspace straight into a scored results view.
          </p>
        </div>
        <div className="inline-flex max-w-full items-center gap-2 self-start rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1.5 text-[12px] font-medium text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" />
          {tier === "free" ? "Indexed search only" : "Indexed cache + premium live scans"}
        </div>
      </div>

      <div className={compact ? "grid gap-6" : "workspace-frame__body"}>
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
          <label className="space-y-2">
            <span className="field-label">Scan source</span>
            <div className="field-shell">
              <select
                value={tier === "free" ? "indexed" : mode}
                onChange={(event) => setMode(event.target.value as "auto" | "indexed" | "live")}
                className="field-input field-input-select"
                disabled={tier === "free"}
                title={tier === "free" ? "Indexed results" : undefined}
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <div className="mt-6 grid gap-3.5 md:gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="surface-minimal rounded-[20px] px-4 py-3.5 text-[13px] leading-6 text-slate-300 md:px-4 md:py-4 md:text-[14px]">
            <div className="flex flex-wrap gap-3">
              <span>{tier === "free" ? "Fast indexed lookup" : "Cache-first scan routing"}</span>
              <span className="text-slate-500">•</span>
              <span>Score consistently</span>
              <span className="text-slate-500">•</span>
              <span>{tier === "free" ? "No automatic API cost" : "Only refresh live when needed"}</span>
            </div>
            {isLoading ? (
              <div className="progress-shine mt-4 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400" />
            ) : null}
            {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="cta-primary glass-button inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 md:h-[52px] md:text-base lg:w-auto"
          >
            <Search className="h-4 w-4" />
            {isLoading ? "Building scan session..." : isAuthenticated ? (tier === "free" ? "Search indexed leads" : "Run scan") : "Login to run a scan"}
          </button>
        </div>
      </div>
    </form>
  );
}

function normalizeScanError(message: string) {
  const normalized = message.trim();
  const lower = normalized.toLowerCase();

  if (!normalized) {
    return "We couldn't build the scan session right now. Please try again in a moment.";
  }

  if (
    lower === "the scan request failed." ||
    lower.includes("unexpected token") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror")
  ) {
    return "We couldn't build the scan session right now. Please try the same search again in a moment.";
  }

  return normalized;
}
