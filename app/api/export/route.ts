import { NextRequest } from "next/server";
import { getViewerFresh } from "@/lib/auth";
import { leadsToCsv } from "@/services/scanningService";
import { createExportHistory, getPersistedScanSession, logAppEvent } from "@/services/indexedLeadRepository";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const viewer = await getViewerFresh();
  const sessionId = searchParams.get("sessionId");

  try {
    if (!viewer.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!sessionId) {
      return new Response("sessionId is required.", { status: 400 });
    }

    const result = await getPersistedScanSession(sessionId, viewer.user.id);

    if (!result) {
      return new Response("The export session could not be found.", { status: 404 });
    }

    await createExportHistory({
      userId: viewer.user.id,
      scanSessionId: result.id,
      name: `${result.location} ${result.niche}`,
      leadCount: result.leads.length,
      leadIds: result.leads.map((lead) => lead.id)
    });

    await logAppEvent({
      scope: "export",
      level: "info",
      message: "Full session export created.",
      userId: viewer.user.id,
      metadata: {
        sessionId: result.id,
        leadCount: result.leads.length
      }
    });

    return new Response(leadsToCsv(result.leads), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${result.location}-${result.niche}-leads.csv"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The export request failed.";

    await logAppEvent({
      scope: "export",
      level: "error",
      message,
      userId: viewer.user?.id ?? null,
      metadata: {
        sessionId
      }
    });

    return new Response(message, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const viewer = await getViewerFresh();

  try {
    if (!viewer.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = (await request.json()) as {
      sessionId?: string;
      leadIds?: string[];
    };

    if (!body.sessionId) {
      return new Response("sessionId is required.", { status: 400 });
    }

    if (!body.leadIds?.length) {
      return new Response("At least one leadId is required.", { status: 400 });
    }

    const session = await getPersistedScanSession(body.sessionId, viewer.user.id);
    if (!session) {
      return new Response("The export session could not be found.", { status: 404 });
    }

    const leadIdSet = new Set(body.leadIds);
    const leads = session.leads.filter((lead) => leadIdSet.has(lead.id));
    if (!leads.length) {
      return new Response("No matching leads were found in this persisted session.", { status: 404 });
    }

    await createExportHistory({
      userId: viewer.user.id,
      scanSessionId: session.id,
      name: `${session.location} ${session.niche} selected`,
      leadCount: leads.length,
      leadIds: leads.map((lead) => lead.id)
    });

    await logAppEvent({
      scope: "export",
      level: "info",
      message: "Selected lead export created.",
      userId: viewer.user.id,
      metadata: {
        sessionId: session.id,
        leadCount: leads.length
      }
    });

    return new Response(leadsToCsv(leads), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${session.location}-${session.niche}-selected-leads.csv"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The export request failed.";

    await logAppEvent({
      scope: "export",
      level: "error",
      message,
      userId: viewer.user?.id ?? null
    });

    return new Response(message, { status: 500 });
  }
}
