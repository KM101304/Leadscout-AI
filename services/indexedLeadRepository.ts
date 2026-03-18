import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { IndexedLeadRecord, IssueType, ScanMode, ScanQuery } from "@/lib/types";
import { slugify } from "@/lib/utils";

interface UsageLogRecord {
  id: string;
  userId: string | null;
  tier: string;
  mode: ScanMode;
  queryKey: string;
  estimatedCostUsd: number;
  createdAt: string;
}

interface IndexedStore {
  leads: IndexedLeadRecord[];
  usageLogs: UsageLogRecord[];
}

const defaultStore: IndexedStore = {
  leads: [],
  usageLogs: []
};

export async function queryIndexedLeads(query: ScanQuery) {
  const store = await readStore();
  const marketKey = buildMarketKey(query);
  const results = store.leads
    .filter((lead) => buildMarketKey(lead) === marketKey)
    .filter((lead) => {
      if (typeof query.minimumReviewCount === "number" && lead.reviewCount < query.minimumReviewCount) {
        return false;
      }

      if (query.websiteStatus === "has-website" && lead.websiteStatus !== "has-website") return false;
      if (query.websiteStatus === "no-website" && lead.websiteStatus !== "no-website") return false;

      if (query.businessSize === "solo" && lead.reviewCount > 40) return false;
      if (query.businessSize === "small-team" && (lead.reviewCount < 20 || lead.reviewCount > 120)) return false;
      if (query.businessSize === "multi-location" && lead.reviewCount < 80) return false;

      return true;
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

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

  const store = await readStore();
  const existing = new Map(store.leads.map((lead) => [lead.id, lead]));

  leads.forEach((lead) => {
    existing.set(lead.id, lead);
  });

  store.leads = [...existing.values()].sort((a, b) => a.businessName.localeCompare(b.businessName));
  await writeStore(store);
}

export async function logUsage(input: Omit<UsageLogRecord, "id" | "createdAt">) {
  const store = await readStore();
  store.usageLogs.push({
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString()
  });
  await writeStore(store);
}

export async function countMonthlyUsage(userId: string | null, mode: ScanMode) {
  const store = await readStore();
  const monthPrefix = new Date().toISOString().slice(0, 7);

  return store.usageLogs.filter((log) => log.userId === userId && log.mode === mode && log.createdAt.startsWith(monthPrefix)).length;
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

function buildMarketKey(value: ScanQuery | IndexedLeadRecord) {
  return `${slugify(value.location)}::${slugify(value.niche)}`;
}

async function readStore() {
  const filePath = getStorePath();

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<IndexedStore>;

    return {
      leads: parsed.leads ?? [],
      usageLogs: parsed.usageLogs ?? []
    };
  } catch {
    await ensureStoreDirectory(filePath);
    await writeStore(defaultStore);
    return defaultStore;
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
  return path.resolve(process.cwd(), env.indexedDataFile);
}
