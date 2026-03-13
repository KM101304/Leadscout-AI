function readEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export const env = {
  openAiApiKey: readEnv("OPENAI_API_KEY"),
  openAiModel: readEnv("OPENAI_MODEL") || "gpt-4.1-mini",
  googlePlacesApiKey: readEnv("GOOGLE_PLACES_API_KEY"),
  supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseDatabaseUrl: readEnv("SUPABASE_DATABASE_URL"),
  stripeSecretKey: readEnv("STRIPE_SECRET_KEY"),
  stripePublishableKey: readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  stripeWebhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
  enableLiveScan: readEnv("ENABLE_LIVE_SCAN") === "true"
};

export function hasConfiguredIntegration(name: keyof typeof env) {
  return Boolean(env[name]);
}
