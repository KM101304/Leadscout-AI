import Stripe from "stripe";
import { env } from "@/lib/env";
import { PlanTier } from "@/lib/plans";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: "2026-02-25.clover"
    });
  }

  return stripeClient;
}

export function getPriceIdForPlan(planTier: Exclude<PlanTier, "free">) {
  if (planTier === "pro") {
    return env.stripeProPriceId;
  }

  return env.stripeAgencyPriceId;
}

export function getPlanTierFromPriceId(priceId: string | null | undefined): PlanTier {
  if (priceId && priceId === env.stripeAgencyPriceId) {
    return "agency";
  }

  if (priceId && priceId === env.stripeProPriceId) {
    return "pro";
  }

  return "free";
}
