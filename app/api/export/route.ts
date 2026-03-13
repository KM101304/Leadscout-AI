import { NextRequest } from "next/server";
import { ScanConfigurationError, ScanExecutionError, ScanQueryError } from "@/lib/scanErrors";
import { leadsToCsv, runLeadScan } from "@/services/scanningService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") ?? "";
  const niche = searchParams.get("niche") ?? "";
  const radius = Number(searchParams.get("radius") ?? "25");
  const minimumReviewCount = Number(searchParams.get("minimumReviewCount") ?? "0");
  const websiteStatus = (searchParams.get("websiteStatus") as "any" | "has-website" | "no-website" | null) ?? "any";
  const businessSize =
    (searchParams.get("businessSize") as "any" | "solo" | "small-team" | "multi-location" | null) ?? "any";

  try {
    const result = await runLeadScan({
      location,
      niche,
      radius,
      minimumReviewCount,
      websiteStatus,
      businessSize
    });

    return new Response(leadsToCsv(result.leads), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${result.query.location}-${result.query.niche}-leads.csv"`
      }
    });
  } catch (error) {
    const status = error instanceof ScanQueryError ? 400 : error instanceof ScanConfigurationError ? 503 : 502;
    const message =
      error instanceof ScanQueryError || error instanceof ScanConfigurationError || error instanceof ScanExecutionError
        ? error.message
        : "The export request failed.";

    return new Response(message, { status });
  }
}
