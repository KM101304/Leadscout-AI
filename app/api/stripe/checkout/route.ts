import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { logAppEvent } from "@/services/indexedLeadRepository";
import { createCheckoutSession } from "@/services/billingService";

export async function POST(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.user) {
    return NextResponse.json({ error: "You must be signed in to start checkout." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { planTier?: "starter" | "pro" | "agency" };
    if (body.planTier !== "starter" && body.planTier !== "pro" && body.planTier !== "agency") {
      return NextResponse.json({ error: "A paid plan is required for checkout." }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const session = await createCheckoutSession({
      userId: viewer.user.id,
      email: viewer.user.email ?? null,
      planTier: body.planTier,
      successUrl: `${origin}/pricing?checkout=success`,
      cancelUrl: `${origin}/pricing?checkout=cancelled`
    });

    await logAppEvent({
      scope: "stripe_checkout",
      level: "info",
      message: "Stripe checkout session created.",
      userId: viewer.user.id,
      metadata: {
        planTier: body.planTier
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    await logAppEvent({
      scope: "stripe_checkout",
      level: "error",
      message,
      userId: viewer.user.id
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
