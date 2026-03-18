import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { ScanConfigurationError, ScanExecutionError, ScanQueryError } from "@/lib/scanErrors";
import { runLeadScan } from "@/services/scanningService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const viewer = await getViewer();
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
      userId: viewer.user?.id ?? null,
      planTier: viewer.subscription.tier
    });

    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ScanQueryError ? 400 : error instanceof ScanConfigurationError ? 503 : 502;
    const message =
      error instanceof ScanQueryError || error instanceof ScanConfigurationError || error instanceof ScanExecutionError
        ? error.message
        : "The scan request failed.";

    return NextResponse.json({ error: message }, { status });
  }
}
