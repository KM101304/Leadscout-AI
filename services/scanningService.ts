import { scoreLead } from "@/lib/leadScoring";
import { generatePitch } from "@/lib/pitchGenerator";
import { ScanConfigurationError, ScanExecutionError, ScanQueryError } from "@/lib/scanErrors";
import { ScanQuery, ScanSession, SearchInput, Lead } from "@/lib/types";
import { searchBusinessDirectory } from "@/services/directoryService";
import { slugify } from "@/lib/utils";
import { scanWebsite } from "@/lib/websiteScanner";

export async function runLeadScan(input: SearchInput): Promise<ScanSession> {
  const query = normalizeScanQuery(input);
  const directoryResult = await searchBusinessDirectory(query);

  if (directoryResult.mode === "live" && directoryResult.businesses.length === 0) {
    throw new ScanExecutionError(`No businesses were found for ${query.niche} in ${query.location}.`);
  }

  if (directoryResult.mode === "demo" && directoryResult.businesses.length === 0) {
    throw new ScanExecutionError("Demo mode is enabled, but no demo businesses are available for this scan.");
  }

  const leads: Lead[] = await Promise.all(
    directoryResult.businesses.map(async (business) => {
      const signals = await scanWebsite({
        url: business.website,
        fallbackSignals: business.signals
      });
      const scored = scoreLead(signals, business.reviewCount);
      const pitch = await generatePitch({
        businessName: business.businessName,
        websiteUrl: business.website,
        issues: scored.issues.map((issue) => issue.type),
        industry: business.niche
      });

      return {
        id: business.id,
        businessName: business.businessName,
        phone: business.phone,
        website: business.website,
        address: business.address,
        coordinates: business.coordinates,
        location: business.location,
        niche: business.niche,
        reviewCount: business.reviewCount,
        googleRating: business.googleRating,
        leadScore: scored.leadScore,
        issueTags: scored.issues.map((issue) => issue.type),
        issueLabels: scored.issues.map((issue) => issue.label),
        opportunityType: scored.opportunityType,
        opportunityInsight: buildOpportunityInsight({
          businessName: business.businessName,
          niche: business.niche,
          hasWebsite: signals.hasWebsite,
          issues: scored.issues.map((issue) => issue.label)
        }),
        pitch,
        notes: "",
        status: "new",
        signals
      };
    })
  );

  const sortedLeads = leads.sort((a, b) => b.leadScore - a.leadScore);
  const highPriority = sortedLeads.filter((lead) => lead.leadScore >= 60).length;
  const averageScore = sortedLeads.reduce((sum, lead) => sum + lead.leadScore, 0) / Math.max(sortedLeads.length, 1);
  const topIssueLabels = getTopIssueLabels(sortedLeads);
  const recommendation = sortedLeads[0]?.pitch.serviceSuggestion ?? `Start with a ${query.niche} growth systems review.`;
  const generatedPitch =
    sortedLeads[0]?.pitch.emailPitch ??
    `We scanned ${query.niche} in ${query.location} and surfaced businesses with visible digital gaps worth exploring.`;

  return {
    searchId: `${slugify(query.location)}-${slugify(query.niche)}`,
    mode: directoryResult.mode,
    query,
    leads: sortedLeads,
    summary: {
      scanned: sortedLeads.length,
      highPriority,
      averageScore: Number(averageScore.toFixed(1)),
      topIssueLabels,
      recommendation,
      generatedPitch
    }
  };
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
    "pitch"
  ];

  const rows = leads.map((lead) => [
    lead.businessName,
    lead.phone,
    lead.website,
    lead.address,
    String(lead.leadScore),
    lead.issueLabels.join("; "),
    lead.opportunityType,
    lead.pitch.emailPitch
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

  const params = new URLSearchParams({
    location,
    niche,
    radius: String(radius),
    minimumReviewCount: String(minimumReviewCount),
    websiteStatus,
    businessSize
  });

  return {
    location,
    niche,
    radius,
    minimumReviewCount,
    websiteStatus,
    businessSize,
    queryString: params.toString()
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
