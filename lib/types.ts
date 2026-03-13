export type IssueType =
  | "no-website"
  | "outdated-site"
  | "poor-mobile"
  | "no-booking"
  | "no-ssl"
  | "low-reviews"
  | "broken-links"
  | "no-chat-widget"
  | "no-analytics"
  | "slow-site"
  | "weak-seo";

export type OpportunityType =
  | "Website redesign opportunity"
  | "AI chatbot opportunity"
  | "Automation opportunity"
  | "SEO improvement opportunity"
  | "Reputation management opportunity"
  | "Marketing funnel opportunity";

export interface WebsiteSignals {
  pageTitle?: string;
  metaDescription?: string;
  hasSsl: boolean;
  hasViewport: boolean;
  brokenLinks: number;
  loadTimeMs: number;
  hasBookingFlow: boolean;
  hasChatWidget: boolean;
  hasAnalytics: boolean;
  copyrightYear?: number;
  hasWebsite: boolean;
}

export interface WebsiteIssue {
  type: IssueType;
  label: string;
  points: number;
}

export interface PitchBundle {
  coldCallOpener: string;
  emailPitch: string;
  serviceSuggestion: string;
}

export interface Lead {
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
  leadScore: number;
  issueTags: IssueType[];
  issueLabels: string[];
  opportunityType: OpportunityType;
  opportunityInsight: string;
  pitch: PitchBundle;
  notes: string;
  status: "new" | "called" | "follow-up" | "not-interested" | "meeting-booked";
  signals: WebsiteSignals;
}

export interface DirectoryBusiness {
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
  signals: WebsiteSignals;
}

export interface SearchInput {
  location: string;
  niche: string;
  radius?: number;
  minimumReviewCount?: number;
  websiteStatus?: "any" | "has-website" | "no-website";
  businessSize?: "any" | "solo" | "small-team" | "multi-location";
}

export interface SearchResult {
  searchId: string;
  location: string;
  niche: string;
  leads: Lead[];
  summary: {
    scanned: number;
    highPriority: number;
    averageScore: number;
  };
}
