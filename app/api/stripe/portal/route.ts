import { NextRequest, NextResponse } from "next/server";
import { getViewerFresh } from "@/lib/auth";
import { logAppEvent } from "@/services/indexedLeadRepository";
import { createPortalSession } from "@/services/billingService";

export async function POST(request: NextRequest) {
  const viewer = await getViewerFresh();
  if (!viewer.user) {
    return NextResponse.json({ error: "You must be signed in to manage billing." }, { status: 401 });
  }

  try {
    const session = await createPortalSession({
      userId: viewer.user.id,
      returnUrl: `${request.nextUrl.origin}/settings`
    });

    await logAppEvent({
      scope: "stripe_portal",
      level: "info",
      message: "Stripe billing portal session created.",
      userId: viewer.user.id
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open the billing portal.";
    await logAppEvent({
      scope: "stripe_portal",
      level: "error",
      message,
      userId: viewer.user.id
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
