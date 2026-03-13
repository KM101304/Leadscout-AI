export type PlanTier = "free" | "pro" | "agency";

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
    unlocks: ["Manual review flow", "Single export path", "Limited outreach prep"]
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$49",
    summary: "Run repeatable outbound from one workspace.",
    bestFor: "Consultants, freelancers, small agencies",
    headline: "Where LeadScout becomes a real pipeline engine.",
    monthlyLeadLimit: "Unlimited searches",
    cta: "Upgrade to Pro",
    highlights: ["Unlimited searches", "CSV exports", "AI pitch variants", "Opportunity insights", "Saved workflows"],
    unlocks: ["Pitch drafts on every lead", "Bulk shortlisting", "Winning angle suggestions"]
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
    unlocks: ["Shared call queues", "Owner assignment", "Team dashboards", "Export history"]
  }
];

export const featureMatrix = [
  {
    name: "Lead searches",
    free: "25 / month",
    pro: "Unlimited",
    agency: "Unlimited"
  },
  {
    name: "CSV exports",
    free: "Basic",
    pro: "Included",
    agency: "Bulk + scheduled"
  },
  {
    name: "AI pitch assistant",
    free: "Limited",
    pro: "Full pitch variants",
    agency: "Shared team playbooks"
  },
  {
    name: "Opportunity insights",
    free: "Basic score",
    pro: "Strategic explanation",
    agency: "Advanced routing signals"
  },
  {
    name: "Saved leads",
    free: "Simple list",
    pro: "Priority pipelines",
    agency: "Shared team ownership"
  },
  {
    name: "Team workflows",
    free: "No",
    pro: "No",
    agency: "Yes"
  }
] as const;
