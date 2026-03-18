import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { logAppEvent } from "@/services/indexedLeadRepository";
import { markInvoiceFailed, markInvoicePaid, syncSubscriptionFromStripe } from "@/services/billingService";

export async function POST(request: Request) {
  if (!env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 500 });
  }

  const stripe = getStripe();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature header." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook verification failed.";
    await logAppEvent({
      scope: "stripe_webhook",
      level: "error",
      message,
      metadata: { stage: "verify" }
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionFromStripe({ subscription });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripe({ subscription });
        break;
      }
      case "invoice.paid": {
        await markInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      }
      case "invoice.payment_failed": {
        await markInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      }
      default:
        break;
    }

    await logAppEvent({
      scope: "stripe_webhook",
      level: "info",
      message: "Stripe webhook processed successfully.",
      metadata: { eventType: event.type }
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    await logAppEvent({
      scope: "stripe_webhook",
      level: "error",
      message,
      metadata: { eventType: event.type }
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
