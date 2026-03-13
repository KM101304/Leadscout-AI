import { scoreLead } from "@/lib/leadScoring";
import { generatePitch } from "@/lib/pitchGenerator";
import { scanWebsite } from "@/lib/websiteScanner";
import { Lead, SearchInput, SearchResult } from "@/lib/types";
import { searchBusinessDirectory } from "@/services/directoryService";
import { slugify } from "@/lib/utils";

export async function runLeadScan(input: SearchInput): Promise<SearchResult> {
  const businesses = await searchBusinessDirectory(input);

  const leads: Lead[] = await Promise.all(
    businesses.map(async (business) => {
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

  return {
    searchId: `${slugify(input.location)}-${slugify(input.niche)}`,
    location: input.location,
    niche: input.niche,
    leads: sortedLeads,
    summary: {
      scanned: sortedLeads.length,
      highPriority,
      averageScore: Number(averageScore.toFixed(1))
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
