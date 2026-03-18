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

export const getViewer = cache(async (): Promise<ViewerContext> => {
  if (!hasSupabaseAuth) {
    return defaultViewer;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const fallbackTier = normalizePlanTier(user?.user_metadata?.plan_tier ?? user?.app_metadata?.plan_tier ?? env.defaultPlanTier);
    const billingSubscription = user ? await getBillingSubscriptionSafely(user.id) : null;
    const leadsUsedThisMonth = user ? await countMonthlyLeadUsage(user.id) : 0;
    const tier = billingSubscription ? getEffectivePlanTier(billingSubscription, fallbackTier) : "free";
    const plan = planDefinitions.find((entry) => entry.tier === tier) ?? planDefinitions[0];

    return {
      user,
      subscription: {
        tier,
        leadsUsedThisMonth,
        leadsLimit: billingSubscription ? getLeadsLimitForTier(tier) : parseLeadLimit(plan.monthlyLeadLimit)
      }
    };
  } catch {
    return defaultViewer;
  }
});

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
