import { NextRequest, NextResponse } from "next/server";
import { getViewerFresh } from "@/lib/auth";
import { ScanConfigurationError, ScanExecutionError, ScanQueryError } from "@/lib/scanErrors";
import { logAppEvent } from "@/services/indexedLeadRepository";
import { runLeadScan } from "@/services/scanningService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const viewer = await getViewerFresh();
  if (!viewer.user) {
    return NextResponse.json({ error: "You must be signed in to create a scan session." }, { status: 401 });
  }
  const location = searchParams.get("location") ?? "";
  const niche = searchParams.get("niche") ?? "";
  const radius = Number(searchParams.get("radius") ?? "25");
  const minimumReviewCount = Number(searchParams.get("minimumReviewCount") ?? "0");
  const websiteStatus = (searchParams.get("websiteStatus") as "any" | "has-website" | "no-website" | null) ?? "any";
  const businessSize =
    (searchParams.get("businessSize") as "any" | "solo" | "small-team" | "multi-location" | null) ?? "any";
  const mode = (searchParams.get("mode") as "auto" | "indexed" | "live" | "demo" | null) ?? "auto";

  try {
    const result = await runLeadScan({
      location,
      niche,
      radius,
      minimumReviewCount,
      websiteStatus,
      businessSize,
      mode,
      userId: viewer.user.id,
      planTier: viewer.subscription.tier
    });

    await logAppEvent({
      scope: "scan",
      level: "info",
      message: "Scan session created.",
      userId: viewer.user.id,
      metadata: {
        sessionId: result.id,
        mode: result.mode,
        location,
        niche,
        leadCount: result.leads.length
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    const status =
      error instanceof ScanQueryError ? 400 : error instanceof ScanConfigurationError ? 503 : error instanceof ScanExecutionError ? 422 : 502;
    const message =
      error instanceof ScanQueryError || error instanceof ScanConfigurationError || error instanceof ScanExecutionError
        ? error.message
        : "The scan request failed.";

    await logAppEvent({
      scope: "scan",
      level: "error",
      message,
      userId: viewer.user.id,
      metadata: {
        location,
        niche,
        mode
      }
    });

    return NextResponse.json({ error: message }, { status });
  }
}
