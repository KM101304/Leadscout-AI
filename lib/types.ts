import type { PlanTier } from "@/lib/plans";

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
  niche: string;
  city: string;
  region: string;
  phone: string;
  website: string;
  address: string;
  rating: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  location: string;
  reviewCount: number;
  googleRating: number;
  placeSource: string;
  websiteStatus: "has-website" | "no-website" | "unknown";
  leadScore: number;
  issueTags: IssueType[];
  issueLabels: string[];
  opportunityScore: number;
  opportunityType: OpportunityType;
  recommendedPitchAngle: string;
  analysisSummary: string;
  opportunityInsight: string;
  pitch: PitchBundle;
  notes: string;
  status: "new" | "called" | "follow-up" | "not-interested" | "meeting-booked";
  signals: WebsiteSignals;
  lastScannedAt: string;
  sourceMode: ScanMode;
  confidence: number;
  websiteLastAnalyzedAt?: string;
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
  mode?: ScanModePreference;
  userId?: string | null;
  planTier?: PlanTier;
}

export interface ScanQuery extends Required<SearchInput> {
  queryString: string;
}

export interface ScanSummary {
  scanned: number;
  highPriority: number;
  averageScore: number;
  topIssueLabels: string[];
  recommendation: string;
  generatedPitch: string;
}

export type ScanMode = "indexed" | "live" | "demo";

export type ScanModePreference = ScanMode | "auto";

export type ScanAccessTier = "free" | "premium";

export interface MapMarker {
  id: string;
  businessName: string;
  latitude: number;
  longitude: number;
  score: number;
  sourceMode: ScanMode;
}

export interface ScanSourceSummary {
  label: string;
  detail: string;
  freshnessText: string;
  coverageState: "full" | "partial" | "empty";
  cachedLeadCount: number;
  refreshedLeadCount: number;
  estimatedLiveCostUsd: number;
  upgradeRequired: boolean;
}

export interface PitchContext {
  generatedPitch: string;
  recommendation: string;
  topOpportunityType?: string;
}

export interface ScanSession {
  id: string;
  mode: ScanMode;
  accessTier: ScanAccessTier;
  userId: string | null;
  niche: string;
  location: string;
  radius: number;
  filters: {
    minimumReviewCount: number;
    websiteStatus: "any" | "has-website" | "no-website";
    businessSize: "any" | "solo" | "small-team" | "multi-location";
  };
  queryString: string;
  query: ScanQuery;
  sourceSummary: ScanSourceSummary;
  leads: Lead[];
  summary: ScanSummary;
  issueCounts: Partial<Record<IssueType, number>>;
  pitchContext: PitchContext;
  mapMarkers: MapMarker[];
  isEmpty: boolean;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  upgradeCtaLabel?: string;
  usage: {
    liveScansThisMonth: number;
    liveScanLimit: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IndexedLeadRecord {
  id: string;
  businessName: string;
  niche: string;
  city: string;
  region: string;
  location: string;
  country: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  placeSource: string;
  websiteStatus: "has-website" | "no-website" | "unknown";
  issueTags: IssueType[];
  opportunityScore: number;
  opportunityType: OpportunityType;
  recommendedPitchAngle: string;
  analysisSummary: string;
  sourceMode: ScanMode;
  confidence: number;
  signals: WebsiteSignals;
  lastScannedAt: string;
  createdAt: string;
  updatedAt: string;
}
