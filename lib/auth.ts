import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/shared";
import { env } from "@/lib/env";
import { planDefinitions, PlanTier } from "@/lib/plans";
import { countMonthlyLeadUsage } from "@/services/indexedLeadRepository";
import { getBillingSubscriptionByUserId, getEffectivePlanTier, getLeadsLimitForTier } from "@/services/billingService";

export interface ViewerContext {
  user: User | null;
  subscription: {
    tier: PlanTier;
    leadsUsedThisMonth: number;
    leadsLimit: number;
  };
}

const defaultViewer: ViewerContext = {
  user: null,
  subscription: {
    tier: normalizePlanTier(env.defaultPlanTier),
    leadsUsedThisMonth: 0,
    leadsLimit: 25
  }
};

async function readViewer(): Promise<ViewerContext> {
  if (!hasSupabaseAuth) {
    return defaultViewer;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return defaultViewer;
    }

    const fallbackTier = normalizePlanTier(user.user_metadata?.plan_tier ?? user.app_metadata?.plan_tier ?? env.defaultPlanTier);
    const billingSubscription = await getBillingSubscriptionSafely(user.id);
    const leadsUsedThisMonth = await countMonthlyLeadUsageSafely(user.id);
    const devOverrideTier = getDevelopmentOverrideTier();
    const tier = devOverrideTier ?? (billingSubscription ? getEffectivePlanTier(billingSubscription, fallbackTier) : fallbackTier);
    const plan =
      planDefinitions.find((entry) => entry.tier === tier) ??
      planDefinitions.find((entry) => entry.tier === fallbackTier) ??
      planDefinitions[0];

    return {
      user,
      subscription: {
        tier,
        leadsUsedThisMonth: Number.isFinite(leadsUsedThisMonth) ? leadsUsedThisMonth : 0,
        leadsLimit: devOverrideTier || billingSubscription ? getLeadsLimitForTier(tier) : parseLeadLimit(plan.monthlyLeadLimit)
      }
    };
  } catch {
    return defaultViewer;
  }
}

export const getViewer = cache(readViewer);

export async function getViewerFresh() {
  return readViewer();
}

export async function requireViewer() {
  const viewer = await getViewer();

  if (!viewer.user) {
    redirect("/login");
  }

  return viewer;
}

function normalizePlanTier(value: unknown): PlanTier {
  return value === "starter" || value === "pro" || value === "agency" ? value : "free";
}

function parseLeadLimit(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 999999;
}

function getDevelopmentOverrideTier(): PlanTier | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const tier = normalizePlanTier(env.devOverridePlanTier);
  return tier === "free" ? null : tier;
}

async function getBillingSubscriptionSafely(userId: string) {
  if (!env.supabaseDatabaseUrl) {
    return null;
  }

  try {
    return await getBillingSubscriptionByUserId(userId);
  } catch {
    return null;
  }
}

async function countMonthlyLeadUsageSafely(userId: string) {
  try {
    return await countMonthlyLeadUsage(userId);
  } catch {
    return 0;
  }
}
