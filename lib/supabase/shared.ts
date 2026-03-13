import { env } from "@/lib/env";

export const hasSupabaseAuth =
  Boolean(env.supabaseUrl) && Boolean(env.supabasePublishableKey);

export function getSupabaseConfig() {
  if (!hasSupabaseAuth) {
    throw new Error("Supabase auth is not configured.");
  }

  return {
    url: env.supabaseUrl,
    publishableKey: env.supabasePublishableKey
  };
}
