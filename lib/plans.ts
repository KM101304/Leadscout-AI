export type PlanTier = "free" | "starter" | "pro" | "agency";

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  price: string;
  summary: string;
  bestFor: string;
  headline: string;
  monthlyLeadLimit: string;
  cta: string;
  highlights: string[];
  unlocks: string[];
  indexedSearches: string;
  liveScans: string;
  liveScanMonthlyLimit: number;
}

export const planDefinitions: PlanDefinition[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    summary: "Validate a market and sample the workflow.",
    bestFor: "Solo operators testing demand",
    headline: "Great for trying searches, not for running outbound seriously.",
    monthlyLeadLimit: "25 leads / month",
    cta: "Start free",
    highlights: ["25 monthly leads", "Core scoring", "Basic lead table"],
    unlocks: ["Manual review flow", "Single export path", "Limited outreach prep"],
    indexedSearches: "Indexed database only",
    liveScans: "Upgrade required",
    liveScanMonthlyLimit: 0
  },
  {
    tier: "starter",
    name: "Starter",
    price: "$27",
    summary: "Use the hybrid engine without jumping straight into a full pro workflow.",
    bestFor: "Operators who need real scans without a large monthly commitment",
    headline: "The paid entry point for practical hybrid prospecting.",
    monthlyLeadLimit: "150 leads / month",
    cta: "Upgrade to Starter",
    highlights: ["150 monthly leads", "Hybrid scan routing", "CSV exports", "Opportunity insights"],
    unlocks: ["Indexed search plus limited live refresh", "Reusable market cache growth", "Guided upgrade path into Pro"],
    indexedSearches: "Unlimited indexed coverage",
    liveScans: "Hybrid framework with limited live scans",
    liveScanMonthlyLimit: 20
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$49",
    summary: "Run repeatable outbound with deeper controlled refresh logic.",
    bestFor: "Consultants, freelancers, small agencies",
    headline: "Semi-hybrid by default so margin stays protected while premium depth stays obvious.",
    monthlyLeadLimit: "Unlimited searches",
    cta: "Upgrade to Pro",
    highlights: ["Unlimited searches", "CSV exports", "AI pitch variants", "Opportunity insights", "Saved workflows"],
    unlocks: ["Pitch drafts on every lead", "Bulk shortlisting", "Winning angle suggestions"],
    indexedSearches: "Unlimited indexed coverage",
    liveScans: "Semi-hybrid framework with broader live refresh",
    liveScanMonthlyLimit: 75
  },
  {
    tier: "agency",
    name: "Agency",
    price: "$149",
    summary: "Coordinate teams, exports, and bulk prospecting.",
    bestFor: "Outbound teams and multi-seat agencies",
    headline: "A command center for team-based lead operations.",
    monthlyLeadLimit: "Unlimited + bulk workflows",
    cta: "Upgrade to Agency",
    highlights: ["Team accounts", "Bulk exports", "Advanced scoring views", "Queue management", "Playbooks and routing"],
    unlocks: ["Shared call queues", "Owner assignment", "Team dashboards", "Export history"],
    indexedSearches: "Unlimited indexed coverage",
    liveScans: "High-volume live scans",
    liveScanMonthlyLimit: 400
  }
];

export const featureMatrix = [
  {
    name: "Lead searches",
    free: "25 / month",
    starter: "150 / month",
    pro: "Unlimited",
    agency: "Unlimited"
  },
  {
    name: "Search source",
    free: "Indexed database",
    starter: "Hybrid indexed + limited live",
    pro: "Semi-hybrid + deeper live refresh",
    agency: "Indexed + live refresh"
  },
  {
    name: "CSV exports",
    free: "Basic",
    starter: "Included",
    pro: "Included",
    agency: "Bulk + scheduled"
  },
  {
    name: "AI pitch assistant",
    free: "Limited",
    starter: "Included",
    pro: "Full pitch variants",
    agency: "Shared team playbooks"
  },
  {
    name: "Opportunity insights",
    free: "Basic score",
    starter: "Included",
    pro: "Strategic explanation",
    agency: "Advanced routing signals"
  },
  {
    name: "Saved leads",
    free: "Simple list",
    starter: "Priority shortlist",
    pro: "Priority pipelines",
    agency: "Shared team ownership"
  },
  {
    name: "Team workflows",
    free: "No",
    starter: "No",
    pro: "No",
    agency: "Yes"
  }
] as const;
