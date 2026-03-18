import { NextRequest, NextResponse } from "next/server";
import { getViewerFresh } from "@/lib/auth";
import { Lead } from "@/lib/types";
import {
  getIndexedLeadById,
  getPersistedScanSession,
  listSavedLeads,
  logAppEvent,
  removeSavedLead,
  upsertSavedLead
} from "@/services/indexedLeadRepository";

export async function GET() {
  const viewer = await getViewerFresh();
  if (!viewer.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const saved = await listSavedLeads(viewer.user.id);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load saved leads.";
    await logAppEvent({ scope: "saved_leads", level: "error", message, userId: viewer.user.id });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const viewer = await getViewerFresh();
  if (!viewer.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      leadId?: string;
      sessionId?: string;
      notes?: string;
      status?: Lead["status"];
    };

    if (!body.leadId) {
      return NextResponse.json({ error: "leadId is required." }, { status: 400 });
    }

    const sessionLead = body.sessionId
      ? (await getPersistedScanSession(body.sessionId, viewer.user.id))?.leads.find((entry) => entry.id === body.leadId) ?? null
      : null;
    const indexedLead = !sessionLead ? await getIndexedLeadById(body.leadId) : null;
    const lead = sessionLead ?? indexedLead;

    if (!lead) {
      return NextResponse.json({ error: "Lead could not be resolved from the persisted session or indexed store." }, { status: 404 });
    }

    const saved = await upsertSavedLead({
      userId: viewer.user.id,
      lead,
      notes: body.notes,
      status: body.status
    });
    await logAppEvent({
      scope: "saved_leads",
      level: "info",
      message: "Lead saved successfully.",
      userId: viewer.user.id,
      metadata: {
        leadId: saved.leadId,
        sessionId: body.sessionId ?? null
      }
    });
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save lead.";
    await logAppEvent({ scope: "saved_leads", level: "error", message, userId: viewer.user.id });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const viewer = await getViewerFresh();
  if (!viewer.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    if (!leadId) {
      return NextResponse.json({ error: "leadId is required." }, { status: 400 });
    }

    await removeSavedLead(viewer.user.id, leadId);
    await logAppEvent({
      scope: "saved_leads",
      level: "info",
      message: "Lead removed from saved list.",
      userId: viewer.user.id,
      metadata: { leadId }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove saved lead.";
    await logAppEvent({ scope: "saved_leads", level: "error", message, userId: viewer.user.id });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
