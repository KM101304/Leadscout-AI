import { NextRequest, NextResponse } from "next/server";
import { runLeadScan } from "@/services/scanningService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") ?? "Vancouver";
  const niche = searchParams.get("niche") ?? "dentists";
  const radius = Number(searchParams.get("radius") ?? "25");
  const minimumReviewCount = Number(searchParams.get("minimumReviewCount") ?? "0");
  const websiteStatus = (searchParams.get("websiteStatus") as "any" | "has-website" | "no-website" | null) ?? "any";
  const businessSize =
    (searchParams.get("businessSize") as "any" | "solo" | "small-team" | "multi-location" | null) ?? "any";

  const result = await runLeadScan({
    location,
    niche,
    radius,
    minimumReviewCount,
    websiteStatus,
    businessSize
  });

  return NextResponse.json(result);
}
