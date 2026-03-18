import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { createCheckoutSession } from "@/services/billingService";

export async function POST(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.user) {
    return NextResponse.json({ error: "You must be signed in to start checkout." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { planTier?: "pro" | "agency" };
    if (body.planTier !== "pro" && body.planTier !== "agency") {
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

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
