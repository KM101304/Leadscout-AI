import type Stripe from "stripe";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { PlanTier, planDefinitions } from "@/lib/plans";
import { getPlanTierFromPriceId, getPriceIdForPlan, getStripe } from "@/lib/stripe";

export interface BillingSubscription {
  userId: string;
  email: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  planTier: PlanTier;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getBillingSubscriptionByUserId(userId: string) {
  const db = getDb();
  const result = await db.query<BillingSubscription>(
    `select
      user_id as "userId",
      email,
      stripe_customer_id as "stripeCustomerId",
      stripe_subscription_id as "stripeSubscriptionId",
      status,
      plan_tier as "planTier",
      current_period_end as "currentPeriodEnd",
      cancel_at_period_end as "cancelAtPeriodEnd",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from billing_subscriptions
    where user_id = $1
    limit 1`,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function getBillingSubscriptionByCustomerId(customerId: string) {
  const db = getDb();
  const result = await db.query<BillingSubscription>(
    `select
      user_id as "userId",
      email,
      stripe_customer_id as "stripeCustomerId",
      stripe_subscription_id as "stripeSubscriptionId",
      status,
      plan_tier as "planTier",
      current_period_end as "currentPeriodEnd",
      cancel_at_period_end as "cancelAtPeriodEnd",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from billing_subscriptions
    where stripe_customer_id = $1
    limit 1`,
    [customerId]
  );

  return result.rows[0] ?? null;
}

export async function ensureStripeCustomer(input: { userId: string; email: string | null }) {
  const existing = await getBillingSubscriptionByUserId(input.userId);
  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: input.email ?? undefined,
    metadata: {
      user_id: input.userId
    }
  });

  await upsertBillingSubscription({
    userId: input.userId,
    email: input.email,
    stripeCustomerId: customer.id,
    stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
    status: existing?.status ?? "inactive",
    planTier: existing?.planTier ?? "free",
    currentPeriodEnd: existing?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: existing?.cancelAtPeriodEnd ?? false
  });

  return customer.id;
}

export async function createCheckoutSession(input: {
  userId: string;
  email: string | null;
  planTier: Exclude<PlanTier, "free">;
  successUrl: string;
  cancelUrl: string;
}) {
  const priceId = getPriceIdForPlan(input.planTier);
  if (!priceId) {
    throw new Error(`Stripe price id is not configured for the ${input.planTier} plan.`);
  }

  const stripe = getStripe();
  const customerId = await ensureStripeCustomer({ userId: input.userId, email: input.email });

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    subscription_data: {
      metadata: {
        user_id: input.userId,
        plan_tier: input.planTier
      }
    },
    metadata: {
      user_id: input.userId,
      plan_tier: input.planTier
    }
  });
}

export async function createPortalSession(input: {
  userId: string;
  returnUrl: string;
}) {
  const subscription = await getBillingSubscriptionByUserId(input.userId);
  if (!subscription?.stripeCustomerId) {
    throw new Error("No Stripe customer is associated with this account yet.");
  }

  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: input.returnUrl
  });
}

export async function syncSubscriptionFromStripe(input: {
  subscription: Stripe.Subscription;
  customerId?: string | null;
}) {
  const customerId = typeof input.subscription.customer === "string" ? input.subscription.customer : input.customerId ?? null;
  if (!customerId) {
    throw new Error("Cannot sync Stripe subscription without a customer id.");
  }

  const existing = await getBillingSubscriptionByCustomerId(customerId);
  const fallbackUserId =
    input.subscription.metadata.user_id ||
    existing?.userId ||
    (typeof input.subscription.customer !== "string" &&
    !input.subscription.customer.deleted &&
    input.subscription.customer.metadata?.user_id) ||
    null;

  if (!fallbackUserId) {
    throw new Error(`Could not determine app user for Stripe customer ${customerId}.`);
  }

  const primaryItem = input.subscription.items.data[0];
  const planTier = getPlanTierFromPriceId(primaryItem?.price?.id);
  const status = normalizeStripeStatus(input.subscription.status);
  const currentPeriodEnd = getSubscriptionPeriodEnd(input.subscription);

  await upsertBillingSubscription({
    userId: fallbackUserId,
    email: existing?.email ?? null,
    stripeCustomerId: customerId,
    stripeSubscriptionId: input.subscription.id,
    status,
    planTier,
    currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(input.subscription.cancel_at_period_end)
  });
}

