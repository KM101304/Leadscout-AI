import { randomUUID } from "node:crypto";
import { scoreLead } from "@/lib/leadScoring";
import { generateMockBusinesses } from "@/lib/mockData";
import { generatePitch } from "@/lib/pitchGenerator";
import { env } from "@/lib/env";
import { ScanConfigurationError, ScanExecutionError, ScanQueryError } from "@/lib/scanErrors";
import {
  IndexedLeadRecord,
  Lead,
  ScanAccessTier,
  ScanMode,
  ScanModePreference,
  ScanQuery,
  ScanSession,
  SearchInput
} from "@/lib/types";
import { searchBusinessDirectory } from "@/services/directoryService";
import {
  countMonthlyLeadUsage,
  countMonthlyUsage,
  deriveIssueCounts,
  logAppEvent,
  getSavedLeadIds,
  logUsage,
  persistScanSession,
  queryIndexedLeads,
  upsertIndexedLeads
} from "@/services/indexedLeadRepository";
import { slugify } from "@/lib/utils";
import { scanWebsite } from "@/lib/websiteScanner";
import { getLeadsLimitForTier } from "@/services/billingService";

export async function runLeadScan(input: SearchInput): Promise<ScanSession> {
  const query = normalizeScanQuery(input);
  const planTier = input.planTier ?? "free";
  const liveScanLimit = resolveLiveScanLimit(planTier);
  const accessTier =
    planTier === "starter" || planTier === "pro" || planTier === "agency" || (env.enableLiveScan && liveScanLimit > 0)
      ? "premium"
      : "free";
  const monthlyLeadLimit = getLeadsLimitForTier(planTier);
  const leadsUsedThisMonth = await countMonthlyLeadUsage(input.userId ?? null);

  if (Number.isFinite(monthlyLeadLimit) && leadsUsedThisMonth >= monthlyLeadLimit) {
    await logAppEvent({
      scope: "scan",
      level: "warning",
      message: "Monthly lead limit reached before starting scan.",
      userId: input.userId ?? null,
      metadata: {
        location: query.location,
        niche: query.niche,
        planTier,
        leadsUsedThisMonth,
        monthlyLeadLimit
      }
    });
    throw new ScanExecutionError("You have reached this month's included lead limit for your plan. Upgrade to continue scanning.");
  }

  const savedLeadIds = await getSavedLeadIds(input.userId ?? null);
  const indexedResult = await queryIndexedLeads(query);
  const liveScansThisMonth = await countMonthlyUsage(input.userId ?? null, "live");
  const canUseDemo = query.mode === "demo";
  const hasFreshIndexedCoverage =
    indexedResult.coverageCount >= env.premiumMinimumIndexedCoverage &&
    isFresh(indexedResult.lastScannedAt, env.premiumFreshnessHours);

  const mode = resolveMode({
    planTier,
    requestedMode: query.mode,
    accessTier,
    hasIndexedCoverage: indexedResult.coverageCount > 0,
    hasFreshIndexedCoverage,
    canUseDemo,
    liveScansThisMonth,
    liveScanLimit
  });

  if (mode === "demo") {
    const session = await buildSessionFromBusinesses({
      mode,
      planTier,
      accessTier,
      userId: input.userId ?? null,
      query,
      businesses: generateMockBusinesses(query.location, query.niche),
      liveScansThisMonth,
      liveScanLimit,
      sourceDetail: "Explicit demo mode is active. These results are sample data and are labeled separately from indexed or live results.",
      refreshedLeadCount: 0,
      estimatedLiveCostUsd: 0,
      savedLeadIds
    });
    return finalizeSession({
      session,
      leadsUsedThisMonth,
      estimatedCostUsd: 0
    });
  }

  if (mode === "indexed") {
    const indexedLeads = indexedResult.leads.map((record) => mapIndexedRecordToLead(record, savedLeadIds));

    const session = buildScanSession({
      mode,
      planTier,
      accessTier,
      userId: input.userId ?? null,
      query,
      leads: indexedLeads,
      indexedLeadCount: indexedLeads.length,
      refreshedLeadCount: 0,
      estimatedLiveCostUsd: 0,
      liveScansThisMonth,
      liveScanLimit,
      lastScannedAt: indexedResult.lastScannedAt,
      sourceDetail:
        indexedLeads.length > 0
          ? "Results came from the indexed lead database only. No live API calls were made for this search."
          : accessTier === "free"
            ? "No indexed results are available for this market yet, and live API access is not enabled for this workspace."
            : "No indexed results are available yet, and a live refresh was not requested."
    });
    return finalizeSession({
      session,
      leadsUsedThisMonth,
      estimatedCostUsd: 0
    });
  }

  if (!env.enableLiveScan) {
    throw new ScanConfigurationError("Premium live scans are disabled. Enable live scanning to fetch and analyze fresh markets.");
  }

  const liveBusinesses = await searchBusinessDirectory(query);
  if (liveBusinesses.length === 0) {
    if (indexedResult.coverageCount > 0) {
      const indexedLeads = indexedResult.leads.map((record) => mapIndexedRecordToLead(record, savedLeadIds));
      const session = buildScanSession({
        mode: "indexed",
        planTier,
        accessTier,
        userId: input.userId ?? null,
        query,
        leads: indexedLeads,
        indexedLeadCount: indexedLeads.length,
        refreshedLeadCount: 0,
        estimatedLiveCostUsd: 0,
        liveScansThisMonth,
        liveScanLimit,
        lastScannedAt: indexedResult.lastScannedAt,
        sourceDetail: "Live refresh returned no new businesses, so the session fell back to the indexed dataset."
      });
      await logAppEvent({
        scope: "scan",
        level: "warning",
        message: "Live scan fell back to indexed results because no businesses were returned.",
        userId: input.userId ?? null,
        metadata: {
          location: query.location,
          niche: query.niche,
          requestedMode: query.mode
        }
      });
      return finalizeSession({
        session,
        leadsUsedThisMonth,
        estimatedCostUsd: 0
      });
    }

    throw new ScanExecutionError(`No businesses were found for ${query.niche} in ${query.location}.`);
  }

  const analyzedLiveLeads = await mapWithConcurrency(
    liveBusinesses,
    2,
    (business) => analyzeBusiness({ business, mode: "live" })
  );
  const markedLiveLeads = analyzedLiveLeads.map((lead) => ({ ...lead, isSaved: savedLeadIds.has(lead.id) }));

  const indexedRecords = markedLiveLeads.map(mapLeadToIndexedRecord);
  await upsertIndexedLeads(indexedRecords);

  const session = buildScanSession({
    mode: "live",
    planTier,
    accessTier,
    userId: input.userId ?? null,
    query,
    leads: markedLiveLeads,
    indexedLeadCount: indexedResult.coverageCount,
    refreshedLeadCount: markedLiveLeads.length,
    estimatedLiveCostUsd: estimateLiveCost(markedLiveLeads.length),
    liveScansThisMonth: liveScansThisMonth + 1,
    liveScanLimit,
    lastScannedAt: new Date().toISOString(),
    sourceDetail:
      indexedResult.coverageCount > 0
        ? "A live API refresh was run because the cached market was stale or thin. Fresh results were merged back into the indexed store."
        : "A live API scan fetched a new market and stored the analyzed results for future indexed reuse."
  });
  return finalizeSession({
    session,
    leadsUsedThisMonth,
    estimatedCostUsd: estimateLiveCost(markedLiveLeads.length)
  });
}

