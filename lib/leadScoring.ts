import { IssueType, OpportunityType, WebsiteIssue, WebsiteSignals } from "@/lib/types";

const issueCatalog: Record<IssueType, Omit<WebsiteIssue, "type">> = {
  "no-website": { label: "No website", points: 40 },
  "outdated-site": { label: "Outdated website", points: 25 },
  "poor-mobile": { label: "Poor mobile layout", points: 20 },
  "no-booking": { label: "No booking funnel", points: 15 },
  "no-ssl": { label: "No SSL", points: 10 },
  "low-reviews": { label: "Low review activity", points: 10 },
  "broken-links": { label: "Broken links", points: 10 },
  "no-chat-widget": { label: "No chat widget", points: 10 },
  "no-analytics": { label: "No analytics", points: 10 },
  "slow-site": { label: "Slow page load", points: 10 },
  "weak-seo": { label: "Weak SEO basics", points: 10 }
};

export function scoreLead(signals: WebsiteSignals, reviewCount: number) {
  const issues: WebsiteIssue[] = [];

  const pushIssue = (type: IssueType) => {
    issues.push({ type, ...issueCatalog[type] });
  };

  if (!signals.hasWebsite) {
    pushIssue("no-website");
  } else {
    if (!signals.hasSsl) pushIssue("no-ssl");
    if (!signals.hasViewport) pushIssue("poor-mobile");
    if (!signals.hasBookingFlow) pushIssue("no-booking");
    if (signals.brokenLinks > 0) pushIssue("broken-links");
    if (!signals.hasChatWidget) pushIssue("no-chat-widget");
    if (!signals.hasAnalytics) pushIssue("no-analytics");
    if (signals.loadTimeMs > 3200) pushIssue("slow-site");
    if (!signals.pageTitle || !signals.metaDescription) pushIssue("weak-seo");

    if (signals.copyrightYear && signals.copyrightYear < new Date().getFullYear() - 5) {
      pushIssue("outdated-site");
    }
  }

  if (reviewCount < 25) {
    pushIssue("low-reviews");
  }

  const total = Math.min(100, issues.reduce((sum, issue) => sum + issue.points, 0));
  const opportunityType = inferOpportunityType(issues.map((issue) => issue.type));

  return {
    leadScore: total,
    issues,
    opportunityType
  };
}

function inferOpportunityType(issueTypes: IssueType[]): OpportunityType {
  if (issueTypes.includes("no-booking")) return "Automation opportunity";
  if (issueTypes.includes("no-chat-widget")) return "AI chatbot opportunity";
  if (issueTypes.includes("weak-seo")) return "SEO improvement opportunity";
  if (issueTypes.includes("low-reviews")) return "Reputation management opportunity";
  if (issueTypes.includes("outdated-site") || issueTypes.includes("no-website")) {
    return "Website redesign opportunity";
  }
  return "Marketing funnel opportunity";
}