export async function markInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
  if (!customerId) {
    return;
  }

  const existing = await getBillingSubscriptionByCustomerId(customerId);
  if (!existing) {
    return;
  }

  await upsertBillingSubscription({
    userId: existing.userId,
    email: existing.email,
    stripeCustomerId: customerId,
    stripeSubscriptionId: existing.stripeSubscriptionId,
    status: "active",
    planTier: existing.planTier,
    currentPeriodEnd: existing.currentPeriodEnd,
    cancelAtPeriodEnd: existing.cancelAtPeriodEnd
  });
}

export async function markInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
  if (!customerId) {
    return;
  }

  const existing = await getBillingSubscriptionByCustomerId(customerId);
  if (!existing) {
    return;
  }

  await upsertBillingSubscription({
    userId: existing.userId,
    email: existing.email,
    stripeCustomerId: customerId,
    stripeSubscriptionId: existing.stripeSubscriptionId,
    status: "past_due",
    planTier: existing.planTier,
    currentPeriodEnd: existing.currentPeriodEnd,
    cancelAtPeriodEnd: existing.cancelAtPeriodEnd
  });
}

export async function upsertBillingSubscription(input: {
  userId: string;
  email: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  planTier: PlanTier;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}) {
  const db = getDb();

  await db.query(
    `insert into billing_subscriptions (
      user_id,
      email,
      stripe_customer_id,
      stripe_subscription_id,
      status,
      plan_tier,
      current_period_end,
      cancel_at_period_end
    ) values ($1, $2, $3, $4, $5, $6, $7, $8)
    on conflict (user_id) do update set
      email = excluded.email,
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_subscription_id = excluded.stripe_subscription_id,
      status = excluded.status,
      plan_tier = excluded.plan_tier,
      current_period_end = excluded.current_period_end,
      cancel_at_period_end = excluded.cancel_at_period_end,
      updated_at = now()`,
    [
      input.userId,
      input.email,
      input.stripeCustomerId,
      input.stripeSubscriptionId,
      input.status,
      input.planTier,
      input.currentPeriodEnd,
      input.cancelAtPeriodEnd
    ]
  );
}

export function getLeadsLimitForTier(tier: PlanTier) {
  const plan = planDefinitions.find((entry) => entry.tier === tier) ?? planDefinitions[0];
  const match = plan.monthlyLeadLimit.match(/\d+/);
  return match ? Number(match[0]) : 999999;
}

export function getEffectivePlanTier(subscription: BillingSubscription | null, fallbackTier: PlanTier = "free"): PlanTier {
  if (!subscription) {
    return fallbackTier;
  }

  if (subscription.status === "active") {
    return subscription.planTier;
  }

  return "free";
}

export function isBillingConfigured() {
  return (
    Boolean(env.stripeSecretKey) &&
    Boolean(env.stripePublishableKey) &&
    Boolean(env.stripeWebhookSecret) &&
    Boolean(env.stripeStarterPriceId) &&
    Boolean(env.stripeProPriceId) &&
    Boolean(env.stripeAgencyPriceId)
  );
}

function normalizeStripeStatus(status: Stripe.Subscription.Status): string {
  if (status === "active" || status === "trialing") {
    return "active";
  }

  if (status === "past_due" || status === "unpaid") {
    return "past_due";
  }

  return status;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const linePeriodEnd = subscription.items.data[0]?.current_period_end;
  return typeof linePeriodEnd === "number" ? new Date(linePeriodEnd * 1000).toISOString() : null;
}
