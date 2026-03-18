const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY?.trim() || "";
const liveScanOverride = process.env.ENABLE_LIVE_SCAN?.trim().toLowerCase();

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim() || "",
  openAiApiKey: process.env.OPENAI_API_KEY?.trim() || "",
  openAiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
  googlePlacesApiKey,
  nextPublicMapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    "",
  supabaseDatabaseUrl: process.env.SUPABASE_DATABASE_URL?.trim() || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() || "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || "",
  stripeStarterPriceId: process.env.STRIPE_STARTER_PRICE_ID?.trim() || "",
  stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID?.trim() || "",
  stripeAgencyPriceId: process.env.STRIPE_AGENCY_PRICE_ID?.trim() || "",
  enableLiveScan: liveScanOverride ? liveScanOverride === "true" : Boolean(googlePlacesApiKey),
  enableDemoMode: process.env.ENABLE_DEMO_MODE?.trim() === "true",
  defaultPlanTier: process.env.DEFAULT_PLAN_TIER?.trim() || "free",
  devOverridePlanTier: process.env.DEV_OVERRIDE_PLAN_TIER?.trim() || "",
  indexedDataFile: process.env.INDEXED_DATA_FILE?.trim() || "data/indexed-leads.json",
  premiumFreshnessHours: Number(process.env.PREMIUM_FRESHNESS_HOURS?.trim() || "168"),
  indexedFreshnessHours: Number(process.env.INDEXED_FRESHNESS_HOURS?.trim() || "720"),
  premiumMinimumIndexedCoverage: Number(process.env.PREMIUM_MINIMUM_INDEXED_COVERAGE?.trim() || "8"),
  freeLiveScanMonthlyLimit: Number(process.env.FREE_LIVE_SCAN_MONTHLY_LIMIT?.trim() || "25")
};

export function hasConfiguredIntegration(name: keyof typeof env) {
  return Boolean(env[name]);
}
