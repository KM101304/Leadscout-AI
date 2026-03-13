export const env = {
  openAiApiKey: process.env.OPENAI_API_KEY?.trim() || "",
  openAiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY?.trim() || "",
  nextPublicMapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "",
  supabaseDatabaseUrl: process.env.SUPABASE_DATABASE_URL?.trim() || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() || "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || "",
  enableLiveScan: process.env.ENABLE_LIVE_SCAN?.trim() === "true",
  enableDemoMode: process.env.ENABLE_DEMO_MODE?.trim() === "true"
};

export function hasConfiguredIntegration(name: keyof typeof env) {
  return Boolean(env[name]);
}
