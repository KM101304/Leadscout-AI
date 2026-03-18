import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import type { PlanTier } from "@/lib/plans";
import {
  AppEventLog,
  ExportHistoryRecord,
  IndexedLeadRecord,
  IssueType,
  Lead,
  SavedLeadRecord,
  ScanMode,
  ScanSession,
  ScanQuery
} from "@/lib/types";
import { slugify } from "@/lib/utils";

interface UsageLogRecord {
  id: string;
  userId: string | null;
  tier: string;
  mode: ScanMode;
  queryKey: string;
  estimatedCostUsd: number;
  leadCount: number;
  createdAt: string;
}

interface IndexedStore {
  leads: IndexedLeadRecord[];
  usageLogs: UsageLogRecord[];
  scanSessions: ScanSession[];
  savedLeads: SavedLeadRecord[];
  exportHistory: ExportHistoryRecord[];
}

const defaultStore: IndexedStore = {
  leads: [],
  usageLogs: [],
  scanSessions: [],
  savedLeads: [],
  exportHistory: []
};

export async function queryIndexedLeads(query: ScanQuery) {
  if (hasDatabase()) {
    try {
      return await queryIndexedLeadsFromDb(query);
    } catch (error) {
      console.warn("[indexed_leads] Falling back to local store for queryIndexedLeads.", error);
    }
  }

  if (hasSupabaseRestAdmin()) {
    try {
      return await queryIndexedLeadsViaRest(query);
    } catch (error) {
      console.warn("[indexed_leads] Supabase REST fallback failed for queryIndexedLeads.", error);
    }
  }

  const store = await readStore();
  const marketKey = buildMarketKey(query);
  const results = applyIndexedFilters(store.leads, query);
  const mostRecent = results.reduce<string | null>((current, lead) => {
    if (!current || lead.lastScannedAt > current) {
      return lead.lastScannedAt;
    }
    return current;
  }, null);

  return {
    leads: results,
    marketKey,
    lastScannedAt: mostRecent,
    coverageCount: results.length
  };
}

export async function upsertIndexedLeads(leads: IndexedLeadRecord[]) {
  if (!leads.length) {
    return;
  }

  if (hasDatabase()) {
    try {
      const db = getDb();
      for (const lead of leads) {
        await db.query(
          `insert into indexed_leads (
            id, business_name, niche, city, region, location, country, address, phone, website, rating,
            review_count, lat, lng, place_source, website_status, issue_tags, opportunity_score, opportunity_type,
            recommended_pitch_angle, analysis_summary, source_mode, confidence, signals, last_scanned_at, created_at, updated_at
          ) values (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
            $12,$13,$14,$15,$16,$17,$18,$19,
            $20,$21,$22,$23,$24::jsonb,$25,$26,$27
          )
          on conflict (id) do update set
            business_name = excluded.business_name,
            niche = excluded.niche,
            city = excluded.city,
            region = excluded.region,
            location = excluded.location,
            country = excluded.country,
            address = excluded.address,
            phone = excluded.phone,
            website = excluded.website,
            rating = excluded.rating,
            review_count = excluded.review_count,
            lat = excluded.lat,
            lng = excluded.lng,
            place_source = excluded.place_source,
            website_status = excluded.website_status,
            issue_tags = excluded.issue_tags,
            opportunity_score = excluded.opportunity_score,
            opportunity_type = excluded.opportunity_type,
            recommended_pitch_angle = excluded.recommended_pitch_angle,
            analysis_summary = excluded.analysis_summary,
            source_mode = excluded.source_mode,
            confidence = excluded.confidence,
            signals = excluded.signals,
            last_scanned_at = excluded.last_scanned_at,
            updated_at = excluded.updated_at`,
          [
            lead.id,
            lead.businessName,
            lead.niche,
            lead.city,
            lead.region,
            lead.location,
            lead.country,
            lead.address,
            lead.phone,
            lead.website,
            lead.rating,
            lead.reviewCount,
            lead.coordinates.latitude,
            lead.coordinates.longitude,
            lead.placeSource,
            lead.websiteStatus,
            lead.issueTags,
            lead.opportunityScore,
            lead.opportunityType,
            lead.recommendedPitchAngle,
            lead.analysisSummary,
            lead.sourceMode,
            lead.confidence,
            JSON.stringify(lead.signals),
            lead.lastScannedAt,
            lead.createdAt,
            lead.updatedAt
          ]
        );
      }
      return;
    } catch (error) {
      console.warn("[indexed_leads] Falling back to local store for upsertIndexedLeads.", error);
    }
  }

  const store = await readStore();
  const existing = new Map(store.leads.map((lead) => [lead.id, lead]));
  leads.forEach((lead) => existing.set(lead.id, lead));
  store.leads = [...existing.values()].sort((a, b) => a.businessName.localeCompare(b.businessName));
  await writeStore(store);
}

export async function logUsage(input: Omit<UsageLogRecord, "id" | "createdAt">) {
  if (hasDatabase()) {
    try {
      await insertUsageLog(input);
      return;
    } catch (error) {
      console.warn("[scan_usage_logs] Falling back to local store for logUsage.", error);
    }
  }

  if (hasSupabaseRestAdmin()) {
    try {
      await insertUsageLogViaRest(input);
      return;
    } catch (error) {
      console.warn("[scan_usage_logs] Supabase REST fallback failed for logUsage.", error);
    }
  }

  await appendUsageLogToStore(input);
}

export async function countMonthlyUsage(userId: string | null, mode: ScanMode) {
  if (hasDatabase()) {
    try {
      const db = getDb();
      const result = await db.query<{ count: string }>(
        `select count(*)::text as count
         from scan_usage_logs
         where user_id is not distinct from $1
           and mode = $2
           and created_at >= date_trunc('month', now())`,
        [userId, mode]
      );
      return Number(result.rows[0]?.count ?? 0);
    } catch (error) {
      console.warn("[scan_usage_logs] Falling back to local store for countMonthlyUsage.", error);
    }
  }

  const store = await readStore();
  const monthPrefix = new Date().toISOString().slice(0, 7);
  return store.usageLogs.filter((log) => log.userId === userId && log.mode === mode && log.createdAt.startsWith(monthPrefix)).length;
}

export async function countMonthlyLeadUsage(userId: string | null) {
  if (!userId) {
    return 0;
  }

  if (hasDatabase()) {
    try {
      const db = getDb();
      const result = await db.query<{ lead_count: string }>(
        `select coalesce(sum(lead_count), 0)::text as lead_count
         from scan_usage_logs
         where user_id = $1
           and created_at >= date_trunc('month', now())`,
        [userId]
      );
      return Number(result.rows[0]?.lead_count ?? 0);
    } catch (error) {
      if (isMissingColumnError(error, "lead_count")) {
        return 0;
      }
      console.warn("[scan_usage_logs] Falling back to local store for countMonthlyLeadUsage.", error);
    }
  }

  const store = await readStore();
  const monthPrefix = new Date().toISOString().slice(0, 7);
  return store.usageLogs
    .filter((log) => log.userId === userId && log.createdAt.startsWith(monthPrefix))
    .reduce((sum, log) => sum + (log.leadCount ?? 0), 0);
}

