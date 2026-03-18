import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { createPortalSession } from "@/services/billingService";

export async function POST(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer.user) {
    return NextResponse.json({ error: "You must be signed in to manage billing." }, { status: 401 });
  }

  try {
    const session = await createPortalSession({
      userId: viewer.user.id,
      returnUrl: `${request.nextUrl.origin}/settings`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open the billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