export function leadsToCsv(leads: Lead[]) {
  const header = [
    "business_name",
    "phone",
    "website",
    "address",
    "lead_score",
    "issues",
    "opportunity_type",
    "pitch_suggestion",
    "last_scanned_at"
  ];

  const rows = leads.map((lead) => [
    lead.businessName,
    lead.phone,
    lead.website,
    lead.address,
    String(lead.leadScore),
    lead.issueLabels.join("; "),
    lead.opportunityType,
    lead.pitch.emailPitch,
    lead.lastScannedAt
  ]);

  return [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${cell.replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
}

function normalizeScanQuery(input: SearchInput): ScanQuery {
  const location = input.location?.trim();
  const niche = input.niche?.trim();

  if (!location || !niche) {
    throw new ScanQueryError("Both location and niche are required to run a scan.");
  }

  const radius = Number.isFinite(input.radius) ? Number(input.radius) : 25;
  const minimumReviewCount = Number.isFinite(input.minimumReviewCount) ? Number(input.minimumReviewCount) : 0;
  const websiteStatus = input.websiteStatus ?? "any";
  const businessSize = input.businessSize ?? "any";
  const mode = normalizeMode(input.mode);

  const params = new URLSearchParams({
    location,
    niche,
    radius: String(radius),
    minimumReviewCount: String(minimumReviewCount),
    websiteStatus,
    businessSize,
    mode
  });

  return {
    location,
    niche,
    radius,
    minimumReviewCount,
    websiteStatus,
    businessSize,
    mode,
    userId: input.userId ?? null,
    planTier: input.planTier ?? "free",
    queryString: params.toString()
  };
}

async function analyzeBusiness({
  business,
  mode
}: {
  business: {
    id: string;
    businessName: string;
    phone: string;
    website: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    location: string;
    niche: string;
    reviewCount: number;
    googleRating: number;
    signals: Lead["signals"];
  };
  mode: ScanMode;
}): Promise<Lead> {
  const websiteStatus: Lead["websiteStatus"] = business.website === "No website" ? "no-website" : "has-website";
  const signals = await scanWebsite({
    url: business.website,
    fallbackSignals: business.signals
  });
  const scored = scoreLead(signals, business.reviewCount);
  const recommendedPitchAngle = suggestPitchAngle(scored.opportunityType, scored.issues.map((issue) => issue.label));
  const pitch = await generatePitch({
    businessName: business.businessName,
    websiteUrl: business.website,
    issues: scored.issues.map((issue) => issue.type),
    industry: business.niche
  });

  return {
    id: business.id,
    businessName: business.businessName,
    niche: business.niche,
    city: business.location,
    region: inferRegionFromAddress(business.address, business.location),
    phone: business.phone,
    website: business.website,
    address: business.address,
    rating: business.googleRating,
    coordinates: business.coordinates,
    location: business.location,
    reviewCount: business.reviewCount,
    googleRating: business.googleRating,
    placeSource: mode === "live" ? "google_places" : "indexed",
    websiteStatus,
    leadScore: scored.leadScore,
    issueTags: scored.issues.map((issue) => issue.type),
    issueLabels: scored.issues.map((issue) => issue.label),
    opportunityScore: scored.leadScore,
    opportunityType: scored.opportunityType,
    recommendedPitchAngle,
    analysisSummary: buildOpportunityInsight({
      businessName: business.businessName,
      niche: business.niche,
      hasWebsite: signals.hasWebsite,
      issues: scored.issues.map((issue) => issue.label)
    }),
    opportunityInsight: buildOpportunityInsight({
      businessName: business.businessName,
      niche: business.niche,
      hasWebsite: signals.hasWebsite,
      issues: scored.issues.map((issue) => issue.label)
    }),
    pitch,
    notes: "",
    status: "new" as const,
    signals,
    lastScannedAt: new Date().toISOString(),
    sourceMode: mode,
    confidence: mode === "live" ? 0.9 : 0.75,
    websiteLastAnalyzedAt: signals.hasWebsite ? new Date().toISOString() : undefined
  };
}

async function buildSessionFromBusinesses({
  mode,
  planTier,
  accessTier,
  userId,
  query,
  businesses,
  liveScansThisMonth,
  liveScanLimit,
  sourceDetail,
  refreshedLeadCount,
  estimatedLiveCostUsd,
  savedLeadIds
}: {
  mode: ScanMode;
  planTier: NonNullable<SearchInput["planTier"]>;
  accessTier: ScanAccessTier;
  userId: string | null;
  query: ScanQuery;
  businesses: Array<{
    id: string;
    businessName: string;
    phone: string;
    website: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    location: string;
    niche: string;
    reviewCount: number;
    googleRating: number;
    signals: Lead["signals"];
  }>;
  liveScansThisMonth: number;
  liveScanLimit: number;
  sourceDetail: string;
  refreshedLeadCount: number;
  estimatedLiveCostUsd: number;
  savedLeadIds: Set<string>;
}) {
  const leads = (await Promise.all(businesses.map((business) => analyzeBusiness({ business, mode })))).map((lead) => ({
    ...lead,
    isSaved: savedLeadIds.has(lead.id)
  }));

  return buildScanSession({
    mode,
    planTier,
    accessTier,
    userId,
    query,
    leads,
    indexedLeadCount: leads.length,
    refreshedLeadCount,
    estimatedLiveCostUsd,
    liveScansThisMonth,
    liveScanLimit,
    lastScannedAt: leads[0]?.lastScannedAt ?? null,
    sourceDetail
  });
}

function buildScanSession({
  mode,
  planTier,
  accessTier,
  userId,
  query,
  leads,
  indexedLeadCount,
  refreshedLeadCount,
  estimatedLiveCostUsd,
  liveScansThisMonth,
  liveScanLimit,
  lastScannedAt,
  sourceDetail
}: {
  mode: ScanMode;
  planTier: NonNullable<SearchInput["planTier"]>;
  accessTier: ScanAccessTier;
  userId: string | null;
  query: ScanQuery;
  leads: Lead[];
  indexedLeadCount: number;
  refreshedLeadCount: number;
  estimatedLiveCostUsd: number;
  liveScansThisMonth: number;
  liveScanLimit: number;
  lastScannedAt: string | null;
  sourceDetail: string;
}): ScanSession {
  const sortedLeads = [...leads].sort((a, b) => b.leadScore - a.leadScore);
  const highPriority = sortedLeads.filter((lead) => lead.leadScore >= 60).length;
  const averageScore = sortedLeads.reduce((sum, lead) => sum + lead.leadScore, 0) / Math.max(sortedLeads.length, 1);
  const topIssueLabels = getTopIssueLabels(sortedLeads);
  const issueCounts = deriveIssueCounts(sortedLeads);
  const recommendation = sortedLeads[0]?.recommendedPitchAngle ?? `Start with a ${query.niche} growth systems review.`;
  const generatedPitch =
    sortedLeads[0]?.pitch.emailPitch ??
    `We scanned ${query.niche} in ${query.location} and surfaced businesses with visible digital gaps worth exploring.`;
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    mode,
    accessTier,
    planTier,
    userId,
    niche: query.niche,
    location: query.location,
    radius: query.radius,
    filters: {
      minimumReviewCount: query.minimumReviewCount,
      websiteStatus: query.websiteStatus,
      businessSize: query.businessSize
    },
    queryString: query.queryString,
    query,
    sourceSummary: {
      label: "Lead scan results",
      detail: sortedLeads.length > 0 ? "Lead scan completed successfully." : sourceDetail,
      freshnessText: lastScannedAt ? `Updated ${new Date(lastScannedAt).toLocaleDateString("en-US")}` : "Ready for review",
      coverageState: sortedLeads.length === 0 ? "empty" : sortedLeads.length >= env.premiumMinimumIndexedCoverage ? "full" : "partial",
      cachedLeadCount: indexedLeadCount,
      refreshedLeadCount,
      estimatedLiveCostUsd,
      upgradeRequired: mode === "indexed" && accessTier === "free" && sortedLeads.length === 0
    },
    leads: sortedLeads,
    summary: {
      scanned: sortedLeads.length,
      highPriority,
      averageScore: Number(averageScore.toFixed(1)),
      topIssueLabels,
      recommendation,
      generatedPitch
    },
    issueCounts,
    pitchContext: {
      generatedPitch,
      recommendation,
      topOpportunityType: sortedLeads[0]?.opportunityType
    },
    mapMarkers: sortedLeads
      .filter((lead) => Number.isFinite(lead.coordinates.latitude) && Number.isFinite(lead.coordinates.longitude))
      .map((lead) => ({
        id: lead.id,
        businessName: lead.businessName,
        latitude: lead.coordinates.latitude,
        longitude: lead.coordinates.longitude,
        score: lead.leadScore,
        sourceMode: lead.sourceMode
      })),
    isEmpty: sortedLeads.length === 0,
    emptyStateTitle: sortedLeads.length === 0 ? "No indexed results available for this market yet" : undefined,
    emptyStateMessage:
      sortedLeads.length === 0
        ? accessTier === "free"
          ? "This search only checked the indexed database, so no external API costs were triggered. Live scan access is currently unavailable for this workspace."
          : "Try a live API scan to fetch and analyze fresh businesses for this market."
        : undefined,
    upgradeCtaLabel: accessTier === "free" ? "Upgrade to Starter" : undefined,
    usage: {
      liveScansThisMonth,
      liveScanLimit
    },
    createdAt: now,
    updatedAt: now
  };
}

function resolveMode(input: {
  planTier: NonNullable<SearchInput["planTier"]>;
  requestedMode: ScanModePreference;
  accessTier: ScanAccessTier;
  hasIndexedCoverage: boolean;
  hasFreshIndexedCoverage: boolean;
  canUseDemo: boolean;
  liveScansThisMonth: number;
  liveScanLimit: number;
}): ScanMode {
  if (input.requestedMode === "demo") {
    if (!env.enableDemoMode) {
      throw new ScanConfigurationError("Demo mode is disabled. Use indexed results or a premium live scan instead.");
    }
    return "demo";
  }

  if (input.accessTier === "free") {
    return "indexed";
  }

  if (input.planTier === "starter") {
    if (input.requestedMode === "indexed") {
      return "indexed";
    }

    if (input.requestedMode === "live") {
      return input.liveScansThisMonth >= input.liveScanLimit ? "indexed" : "live";
    }

    if (input.hasFreshIndexedCoverage) {
      return "indexed";
    }

    if (input.liveScansThisMonth >= input.liveScanLimit) {
      return "indexed";
    }

    return "live";
  }

  if (input.requestedMode === "indexed") {
    return "indexed";
  }

  if (input.requestedMode === "live") {
    if (input.liveScansThisMonth >= input.liveScanLimit) {
      return input.hasIndexedCoverage ? "indexed" : "indexed";
    }
    return "live";
  }

  if (input.hasFreshIndexedCoverage) {
    return "indexed";
  }

  if (input.liveScansThisMonth >= input.liveScanLimit) {
    return "indexed";
  }

  return "live";
}

function mapIndexedRecordToLead(record: IndexedLeadRecord, savedLeadIds?: Set<string>): Lead {
  const issueLabels = record.issueTags.map((issue) => readableIssueLabel(issue));
  return {
    id: record.id,
    businessName: record.businessName,
    niche: record.niche,
    city: record.city,
    region: record.region,
    phone: record.phone,
    website: record.website,
    address: record.address,
    rating: record.rating,
    coordinates: record.coordinates,
    location: record.location,
    reviewCount: record.reviewCount,
    googleRating: record.rating,
    placeSource: record.placeSource,
    websiteStatus: record.websiteStatus,
    leadScore: record.opportunityScore,
    issueTags: record.issueTags,
    issueLabels,
    opportunityScore: record.opportunityScore,
    opportunityType: record.opportunityType,
    recommendedPitchAngle: record.recommendedPitchAngle,
    analysisSummary: record.analysisSummary,
    opportunityInsight: record.analysisSummary,
    pitch: {
      coldCallOpener: `I noticed a few gaps at ${record.businessName} that look fixable without a major rebuild.`,
      emailPitch: `We reviewed ${record.businessName} and found a few visible issues that could be limiting inbound leads in ${record.niche}.`,
      serviceSuggestion: record.recommendedPitchAngle
    },
    notes: "",
    status: "new",
    signals: record.signals,
    lastScannedAt: record.lastScannedAt,
    sourceMode: record.sourceMode,
    confidence: record.confidence,
    websiteLastAnalyzedAt: record.updatedAt,
    isSaved: savedLeadIds?.has(record.id) ?? false
  };
}

function mapLeadToIndexedRecord(lead: Lead): IndexedLeadRecord {
  const timestamp = lead.lastScannedAt;
  return {
    id: lead.id,
    businessName: lead.businessName,
    niche: lead.niche,
    city: lead.city,
    region: lead.region,
    location: lead.location,
    country: inferCountryFromAddress(lead.address, lead.location),
    address: lead.address,
    phone: lead.phone,
    website: lead.website,
    rating: lead.googleRating,
    reviewCount: lead.reviewCount,
    coordinates: lead.coordinates,
    placeSource: lead.placeSource,
    websiteStatus: lead.websiteStatus,
    issueTags: lead.issueTags,
    opportunityScore: lead.opportunityScore,
    opportunityType: lead.opportunityType,
    recommendedPitchAngle: lead.recommendedPitchAngle,
    analysisSummary: lead.analysisSummary,
    sourceMode: lead.sourceMode,
    confidence: lead.confidence,
    signals: lead.signals,
    lastScannedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function getTopIssueLabels(leads: Lead[]) {
  const counts = new Map<string, number>();

  leads.forEach((lead) => {
    lead.issueLabels.forEach((issue) => {
      counts.set(issue, (counts.get(issue) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issue]) => issue);
}

function buildOpportunityInsight(input: {
  businessName: string;
  niche: string;
  hasWebsite: boolean;
  issues: string[];
}) {
  if (!input.hasWebsite) {
    return `${input.businessName} has no visible website presence, which creates a clear conversation around credibility, lead capture, and a faster path to first-party conversions.`;
  }

  const topIssues = input.issues.slice(0, 2).join(" and ").toLowerCase();
  return `This ${input.niche} business shows signs of ${topIssues || "conversion friction"}, which makes it a strong fit for a practical performance and automation pitch.`;
}

function normalizeMode(mode: SearchInput["mode"]): ScanModePreference {
  return mode === "indexed" || mode === "live" || mode === "demo" ? mode : "auto";
}

function resolveLiveScanLimit(planTier: SearchInput["planTier"]) {
  if (planTier === "agency") return 400;
  if (planTier === "starter") return 20;
  if (planTier === "pro") return 75;
  return env.freeLiveScanMonthlyLimit;
}

function isFresh(timestamp: string | null, freshnessHours: number) {
  if (!timestamp) return false;
  const ageMs = Date.now() - new Date(timestamp).getTime();
  return ageMs <= freshnessHours * 60 * 60 * 1000;
}

function estimateLiveCost(resultCount: number) {
  return Number((0.04 * resultCount).toFixed(2));
}

function inferRegionFromAddress(address: string, fallbackLocation: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return parts.at(-2) ?? fallbackLocation;
  }

  return fallbackLocation;
}

function inferCountryFromAddress(address: string, fallbackLocation: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const country = parts.at(-1);
  if (country && country.length > 2) {
    return country;
  }

  const normalized = slugify(fallbackLocation);
  if (normalized.includes("seattle")) return "United States";
  if (normalized.includes("toronto") || normalized.includes("vancouver")) return "Canada";
  return "Unknown";
}

function readableIssueLabel(issue: string) {
  return issue
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function suggestPitchAngle(opportunityType: string, issues: string[]) {
  const firstIssue = issues[0];
  if (firstIssue) {
    return `${opportunityType} around ${firstIssue.toLowerCase()}`;
  }
  return opportunityType;
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput) => Promise<TOutput>
) {
  const results: TOutput[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, () => worker())
  );

  return results;
}

async function finalizeSession(input: {
  session: ScanSession;
  leadsUsedThisMonth: number;
  estimatedCostUsd: number;
}) {
  const limitedSession = applyLeadAllowance(input.session, input.leadsUsedThisMonth);
  const persisted = await persistScanSession(limitedSession);

  await logUsage({
    userId: persisted.userId,
    tier: persisted.planTier,
    mode: persisted.mode,
    queryKey: `${slugify(persisted.location)}::${slugify(persisted.niche)}`,
    estimatedCostUsd: input.estimatedCostUsd,
    leadCount: persisted.leads.length
  });

  await logAppEvent({
    scope: "scan",
    level: "info",
    message: "Scan session persisted successfully.",
    userId: persisted.userId,
    metadata: {
      sessionId: persisted.id,
      mode: persisted.mode,
      planTier: persisted.planTier,
      leadCount: persisted.leads.length,
      estimatedLiveCostUsd: persisted.sourceSummary.estimatedLiveCostUsd
    }
  });

  return persisted;
}

function applyLeadAllowance(session: ScanSession, leadsUsedThisMonth: number) {
  const monthlyLeadLimit = getLeadsLimitForTier(session.planTier);
  if (!Number.isFinite(monthlyLeadLimit)) {
    return session;
  }

  const remaining = Math.max(monthlyLeadLimit - leadsUsedThisMonth, 0);
  if (remaining >= session.leads.length) {
    return session;
  }

  const trimmedLeads = session.leads.slice(0, remaining);
  const highPriority = trimmedLeads.filter((lead) => lead.leadScore >= 60).length;
  const averageScore = trimmedLeads.reduce((sum, lead) => sum + lead.leadScore, 0) / Math.max(trimmedLeads.length, 1);
  const topIssueLabels = getTopIssueLabels(trimmedLeads);
  const recommendation = trimmedLeads[0]?.recommendedPitchAngle ?? session.summary.recommendation;
  const generatedPitch = trimmedLeads[0]?.pitch.emailPitch ?? session.summary.generatedPitch;

  return {
    ...session,
    leads: trimmedLeads,
    sourceSummary: {
      ...session.sourceSummary,
      detail:
        trimmedLeads.length < session.leads.length
          ? `${session.sourceSummary.detail} Results were capped to the remaining included leads on this month's ${session.planTier} plan.`
          : session.sourceSummary.detail
    },
    summary: {
      scanned: trimmedLeads.length,
      highPriority,
      averageScore: Number(averageScore.toFixed(1)),
      topIssueLabels,
      recommendation,
      generatedPitch
    },
    issueCounts: deriveIssueCounts(trimmedLeads),
    pitchContext: {
      generatedPitch,
      recommendation,
      topOpportunityType: trimmedLeads[0]?.opportunityType
    },
    mapMarkers: trimmedLeads
      .filter((lead) => Number.isFinite(lead.coordinates.latitude) && Number.isFinite(lead.coordinates.longitude))
      .map((lead) => ({
        id: lead.id,
        businessName: lead.businessName,
        latitude: lead.coordinates.latitude,
        longitude: lead.coordinates.longitude,
        score: lead.leadScore,
        sourceMode: lead.sourceMode
      })),
    isEmpty: trimmedLeads.length === 0,
    emptyStateTitle: trimmedLeads.length === 0 ? "No included leads remaining this month" : session.emptyStateTitle,
    emptyStateMessage:
      trimmedLeads.length === 0
        ? `You have already used the included leads on the ${session.planTier} plan for this month. Upgrade to continue scanning.`
        : session.emptyStateMessage,
    updatedAt: new Date().toISOString()
  };
}