export async function persistScanSession(session: ScanSession) {
  if (!hasDatabase()) {
    if (hasSupabaseRestAdmin()) {
      try {
        const restResult = await insertScanSessionViaRest(session);
        return {
          ...session,
          id: restResult.id,
          createdAt: restResult.createdAt,
          updatedAt: restResult.updatedAt
        };
      } catch (error) {
        console.warn("[scan_sessions] Supabase REST fallback failed for persistScanSession.", error);
      }
    }

    await persistScanSessionToStore(session);
    return session;
  }

  try {
    const result = await insertScanSession(session);

    return {
      ...session,
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
  } catch (error) {
    console.warn("[scan_sessions] Falling back to local store for persistScanSession.", error);

    if (hasSupabaseRestAdmin()) {
      try {
        const restResult = await insertScanSessionViaRest(session);
        return {
          ...session,
          id: restResult.id,
          createdAt: restResult.createdAt,
          updatedAt: restResult.updatedAt
        };
      } catch (restError) {
        console.warn("[scan_sessions] Supabase REST fallback failed for persistScanSession.", restError);
      }
    }

    await persistScanSessionToStore(session);
    return session;
  }
}

export async function ensureLegacyUserRecord(input: {
  userId: string;
  email: string | null;
  planTier: PlanTier;
}) {
  if (hasDatabase()) {
    try {
      const db = getDb();
      await db.query(
        `insert into users (id, email, plan_tier)
         values ($1, $2, $3)
         on conflict (id) do update set
           email = excluded.email,
           plan_tier = excluded.plan_tier`,
        [input.userId, input.email ?? `${input.userId}@leadscout.local`, input.planTier]
      );
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (!message.includes('relation "users" does not exist') && !message.includes("column") && !message.includes("schema cache")) {
        console.warn("[users] Unable to ensure legacy public.users record.", error);
      }
    }
  }

  if (hasSupabaseRestAdmin()) {
    try {
      await ensureLegacyUserRecordViaRest(input);
    } catch (error) {
      console.warn("[users] Supabase REST fallback failed for legacy public.users record.", error);
    }
  }
}

export async function getPersistedScanSession(sessionId: string, userId: string | null) {
  if (!hasDatabase()) {
    if (hasSupabaseRestAdmin()) {
      try {
        return await selectPersistedScanSessionViaRest(sessionId, userId);
      } catch (error) {
        console.warn("[scan_sessions] Supabase REST fallback failed for getPersistedScanSession.", error);
      }
    }

    const store = await readStore();
    return store.scanSessions.find((session) => session.id === sessionId && session.userId === userId) ?? null;
  }

  try {
    const result = await selectPersistedScanSession(sessionId, userId);
    if (!result) {
      return null;
    }

    if (result.kind === "current") {
      return mapScanSessionRow(result.row);
    }

    const leads = await selectLegacySessionLeads(sessionId);
    return mapLegacyScanSessionRow(result.row, leads);
  } catch (error) {
    console.warn("[scan_sessions] Falling back to local store for getPersistedScanSession.", error);

    if (hasSupabaseRestAdmin()) {
      try {
        return await selectPersistedScanSessionViaRest(sessionId, userId);
      } catch (restError) {
        console.warn("[scan_sessions] Supabase REST fallback failed for getPersistedScanSession.", restError);
      }
    }

    const store = await readStore();
    return store.scanSessions.find((session) => session.id === sessionId && session.userId === userId) ?? null;
  }
}

type PersistedScanSessionRow = {
  id: string;
  plan_tier?: ScanSession["planTier"] | null;
  mode: ScanMode;
  access_tier: "free" | "premium";
  user_id: string | null;
  niche: string;
  location: string;
  radius: number;
  filters: Record<string, unknown>;
  query_string: string;
  source_summary: ScanSession["sourceSummary"];
  summary: ScanSession["summary"];
  issue_counts: ScanSession["issueCounts"];
  pitch_context: ScanSession["pitchContext"];
  leads_json: Lead[];
  map_markers_json: ScanSession["mapMarkers"];
  usage: ScanSession["usage"];
  created_at: string;
  updated_at: string;
};

type LegacyPersistedScanSessionRow = Omit<PersistedScanSessionRow, "plan_tier" | "leads_json" | "map_markers_json"> & {
  usage?: ScanSession["usage"] | null;
};

function mapScanSessionRow(row: PersistedScanSessionRow): ScanSession {
  return {
    id: row.id,
    mode: row.mode,
    accessTier: row.access_tier,
    planTier: (row.plan_tier as ScanSession["planTier"]) ?? "free",
    userId: row.user_id,
    niche: row.niche,
    location: row.location,
    radius: row.radius,
    filters: row.filters as ScanSession["filters"],
    queryString: row.query_string,
    query: {
      location: row.location,
      niche: row.niche,
      radius: row.radius,
      minimumReviewCount: Number((row.filters?.minimumReviewCount as number | undefined) ?? 0),
      websiteStatus: ((row.filters?.websiteStatus as ScanSession["filters"]["websiteStatus"]) ?? "any"),
      businessSize: ((row.filters?.businessSize as ScanSession["filters"]["businessSize"]) ?? "any"),
      mode: row.mode,
      userId: row.user_id,
      planTier: ((row.plan_tier as ScanSession["planTier"]) ?? "free"),
      queryString: row.query_string
    },
    sourceSummary: row.source_summary,
    leads: row.leads_json,
    summary: row.summary,
    issueCounts: row.issue_counts,
    pitchContext: row.pitch_context,
    mapMarkers: row.map_markers_json,
    isEmpty: row.leads_json.length === 0,
    usage: row.usage,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  } satisfies ScanSession;
}

function mapLegacyScanSessionRow(row: LegacyPersistedScanSessionRow, leads: Lead[]): ScanSession {
  const mapMarkers = leads
    .filter((lead) => Number.isFinite(lead.coordinates.latitude) && Number.isFinite(lead.coordinates.longitude))
    .map((lead) => ({
      id: lead.id,
      businessName: lead.businessName,
      latitude: lead.coordinates.latitude,
      longitude: lead.coordinates.longitude,
      score: lead.leadScore,
      sourceMode: lead.sourceMode
    }));

  return {
    id: row.id,
    mode: row.mode,
    accessTier: row.access_tier,
    planTier: "free",
    userId: row.user_id,
    niche: row.niche,
    location: row.location,
    radius: row.radius,
    filters: row.filters as ScanSession["filters"],
    queryString: row.query_string,
    query: {
      location: row.location,
      niche: row.niche,
      radius: row.radius,
      minimumReviewCount: Number((row.filters?.minimumReviewCount as number | undefined) ?? 0),
      websiteStatus: ((row.filters?.websiteStatus as ScanSession["filters"]["websiteStatus"]) ?? "any"),
      businessSize: ((row.filters?.businessSize as ScanSession["filters"]["businessSize"]) ?? "any"),
      mode: row.mode,
      userId: row.user_id,
      planTier: "free",
      queryString: row.query_string
    },
    sourceSummary: row.source_summary,
    leads,
    summary: row.summary,
    issueCounts: row.issue_counts,
    pitchContext: row.pitch_context,
    mapMarkers,
    isEmpty: leads.length === 0,
    usage: row.usage ?? { liveScansThisMonth: 0, liveScanLimit: 0 },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  } satisfies ScanSession;
}

export async function getSavedLeadIds(userId: string | null) {
  if (!userId || !hasDatabase()) {
    if (!userId) {
      return new Set<string>();
    }

    const store = await readStore();
    return new Set(store.savedLeads.filter((entry) => entry.userId === userId).map((entry) => entry.leadId));
  }

  try {
    const db = getDb();
    const result = await db.query<{ lead_id: string }>(
      `select lead_id from saved_leads where user_id = $1`,
      [userId]
    );
    return new Set(result.rows.map((row) => row.lead_id));
  } catch (error) {
    console.warn("[saved_leads] Falling back to local store for getSavedLeadIds.", error);
    const store = await readStore();
    return new Set(store.savedLeads.filter((entry) => entry.userId === userId).map((entry) => entry.leadId));
  }
}

export async function upsertSavedLead(input: {
  userId: string;
  lead: Lead;
  notes?: string;
  status?: Lead["status"];
}) {
  await upsertIndexedLeads([leadToIndexedRecord(input.lead)]);

  const record = {
    id: "",
    userId: input.userId,
    leadId: input.lead.id,
    notes: input.notes ?? input.lead.notes ?? "",
    status: input.status ?? input.lead.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lead: {
      ...input.lead,
      isSaved: true,
      notes: input.notes ?? input.lead.notes ?? "",
      status: input.status ?? input.lead.status
    }
  } satisfies SavedLeadRecord;

  if (!hasDatabase()) {
    const store = await readStore();
    const existing = store.savedLeads.find((entry) => entry.userId === input.userId && entry.leadId === input.lead.id);
    const nextRecord = {
      ...record,
      id: existing?.id ?? `saved-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: existing?.createdAt ?? record.createdAt
    };
    store.savedLeads = [
      nextRecord,
      ...store.savedLeads.filter((entry) => !(entry.userId === input.userId && entry.leadId === input.lead.id))
    ];
    await writeStore(store);
    return nextRecord;
  }

  try {
    const db = getDb();
    const result = await db.query<{ id: string; created_at: string; updated_at: string }>(
      `insert into saved_leads (user_id, lead_id, notes, status)
       values ($1, $2, $3, $4)
       on conflict (user_id, lead_id) do update set
         notes = excluded.notes,
         status = excluded.status,
         updated_at = now()
       returning id, created_at, updated_at`,
      [input.userId, input.lead.id, record.notes, record.status]
    );

    return {
      ...record,
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
  } catch (error) {
    console.warn("[saved_leads] Falling back to local store for upsertSavedLead.", error);
    const store = await readStore();
    const existing = store.savedLeads.find((entry) => entry.userId === input.userId && entry.leadId === input.lead.id);
    const nextRecord = {
      ...record,
      id: existing?.id ?? `saved-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: existing?.createdAt ?? record.createdAt
    };
    store.savedLeads = [
      nextRecord,
      ...store.savedLeads.filter((entry) => !(entry.userId === input.userId && entry.leadId === input.lead.id))
    ];
    await writeStore(store);
    return nextRecord;
  }
}

export async function removeSavedLead(userId: string, leadId: string) {
  if (!hasDatabase()) {
    const store = await readStore();
    store.savedLeads = store.savedLeads.filter((entry) => !(entry.userId === userId && entry.leadId === leadId));
    await writeStore(store);
    return;
  }

  try {
    const db = getDb();
    await db.query(`delete from saved_leads where user_id = $1 and lead_id = $2`, [userId, leadId]);
  } catch (error) {
    console.warn("[saved_leads] Falling back to local store for removeSavedLead.", error);
    const store = await readStore();
    store.savedLeads = store.savedLeads.filter((entry) => !(entry.userId === userId && entry.leadId === leadId));
    await writeStore(store);
  }
}

export async function listSavedLeads(userId: string) {
  if (!hasDatabase()) {
    const store = await readStore();
    return store.savedLeads
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  try {
    const db = getDb();
    const result = await db.query<{
      id: string;
      user_id: string;
      lead_id: string;
      notes: string;
      status: Lead["status"];
      created_at: string;
      updated_at: string;
      business_name: string;
      niche: string;
      city: string | null;
      region: string | null;
      phone: string | null;
      website: string | null;
      address: string | null;
      rating: number;
      location: string;
      review_count: number;
      place_source: string;
      website_status: Lead["websiteStatus"];
      issue_tags: IssueType[];
      opportunity_score: number;
      opportunity_type: Lead["opportunityType"];
      recommended_pitch_angle: string;
      analysis_summary: string;
      source_mode: ScanMode;
      confidence: number;
      signals: Lead["signals"];
      last_scanned_at: string;
      lat: number | null;
      lng: number | null;
    }>(
      `select
        s.id, s.user_id, s.lead_id, s.notes, s.status, s.created_at, s.updated_at,
        l.business_name, l.niche, l.city, l.region, l.phone, l.website, l.address, l.rating,
        l.location, l.review_count, l.place_source, l.website_status, l.issue_tags,
        l.opportunity_score, l.opportunity_type, l.recommended_pitch_angle, l.analysis_summary,
        l.source_mode, l.confidence, l.signals, l.last_scanned_at, l.lat, l.lng
       from saved_leads s
       join indexed_leads l on l.id = s.lead_id
       where s.user_id = $1
       order by s.updated_at desc`,
      [userId]
    );

    return result.rows.map((row) => {
      const lead = rowToLead(row);
      lead.notes = row.notes;
      lead.status = row.status;
      lead.isSaved = true;

      return {
        id: row.id,
        userId: row.user_id,
        leadId: row.lead_id,
        notes: row.notes,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lead
      } satisfies SavedLeadRecord;
    });
  } catch (error) {
    console.warn("[saved_leads] Falling back to local store for listSavedLeads.", error);
    const store = await readStore();
    return store.savedLeads
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export async function createExportHistory(input: {
  userId: string;
  scanSessionId: string;
  name: string;
  leadCount: number;
  leadIds: string[];
}) {
  if (!hasDatabase()) {
    const store = await readStore();
    const record = {
      id: `export-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      userId: input.userId,
      scanSessionId: input.scanSessionId,
      name: input.name,
      exportType: "csv" as const,
      leadCount: input.leadCount,
      leadIds: input.leadIds,
      status: "ready" as const,
      createdAt: new Date().toISOString()
    } satisfies ExportHistoryRecord;
    store.exportHistory = [record, ...store.exportHistory];
    await writeStore(store);
    return record;
  }

  try {
    const db = getDb();
    const result = await db.query<{
      id: string;
      user_id: string;
      scan_session_id: string;
      name: string;
      export_type: "csv";
      lead_count: number;
      lead_ids: string[];
      status: "ready" | "queued" | "failed";
      created_at: string;
    }>(
      `insert into export_history (user_id, scan_session_id, name, lead_count, lead_ids, status)
       values ($1, $2, $3, $4, $5::jsonb, 'ready')
       returning id, user_id, scan_session_id, name, export_type, lead_count, lead_ids, status, created_at`,
      [input.userId, input.scanSessionId, input.name, input.leadCount, JSON.stringify(input.leadIds)]
    );

    return rowToExportHistory(result.rows[0]);
  } catch (error) {
    console.warn("[export_history] Falling back to local store for createExportHistory.", error);
    const store = await readStore();
    const record = {
      id: `export-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      userId: input.userId,
      scanSessionId: input.scanSessionId,
      name: input.name,
      exportType: "csv" as const,
      leadCount: input.leadCount,
      leadIds: input.leadIds,
      status: "ready" as const,
      createdAt: new Date().toISOString()
    } satisfies ExportHistoryRecord;
    store.exportHistory = [record, ...store.exportHistory];
    await writeStore(store);
    return record;
  }
}

export async function listExportHistory(userId: string) {
  if (!hasDatabase()) {
    const store = await readStore();
    return store.exportHistory
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  try {
    const db = getDb();
    const result = await db.query<{
      id: string;
      user_id: string;
      scan_session_id: string;
      name: string;
      export_type: "csv";
      lead_count: number;
      lead_ids: string[];
      status: "ready" | "queued" | "failed";
      created_at: string;
    }>(
      `select id, user_id, scan_session_id, name, export_type, lead_count, lead_ids, status, created_at
       from export_history
       where user_id = $1
       order by created_at desc`,
      [userId]
    );

    return result.rows.map(rowToExportHistory);
  } catch (error) {
    console.warn("[export_history] Falling back to local store for listExportHistory.", error);
    const store = await readStore();
    return store.exportHistory
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function logAppEvent(input: {
  scope: string;
  level: AppEventLog["level"];
  message: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!hasDatabase()) {
    const logger = input.level === "error" ? console.error : input.level === "warning" ? console.warn : console.log;
    logger(`[${input.scope}] ${input.message}`, input.metadata ?? {});
    return;
  }

  try {
    const db = getDb();
    await db.query(
      `insert into app_event_logs (scope, level, message, user_id, metadata)
       values ($1, $2, $3, $4, $5::jsonb)`,
      [input.scope, input.level, input.message, input.userId ?? null, JSON.stringify(input.metadata ?? {})]
    );
  } catch (error) {
    const logger = input.level === "error" ? console.error : input.level === "warning" ? console.warn : console.log;
    logger(`[${input.scope}] ${input.message}`, { metadata: input.metadata ?? {}, error });
  }
}

export function deriveIssueCounts(leads: Array<{ issueTags: IssueType[] }>) {
  const counts = {} as Partial<Record<IssueType, number>>;
  leads.forEach((lead) => {
    lead.issueTags.forEach((issue) => {
      counts[issue] = (counts[issue] ?? 0) + 1;
    });
  });
  return counts;
}

export async function getIndexedLeadById(leadId: string) {
  if (hasDatabase()) {
    try {
      const db = getDb();
      const result = await db.query<{
        id: string;
        business_name: string;
        niche: string;
        city: string | null;
        region: string | null;
        phone: string | null;
        website: string | null;
        address: string | null;
        rating: number;
        location: string;
        review_count: number;
        place_source: string;
        website_status: Lead["websiteStatus"];
        issue_tags: IssueType[];
        opportunity_score: number;
        opportunity_type: Lead["opportunityType"];
        recommended_pitch_angle: string;
        analysis_summary: string;
        source_mode: ScanMode;
        confidence: number;
        signals: Lead["signals"];
        last_scanned_at: string;
        lat: number | null;
        lng: number | null;
      }>(
        `select
          id, business_name, niche, city, region, phone, website, address, rating, location,
          review_count, place_source, website_status, issue_tags, opportunity_score, opportunity_type,
          recommended_pitch_angle, analysis_summary, source_mode, confidence, signals, last_scanned_at, lat, lng
         from indexed_leads
         where id = $1
         limit 1`,
        [leadId]
      );

      const row = result.rows[0];
      return row ? rowToLead(row) : null;
    } catch (error) {
      console.warn("[indexed_leads] Falling back to local store for getIndexedLeadById.", error);
    }
  }

  const store = await readStore();
  const row = store.leads.find((lead) => lead.id === leadId);
  return row ? mapIndexedRecordToLeadFallback(row) : null;
}

function hasDatabase() {
  return Boolean(env.supabaseDatabaseUrl);
}

function hasSupabaseRestAdmin() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

function getSupabaseRestHeaders(options?: {
  contentType?: boolean;
  returnRepresentation?: boolean;
  resolutionMergeDuplicates?: boolean;
}) {
  const headers = {
    apikey: env.supabaseServiceRoleKey,
    Authorization: `Bearer ${env.supabaseServiceRoleKey}`
  } as Record<string, string>;

  if (options?.contentType) {
    headers["Content-Type"] = "application/json";
  }

  const preferValues = [
    options?.returnRepresentation ? "return=representation" : "",
    options?.resolutionMergeDuplicates ? "resolution=merge-duplicates" : ""
  ].filter(Boolean);

  if (preferValues.length) {
    headers.Prefer = preferValues.join(",");
  }

  return headers;
}

async function queryIndexedLeadsFromDb(query: ScanQuery) {
  const db = getDb();
  const result = await db.query<{
    id: string;
    business_name: string;
    niche: string;
    city: string | null;
    region: string | null;
    location: string;
    country: string | null;
    address: string | null;
    phone: string | null;
    website: string | null;
    rating: number;
    review_count: number;
    lat: number | null;
    lng: number | null;
    place_source: string;
    website_status: "has-website" | "no-website" | "unknown";
    issue_tags: IssueType[];
    opportunity_score: number;
    opportunity_type: Lead["opportunityType"];
    recommended_pitch_angle: string;
    analysis_summary: string;
    source_mode: ScanMode;
    confidence: number;
    signals: Lead["signals"];
    last_scanned_at: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `select *
     from indexed_leads
     where lower(niche) = lower($1)
       and lower(location) = lower($2)
     order by opportunity_score desc`,
    [query.niche, query.location]
  );

  const leads = applyIndexedFilters(
    result.rows.map((row) => rowToIndexedLead(row)),
    query
  );

  const lastScannedAt = leads.reduce<string | null>((current, lead) => {
    if (!current || lead.lastScannedAt > current) {
      return lead.lastScannedAt;
    }
    return current;
  }, null);

  return {
    leads,
    marketKey: buildMarketKey(query),
    lastScannedAt,
    coverageCount: leads.length
  };
}

async function queryIndexedLeadsViaRest(query: ScanQuery) {
  const params = new URLSearchParams({
    select:
      "id,business_name,niche,city,region,location,country,address,phone,website,rating,review_count,lat,lng,place_source,website_status,issue_tags,opportunity_score,opportunity_type,recommended_pitch_angle,analysis_summary,source_mode,confidence,signals,last_scanned_at,created_at,updated_at",
    niche: `ilike.${query.niche}`,
    location: `ilike.${query.location}`,
    order: "opportunity_score.desc"
  });

  const response = await fetch(`${env.supabaseUrl}/rest/v1/indexed_leads?${params.toString()}`, {
    headers: getSupabaseRestHeaders()
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const rows = (await response.json()) as Array<Parameters<typeof rowToIndexedLead>[0]>;
  const leads = applyIndexedFilters(
    rows.map((row) => rowToIndexedLead(row)),
    query
  );
  const lastScannedAt = leads.reduce<string | null>((current, lead) => {
    if (!current || lead.lastScannedAt > current) {
      return lead.lastScannedAt;
    }
    return current;
  }, null);

  return {
    leads,
    marketKey: buildMarketKey(query),
    lastScannedAt,
    coverageCount: leads.length
  };
}

function applyIndexedFilters(leads: IndexedLeadRecord[], input: ScanQuery) {
  return leads
    .filter((lead) => buildMarketKey(lead) === buildMarketKey(input))
    .filter((lead) => {
      if (typeof input.minimumReviewCount === "number" && lead.reviewCount < input.minimumReviewCount) return false;
      if (input.websiteStatus === "has-website" && lead.websiteStatus !== "has-website") return false;
      if (input.websiteStatus === "no-website" && lead.websiteStatus !== "no-website") return false;
      if (input.businessSize === "solo" && lead.reviewCount > 40) return false;
      if (input.businessSize === "small-team" && (lead.reviewCount < 20 || lead.reviewCount > 120)) return false;
      if (input.businessSize === "multi-location" && lead.reviewCount < 80) return false;
      return true;
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

function rowToIndexedLead(row: {
  id: string;
  business_name: string;
  niche: string;
  city: string | null;
  region: string | null;
  location: string;
  country: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number;
  review_count: number;
  lat: number | null;
  lng: number | null;
  place_source: string;
  website_status: "has-website" | "no-website" | "unknown";
  issue_tags: IssueType[];
  opportunity_score: number;
  opportunity_type: Lead["opportunityType"];
  recommended_pitch_angle: string;
  analysis_summary: string;
  source_mode: ScanMode;
  confidence: number;
  signals: Lead["signals"];
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    businessName: row.business_name,
    niche: row.niche,
    city: row.city ?? row.location,
    region: row.region ?? "",
    location: row.location,
    country: row.country ?? "",
    address: row.address ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    coordinates: {
      latitude: Number(row.lat ?? 0),
      longitude: Number(row.lng ?? 0)
    },
    placeSource: row.place_source,
    websiteStatus: row.website_status,
    issueTags: row.issue_tags ?? [],
    opportunityScore: Number(row.opportunity_score ?? 0),
    opportunityType: row.opportunity_type,
    recommendedPitchAngle: row.recommended_pitch_angle,
    analysisSummary: row.analysis_summary,
    sourceMode: row.source_mode,
    confidence: Number(row.confidence ?? 0),
    signals: row.signals ?? { hasWebsite: false, hasSsl: false, hasViewport: false, brokenLinks: 0, loadTimeMs: 0, hasBookingFlow: false, hasChatWidget: false, hasAnalytics: false },
    lastScannedAt: row.last_scanned_at ?? row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  } satisfies IndexedLeadRecord;
}

function rowToLead(row: {
  id: string;
  business_name: string;
  niche: string;
  city: string | null;
  region: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  rating: number;
  location: string;
  review_count: number;
  place_source: string;
  website_status: Lead["websiteStatus"];
  issue_tags: IssueType[];
  opportunity_score: number;
  opportunity_type: Lead["opportunityType"];
  recommended_pitch_angle: string;
  analysis_summary: string;
  source_mode: ScanMode;
  confidence: number;
  signals: Lead["signals"];
  last_scanned_at: string;
  lat: number | null;
  lng: number | null;
}): Lead {
  return {
    id: row.id,
    businessName: row.business_name,
    niche: row.niche,
    city: row.city ?? row.location,
    region: row.region ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    address: row.address ?? "",
    rating: Number(row.rating ?? 0),
    coordinates: {
      latitude: Number(row.lat ?? 0),
      longitude: Number(row.lng ?? 0)
    },
    location: row.location,
    reviewCount: Number(row.review_count ?? 0),
    googleRating: Number(row.rating ?? 0),
    placeSource: row.place_source,
    websiteStatus: row.website_status,
    leadScore: Number(row.opportunity_score ?? 0),
    issueTags: row.issue_tags ?? [],
    issueLabels: (row.issue_tags ?? []).map(readableIssueLabel),
    opportunityScore: Number(row.opportunity_score ?? 0),
    opportunityType: row.opportunity_type,
    recommendedPitchAngle: row.recommended_pitch_angle,
    analysisSummary: row.analysis_summary,
    opportunityInsight: row.analysis_summary,
    pitch: {
      coldCallOpener: `I noticed a few gaps at ${row.business_name} that look fixable without a major rebuild.`,
      emailPitch: `We reviewed ${row.business_name} and found a few visible issues that could be limiting inbound leads in ${row.niche}.`,
      serviceSuggestion: row.recommended_pitch_angle
    },
    notes: "",
    status: "new",
    signals: row.signals ?? { hasWebsite: false, hasSsl: false, hasViewport: false, brokenLinks: 0, loadTimeMs: 0, hasBookingFlow: false, hasChatWidget: false, hasAnalytics: false },
    lastScannedAt: row.last_scanned_at,
    sourceMode: row.source_mode,
    confidence: Number(row.confidence ?? 0),
    isSaved: true
  };
}

function rowToExportHistory(row: {
  id: string;
  user_id: string;
  scan_session_id: string;
  name: string;
  export_type: "csv";
  lead_count: number;
  lead_ids: string[] | null;
  status: "ready" | "queued" | "failed";
  created_at: string;
}) {
  return {
    id: row.id,
    userId: row.user_id,
    scanSessionId: row.scan_session_id,
    name: row.name,
    exportType: row.export_type,
    leadCount: row.lead_count,
    leadIds: row.lead_ids ?? [],
    status: row.status,
    createdAt: row.created_at
  } satisfies ExportHistoryRecord;
}

function buildMarketKey(value: ScanQuery | IndexedLeadRecord) {
  return `${slugify(value.location)}::${slugify(value.niche)}`;
}

function leadToIndexedRecord(lead: Lead): IndexedLeadRecord {
  return {
    id: lead.id,
    businessName: lead.businessName,
    niche: lead.niche,
    city: lead.city,
    region: lead.region,
    location: lead.location,
    country: "",
    address: lead.address,
    phone: lead.phone,
    website: lead.website,
    rating: lead.googleRating,
    reviewCount: lead.reviewCount,
    coordinates: lead.coordinates,
    placeSource: lead.placeSource,
    websiteStatus: lead.websiteStatus,
    issueTags: lead.issueTags,
    opportunityScore: lead.opportunityScore,
    opportunityType: lead.opportunityType,
    recommendedPitchAngle: lead.recommendedPitchAngle,
    analysisSummary: lead.analysisSummary,
    sourceMode: lead.sourceMode,
    confidence: lead.confidence,
    signals: lead.signals,
    lastScannedAt: lead.lastScannedAt,
    createdAt: lead.lastScannedAt,
    updatedAt: lead.lastScannedAt
  };
}

function readableIssueLabel(issue: string) {
  return issue
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function readStore() {
  const filePath = getStorePath();
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<IndexedStore>;
    return {
      leads: parsed.leads ?? [],
      usageLogs: parsed.usageLogs ?? [],
      scanSessions: parsed.scanSessions ?? [],
      savedLeads: parsed.savedLeads ?? [],
      exportHistory: parsed.exportHistory ?? []
    };
  } catch {
    try {
      await ensureStoreDirectory(filePath);
      await writeStore(defaultStore);
    } catch (error) {
      console.warn("[indexed_leads] Unable to initialize local fallback store.", error);
    }

    return createEmptyStore();
  }
}

async function writeStore(store: IndexedStore) {
  const filePath = getStorePath();
  await ensureStoreDirectory(filePath);
  await writeFile(filePath, JSON.stringify(store, null, 2));
}

async function ensureStoreDirectory(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

function getStorePath() {
  if (path.isAbsolute(env.indexedDataFile)) {
    return env.indexedDataFile;
  }

  if (isServerlessRuntime()) {
    const relativePath = env.indexedDataFile.replace(/^[/\\]+/, "");
    return path.join("/tmp/leadscout-ai", relativePath);
  }

  return path.resolve(process.cwd(), env.indexedDataFile);
}

function isServerlessRuntime() {
  return (
    process.cwd().startsWith("/var/task") ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT)
  );
}

function createEmptyStore(): IndexedStore {
  return {
    leads: [],
    usageLogs: [],
    scanSessions: [],
    savedLeads: [],
    exportHistory: []
  };
}

async function ensureLegacyUserRecordViaRest(input: {
  userId: string;
  email: string | null;
  planTier: PlanTier;
}) {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/users`, {
    method: "POST",
    headers: getSupabaseRestHeaders({ contentType: true, resolutionMergeDuplicates: true }),
    body: JSON.stringify({
      id: input.userId,
      email: input.email ?? `${input.userId}@leadscout.local`,
      plan_tier: input.planTier
    })
  });

  if (!response.ok) {
    const message = await response.text();
    if (!message.toLowerCase().includes("schema cache") && !message.toLowerCase().includes('relation "users" does not exist')) {
      throw new Error(message);
    }
  }
}

async function insertUsageLog(input: Omit<UsageLogRecord, "id" | "createdAt">) {
  const db = getDb();

  try {
    await db.query(
      `insert into scan_usage_logs (user_id, mode, tier, query_key, estimated_cost_usd, lead_count)
       values ($1, $2, $3, $4, $5, $6)`,
      [input.userId, input.mode, input.tier, input.queryKey, input.estimatedCostUsd, input.leadCount]
    );
  } catch (error) {
    if (!isMissingColumnError(error, "lead_count")) {
      throw error;
    }

    await db.query(
      `insert into scan_usage_logs (user_id, mode, tier, query_key, estimated_cost_usd)
       values ($1, $2, $3, $4, $5)`,
      [input.userId, input.mode, input.tier, input.queryKey, input.estimatedCostUsd]
    );
  }
}

async function appendUsageLogToStore(input: Omit<UsageLogRecord, "id" | "createdAt">) {
  try {
    const store = await readStore();
    store.usageLogs.push({
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString()
    });
    await writeStore(store);
  } catch (error) {
    console.warn("[scan_usage_logs] Unable to persist local fallback usage log.", error);
  }
}

async function insertUsageLogViaRest(input: Omit<UsageLogRecord, "id" | "createdAt">) {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/scan_usage_logs`, {
    method: "POST",
    headers: getSupabaseRestHeaders({ contentType: true }),
    body: JSON.stringify({
      user_id: input.userId,
      mode: input.mode,
      tier: input.tier,
      query_key: input.queryKey,
      estimated_cost_usd: input.estimatedCostUsd,
      lead_count: input.leadCount
    })
  });

  if (response.ok) {
    return;
  }

  const errorText = await response.text();
  if (!errorText.toLowerCase().includes("lead_count")) {
    throw new Error(errorText);
  }

  const legacyResponse = await fetch(`${env.supabaseUrl}/rest/v1/scan_usage_logs`, {
    method: "POST",
    headers: getSupabaseRestHeaders({ contentType: true }),
    body: JSON.stringify({
      user_id: input.userId,
      mode: input.mode,
      tier: input.tier,
      query_key: input.queryKey,
      estimated_cost_usd: input.estimatedCostUsd
    })
  });

  if (!legacyResponse.ok) {
    throw new Error(await legacyResponse.text());
  }
}

async function insertScanSession(session: ScanSession) {
  const db = getDb();
  const sharedValues = [
    session.id,
    session.userId,
    session.mode,
    session.accessTier,
    session.niche,
    session.location,
    session.radius,
    JSON.stringify(session.filters),
    session.queryString,
    JSON.stringify(session.sourceSummary),
    JSON.stringify(session.summary),
    JSON.stringify(session.issueCounts),
    JSON.stringify(session.pitchContext),
    JSON.stringify(session.leads),
    JSON.stringify(session.mapMarkers),
    JSON.stringify(session.usage)
  ];

  try {
    return await db.query<{ id: string; created_at: string; updated_at: string }>(
      `insert into scan_sessions (
        id, user_id, plan_tier, mode, access_tier, niche, location, radius, filters, query_string, source_summary,
        summary, issue_counts, pitch_context, leads_json, map_markers_json, usage
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,$16::jsonb,$17::jsonb
      )
      on conflict (id) do update set
        user_id = excluded.user_id,
        plan_tier = excluded.plan_tier,
        mode = excluded.mode,
        access_tier = excluded.access_tier,
        niche = excluded.niche,
        location = excluded.location,
        radius = excluded.radius,
        filters = excluded.filters,
        query_string = excluded.query_string,
        source_summary = excluded.source_summary,
        summary = excluded.summary,
        issue_counts = excluded.issue_counts,
        pitch_context = excluded.pitch_context,
        leads_json = excluded.leads_json,
        map_markers_json = excluded.map_markers_json,
        usage = excluded.usage,
        updated_at = now()
      returning id, created_at, updated_at`,
      [
        session.id,
        session.userId,
        session.planTier,
        ...sharedValues.slice(2)
      ]
    );
  } catch (error) {
    if (!isMissingColumnError(error, "plan_tier")) {
      throw error;
    }
  }

  try {
    return await db.query<{ id: string; created_at: string; updated_at: string }>(
      `insert into scan_sessions (
        id, user_id, mode, access_tier, niche, location, radius, filters, query_string, source_summary,
        summary, issue_counts, pitch_context, leads_json, map_markers_json, usage
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,$16::jsonb
      )
      on conflict (id) do update set
        user_id = excluded.user_id,
        mode = excluded.mode,
        access_tier = excluded.access_tier,
        niche = excluded.niche,
        location = excluded.location,
        radius = excluded.radius,
        filters = excluded.filters,
        query_string = excluded.query_string,
        source_summary = excluded.source_summary,
        summary = excluded.summary,
        issue_counts = excluded.issue_counts,
        pitch_context = excluded.pitch_context,
        leads_json = excluded.leads_json,
        map_markers_json = excluded.map_markers_json,
        usage = excluded.usage,
        updated_at = now()
      returning id, created_at, updated_at`,
      sharedValues
    );
  } catch (error) {
    if (!isLegacySessionShapeError(error)) {
      throw error;
    }
  }

  const legacyResult = await db.query<{ id: string; created_at: string; updated_at: string }>(
    `insert into scan_sessions (
      id, user_id, mode, access_tier, niche, location, radius, filters, query_string, source_summary,
      summary, issue_counts, pitch_context, usage
    ) values (
      $1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb
    )
    on conflict (id) do update set
      user_id = excluded.user_id,
      mode = excluded.mode,
      access_tier = excluded.access_tier,
      niche = excluded.niche,
      location = excluded.location,
      radius = excluded.radius,
      filters = excluded.filters,
      query_string = excluded.query_string,
      source_summary = excluded.source_summary,
      summary = excluded.summary,
      issue_counts = excluded.issue_counts,
      pitch_context = excluded.pitch_context,
      usage = excluded.usage,
      updated_at = now()
    returning id, created_at, updated_at`,
    [
      session.id,
      session.userId,
      session.mode,
      session.accessTier,
      session.niche,
      session.location,
      session.radius,
      JSON.stringify(session.filters),
      session.queryString,
      JSON.stringify(session.sourceSummary),
      JSON.stringify(session.summary),
      JSON.stringify(session.issueCounts),
      JSON.stringify(session.pitchContext),
      JSON.stringify(session.usage)
    ]
  );

  await replaceLegacySessionLeadLinks(db, session.id, session.leads.map((lead) => lead.id));
  return legacyResult;
}

async function insertScanSessionViaRest(session: ScanSession) {
  const currentPayload = {
    id: session.id,
    user_id: session.userId,
    plan_tier: session.planTier,
    mode: session.mode,
    access_tier: session.accessTier,
    niche: session.niche,
    location: session.location,
    radius: session.radius,
    filters: session.filters,
    query_string: session.queryString,
    source_summary: session.sourceSummary,
    summary: session.summary,
    issue_counts: session.issueCounts,
    pitch_context: session.pitchContext,
    leads_json: session.leads,
    map_markers_json: session.mapMarkers,
    usage: session.usage
  };

  let response = await fetch(`${env.supabaseUrl}/rest/v1/scan_sessions`, {
    method: "POST",
    headers: getSupabaseRestHeaders({ contentType: true, returnRepresentation: true }),
    body: JSON.stringify(currentPayload)
  });

  if (response.ok) {
    const row = ((await response.json()) as Array<{ id: string; created_at: string; updated_at: string }>)[0];
    return {
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  const errorText = await response.text();
  if (!errorText.toLowerCase().includes("plan_tier") && !errorText.toLowerCase().includes("leads_json") && !errorText.toLowerCase().includes("map_markers_json")) {
    throw new Error(errorText);
  }

  const legacyPayload = {
    id: session.id,
    user_id: session.userId,
    mode: session.mode,
    access_tier: session.accessTier,
    niche: session.niche,
    location: session.location,
    radius: session.radius,
    filters: session.filters,
    query_string: session.queryString,
    source_summary: session.sourceSummary,
    summary: session.summary,
    issue_counts: session.issueCounts,
    pitch_context: session.pitchContext,
    usage: session.usage
  };

  response = await fetch(`${env.supabaseUrl}/rest/v1/scan_sessions`, {
    method: "POST",
    headers: getSupabaseRestHeaders({ contentType: true, returnRepresentation: true }),
    body: JSON.stringify(legacyPayload)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const row = ((await response.json()) as Array<{ id: string; created_at: string; updated_at: string }>)[0];
  await replaceLegacySessionLeadLinksViaRest(session.id, session.leads.map((lead) => lead.id));
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function selectPersistedScanSession(sessionId: string, userId: string | null) {
  const db = getDb();

  try {
    const result = await db.query<PersistedScanSessionRow>(
      `select id, plan_tier, mode, access_tier, user_id, niche, location, radius, filters, query_string, source_summary,
              summary, issue_counts, pitch_context, leads_json, map_markers_json, usage, created_at, updated_at
       from scan_sessions
       where id = $1
         and user_id is not distinct from $2
       limit 1`,
      [sessionId, userId]
    );
    const row = result.rows[0];
    return row ? { kind: "current" as const, row } : null;
  } catch (error) {
    if (!isMissingColumnError(error, "plan_tier")) {
      throw error;
    }
  }

  try {
    const result = await db.query<PersistedScanSessionRow>(
      `select id, mode, access_tier, user_id, niche, location, radius, filters, query_string, source_summary,
              summary, issue_counts, pitch_context, leads_json, map_markers_json, usage, created_at, updated_at
       from scan_sessions
       where id = $1
         and user_id is not distinct from $2
       limit 1`,
      [sessionId, userId]
    );
    const row = result.rows[0];
    return row ? { kind: "current" as const, row } : null;
  } catch (error) {
    if (!isLegacySessionShapeError(error)) {
      throw error;
    }
  }

  const legacyResult = await db.query<LegacyPersistedScanSessionRow>(
    `select id, mode, access_tier, user_id, niche, location, radius, filters, query_string, source_summary,
            summary, issue_counts, pitch_context, usage, created_at, updated_at
     from scan_sessions
     where id = $1
       and user_id is not distinct from $2
     limit 1`,
    [sessionId, userId]
  );
  const row = legacyResult.rows[0];
  return row ? { kind: "legacy" as const, row } : null;
}

async function selectPersistedScanSessionViaRest(sessionId: string, userId: string | null) {
  const currentParams = new URLSearchParams({
    id: `eq.${sessionId}`,
    select:
      "id,plan_tier,mode,access_tier,user_id,niche,location,radius,filters,query_string,source_summary,summary,issue_counts,pitch_context,leads_json,map_markers_json,usage,created_at,updated_at",
    limit: "1"
  });
  currentParams.set("user_id", userId ? `eq.${userId}` : "is.null");

  let response = await fetch(`${env.supabaseUrl}/rest/v1/scan_sessions?${currentParams.toString()}`, {
    headers: getSupabaseRestHeaders()
  });

  if (response.ok) {
    const row = ((await response.json()) as PersistedScanSessionRow[])[0];
    return row ? mapScanSessionRow(row) : null;
  }

  const currentError = await response.text();
  if (!currentError.toLowerCase().includes("plan_tier") && !currentError.toLowerCase().includes("leads_json") && !currentError.toLowerCase().includes("map_markers_json")) {
    throw new Error(currentError);
  }

  const legacyParams = new URLSearchParams({
    id: `eq.${sessionId}`,
    select:
      "id,mode,access_tier,user_id,niche,location,radius,filters,query_string,source_summary,summary,issue_counts,pitch_context,usage,created_at,updated_at",
    limit: "1"
  });
  legacyParams.set("user_id", userId ? `eq.${userId}` : "is.null");

  response = await fetch(`${env.supabaseUrl}/rest/v1/scan_sessions?${legacyParams.toString()}`, {
    headers: getSupabaseRestHeaders()
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const row = ((await response.json()) as LegacyPersistedScanSessionRow[])[0];
  if (!row) {
    return null;
  }

  const leads = await selectLegacySessionLeadsViaRest(sessionId);
  return mapLegacyScanSessionRow(row, leads);
}

async function persistScanSessionToStore(session: ScanSession) {
  try {
    const store = await readStore();
    store.scanSessions = [
      { ...session, updatedAt: new Date().toISOString() },
      ...store.scanSessions.filter((entry) => entry.id !== session.id)
    ];
    await writeStore(store);
  } catch (error) {
    console.warn("[scan_sessions] Unable to persist local fallback scan session.", error);
  }
}

function isMissingColumnError(error: unknown, columnName: string) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes(`column "${columnName.toLowerCase()}"`) || message.includes(`column ${columnName.toLowerCase()}`);
}

function isLegacySessionShapeError(error: unknown) {
  return isMissingColumnError(error, "leads_json") || isMissingColumnError(error, "map_markers_json");
}

async function replaceLegacySessionLeadLinks(db: ReturnType<typeof getDb>, sessionId: string, leadIds: string[]) {
  await db.query(`delete from scan_session_leads where scan_session_id = $1`, [sessionId]);

  for (const leadId of leadIds) {
    await db.query(
      `insert into scan_session_leads (scan_session_id, lead_id)
       values ($1, $2)
       on conflict (scan_session_id, lead_id) do nothing`,
      [sessionId, leadId]
    );
  }
}

async function selectLegacySessionLeads(sessionId: string) {
  const db = getDb();
  const result = await db.query<{
    id: string;
    business_name: string;
    niche: string;
    city: string | null;
    region: string | null;
    location: string;
    country: string | null;
    address: string | null;
    phone: string | null;
    website: string | null;
    rating: number;
    review_count: number;
    lat: number | null;
    lng: number | null;
    place_source: string;
    website_status: "has-website" | "no-website" | "unknown";
    issue_tags: IssueType[];
    opportunity_score: number;
    opportunity_type: Lead["opportunityType"];
    recommended_pitch_angle: string;
    analysis_summary: string;
    source_mode: ScanMode;
    confidence: number;
    signals: Lead["signals"];
    last_scanned_at: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `select l.*
     from scan_session_leads ssl
     join indexed_leads l on l.id = ssl.lead_id
     where ssl.scan_session_id = $1
     order by l.opportunity_score desc`,
    [sessionId]
  );

  return result.rows.map((row) => mapIndexedRecordToLeadFallback(rowToIndexedLead(row)));
}

async function replaceLegacySessionLeadLinksViaRest(sessionId: string, leadIds: string[]) {
  await fetch(`${env.supabaseUrl}/rest/v1/scan_session_leads?scan_session_id=eq.${sessionId}`, {
    method: "DELETE",
    headers: getSupabaseRestHeaders()
  });

  if (!leadIds.length) {
    return;
  }

  const response = await fetch(`${env.supabaseUrl}/rest/v1/scan_session_leads`, {
    method: "POST",
    headers: getSupabaseRestHeaders({ contentType: true }),
    body: JSON.stringify(leadIds.map((leadId) => ({ scan_session_id: sessionId, lead_id: leadId })))
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

async function selectLegacySessionLeadsViaRest(sessionId: string) {
  const relationResponse = await fetch(
    `${env.supabaseUrl}/rest/v1/scan_session_leads?scan_session_id=eq.${sessionId}&select=lead_id`,
    {
      headers: getSupabaseRestHeaders()
    }
  );

  if (!relationResponse.ok) {
    throw new Error(await relationResponse.text());
  }

  const relations = (await relationResponse.json()) as Array<{ lead_id: string }>;
  const leadIds = relations.map((entry) => entry.lead_id);
  if (!leadIds.length) {
    return [];
  }

  const params = new URLSearchParams({
    select:
      "id,business_name,niche,city,region,location,country,address,phone,website,rating,review_count,lat,lng,place_source,website_status,issue_tags,opportunity_score,opportunity_type,recommended_pitch_angle,analysis_summary,source_mode,confidence,signals,last_scanned_at,created_at,updated_at",
    id: `in.(${leadIds.join(",")})`,
    order: "opportunity_score.desc"
  });

  const leadResponse = await fetch(`${env.supabaseUrl}/rest/v1/indexed_leads?${params.toString()}`, {
    headers: getSupabaseRestHeaders()
  });

  if (!leadResponse.ok) {
    throw new Error(await leadResponse.text());
  }

  const rows = (await leadResponse.json()) as Array<Parameters<typeof rowToIndexedLead>[0]>;
  return rows.map((row) => mapIndexedRecordToLeadFallback(rowToIndexedLead(row)));
}

function mapIndexedRecordToLeadFallback(record: IndexedLeadRecord): Lead {
  return {
    id: record.id,
    businessName: record.businessName,
    niche: record.niche,
    city: record.city,
    region: record.region,
    phone: record.phone,
    website: record.website,
    address: record.address,
    rating: record.rating,
    coordinates: record.coordinates,
    location: record.location,
    reviewCount: record.reviewCount,
    googleRating: record.rating,
    placeSource: record.placeSource,
    websiteStatus: record.websiteStatus,
    leadScore: record.opportunityScore,
    issueTags: record.issueTags,
    issueLabels: record.issueTags.map(readableIssueLabel),
    opportunityScore: record.opportunityScore,
    opportunityType: record.opportunityType,
    recommendedPitchAngle: record.recommendedPitchAngle,
    analysisSummary: record.analysisSummary,
    opportunityInsight: record.analysisSummary,
    pitch: {
      coldCallOpener: `I noticed a few gaps at ${record.businessName} that look fixable without a major rebuild.`,
      emailPitch: `We reviewed ${record.businessName} and found a few visible issues that could be limiting inbound leads in ${record.niche}.`,
      serviceSuggestion: record.recommendedPitchAngle
    },
    notes: "",
    status: "new",
    signals: record.signals,
    lastScannedAt: record.lastScannedAt,
    sourceMode: record.sourceMode,
    confidence: record.confidence,
    isSaved: false
  };
}
