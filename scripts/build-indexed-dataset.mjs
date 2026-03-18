import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const outputPath = path.resolve(process.cwd(), process.env.INDEXED_DATA_FILE || "data/indexed-leads.json");
const locations = readCsvArg("locations", "Vancouver,Seattle,Toronto");
const niches = readCsvArg(
  "niches",
  "dentists,plumbers,contractors,chiropractors,electricians,roofers,physiotherapists,med-spas,lawyers,hvac"
);

const locationConfig = {
  Vancouver: {
    region: "British Columbia",
    country: "Canada",
    phoneCodes: ["604", "778"],
    seedCount: 18,
    center: { latitude: 49.2827, longitude: -123.1207 },
    neighborhoods: [
      { name: "Downtown", latOffset: 0.003, lngOffset: -0.002, streets: ["Robson St", "Burrard St", "Davie St"] },
      { name: "Yaletown", latOffset: -0.01, lngOffset: 0.01, streets: ["Mainland St", "Pacific Blvd", "Helmcken St"] },
      { name: "Kitsilano", latOffset: -0.028, lngOffset: -0.028, streets: ["W 4th Ave", "Broadway", "Arbutus St"] },
      { name: "Mount Pleasant", latOffset: -0.02, lngOffset: 0.014, streets: ["Main St", "Broadway", "Kingsway"] },
      { name: "Commercial Drive", latOffset: -0.008, lngOffset: 0.05, streets: ["Commercial Dr", "Venables St", "E Hastings St"] },
      { name: "Kerrisdale", latOffset: -0.062, lngOffset: -0.037, streets: ["W 41st Ave", "Larch St", "Arbutus St"] }
    ]
  },
  Seattle: {
    region: "Washington",
    country: "United States",
    phoneCodes: ["206"],
    seedCount: 6,
    center: { latitude: 47.6062, longitude: -122.3321 },
    neighborhoods: [
      { name: "Ballard", latOffset: 0.061, lngOffset: -0.053, streets: ["Market St", "15th Ave NW", "Leary Ave NW"] },
      { name: "Capitol Hill", latOffset: 0.015, lngOffset: 0.02, streets: ["Pine St", "Broadway", "Olive Way"] },
      { name: "Fremont", latOffset: 0.042, lngOffset: -0.023, streets: ["N 36th St", "Fremont Ave N", "Aurora Ave N"] }
    ]
  },
  Toronto: {
    region: "Ontario",
    country: "Canada",
    phoneCodes: ["416", "647"],
    seedCount: 6,
    center: { latitude: 43.6532, longitude: -79.3832 },
    neighborhoods: [
      { name: "Downtown", latOffset: 0.004, lngOffset: -0.003, streets: ["King St", "Queen St", "Yonge St"] },
      { name: "Yorkville", latOffset: 0.022, lngOffset: 0.002, streets: ["Bloor St", "Avenue Rd", "Cumberland St"] },
      { name: "Leslieville", latOffset: 0.003, lngOffset: 0.047, streets: ["Queen St E", "Carlaw Ave", "Dundas St E"] }
    ]
  }
};

const nicheConfig = {
  dentists: {
    prefixes: ["Harbor", "Cedar", "North Star", "Summit", "Evergreen", "Granville", "Pacific", "Lions Gate"],
    suffixes: ["Dental Studio", "Family Dental", "Smiles", "Dental Group", "Dental Arts"],
    serviceAngles: [
      "Booking flow automation + mobile UX cleanup",
      "Modernization + AI chat assistant",
      "Review generation + patient intake optimization"
    ],
    websiteLabel: "Dentist"
  },
  plumbers: {
    prefixes: ["Rapid", "TrueFlow", "BluePipe", "Prime", "Metro", "Harbor", "West Coast", "Mainline"],
    suffixes: ["Plumbing", "Drain Pros", "Rooter", "Plumbing Co", "Mechanical"],
    serviceAngles: [
      "Emergency booking flow + tracking setup",
      "Chat-first urgent intake",
      "Local SEO + call capture optimization"
    ],
    websiteLabel: "Plumber"
  },
  contractors: {
    prefixes: ["Atlas", "Westline", "Craftstone", "Anchor", "BluePeak", "Northshore", "Skyline", "Forme"],
    suffixes: ["Renovations", "Build Co", "Contracting", "Construction", "Remodeling"],
    serviceAngles: [
      "Lead capture rebuild + trust signal refresh",
      "Portfolio modernization + quote funnel",
      "Local SEO + project inquiry automation"
    ],
    websiteLabel: "Contractor"
  },
  chiropractors: {
    prefixes: ["Vital", "Motion", "Core", "Peak", "Restore", "Uplift", "North Shore", "Pacific"],
    suffixes: ["Chiropractic", "Wellness Clinic", "Spine Center", "Alignment Studio"],
    serviceAngles: [
      "Patient booking flow + retention automation",
      "Mobile redesign + new patient funnel",
      "Local SEO + intake form cleanup"
    ],
    websiteLabel: "Chiropractor"
  },
  electricians: {
    prefixes: ["BrightLine", "Fuse", "North Current", "Circuit", "EverSpark", "Pacific Volt", "WestWire"],
    suffixes: ["Electric", "Electrical", "Power Pros", "Electric Co"],
    serviceAngles: [
      "Service request funnel + quote automation",
      "Search visibility + call conversion refresh",
      "Trust signal update + emergency intake"
    ],
    websiteLabel: "Electrician"
  },
  roofers: {
    prefixes: ["RainShield", "Summit", "WestPeak", "Anchor", "Northline", "Granville", "Harbor"],
    suffixes: ["Roofing", "Roofing Co", "Roof Pros", "Exteriors"],
    serviceAngles: [
      "Storm lead capture + estimate workflow",
      "Search visibility + project gallery refresh",
      "Quote funnel + trust signal update"
    ],
    websiteLabel: "Roofer"
  },
  physiotherapists: {
    prefixes: ["MoveWell", "Restore", "Motion Lab", "Harbor", "Peak", "Cedar", "Pacific", "True North"],
    suffixes: ["Physio", "Physiotherapy", "Rehab Clinic", "Performance Physio"],
    serviceAngles: [
      "Appointment booking + intake automation",
      "Clinic modernization + patient funnel cleanup",
      "Search visibility + trust page refresh"
    ],
    websiteLabel: "Physio"
  },
  "med-spas": {
    prefixes: ["Luma", "Contour", "Glow", "West Coast", "North Shore", "Form", "Skin Lab", "Ever"],
    suffixes: ["Med Spa", "Aesthetics", "Skin Studio", "Cosmetic Clinic"],
    serviceAngles: [
      "Lead nurture + consultation booking system",
      "Landing page rebuild + AI chat qualification",
      "Review growth + premium conversion funnel"
    ],
    websiteLabel: "Med Spa"
  },
  lawyers: {
    prefixes: ["Granville", "Harbor", "Summit", "Northshore", "Pacific", "Main Street", "West End"],
    suffixes: ["Law Group", "Legal", "Law Office", "Barristers"],
    serviceAngles: [
      "Consultation capture + trust-page refresh",
      "Search visibility + intake form optimization",
      "Conversion-focused redesign for high-intent leads"
    ],
    websiteLabel: "Law Firm"
  },
  hvac: {
    prefixes: ["TrueTemp", "North Air", "Comfort First", "West Coast", "Pacific Climate", "Metro Heat"],
    suffixes: ["HVAC", "Heating & Cooling", "Mechanical", "Climate Systems"],
    serviceAngles: [
      "Service booking + emergency intake automation",
      "Local SEO + call conversion optimization",
      "Quote request funnel + trust signal update"
    ],
    websiteLabel: "HVAC"
  }
};

const leads = buildLeads();

const existingStore = await readExistingStore();
const nextStore = {
  ...existingStore,
  leads
};

await writeFile(outputPath, JSON.stringify(nextStore, null, 2));
console.log(`Wrote ${leads.length} indexed leads to ${outputPath}`);

const importResult = await importLeads(leads);
if (importResult) {
  console.log(importResult);
}

function buildLeads() {
  return locations.flatMap((location) => {
    const locationMeta = locationConfig[location];
    if (!locationMeta) {
      return [];
    }

    return niches.flatMap((niche) => {
      const nicheMeta = nicheConfig[niche] ?? fallbackNicheConfig(niche);
      return Array.from({ length: locationMeta.seedCount }, (_, index) => buildLead({
        location,
        locationMeta,
        niche,
        nicheMeta,
        index
      }));
    });
  });
}

function buildLead({ location, locationMeta, niche, nicheMeta, index }) {
  const neighborhood = locationMeta.neighborhoods[index % locationMeta.neighborhoods.length];
  const prefix = nicheMeta.prefixes[index % nicheMeta.prefixes.length];
  const suffix = nicheMeta.suffixes[index % nicheMeta.suffixes.length];
  const businessName = `${prefix} ${suffix}`;
  const street = neighborhood.streets[index % neighborhood.streets.length];
  const streetNumber = 100 + index * 17 + location.length;
  const areaCode = locationMeta.phoneCodes[index % locationMeta.phoneCodes.length];
  const seed = `${location}:${niche}:${index}`;
  const hasWebsite = index % 7 !== 1;
  const website = hasWebsite
    ? `https://${slugify(`${businessName}-${neighborhood.name}`)}.${locationMeta.country === "United States" ? "com" : "ca"}`
    : "No website";
  const issueTags = buildIssueTags(index, hasWebsite);
  const opportunityScore = Math.min(92, 20 + issueTags.length * 15 + (index % 3) * 4);
  const opportunityType = buildOpportunityType(issueTags);
  const recommendedPitchAngle = nicheMeta.serviceAngles[index % nicheMeta.serviceAngles.length];
  const lastScannedAt = new Date(Date.UTC(2026, 2, 1 + (index % 18), 9 + (index % 6), index % 60)).toISOString();
  const coordinates = {
    latitude: Number((locationMeta.center.latitude + neighborhood.latOffset + ((index % 3) - 1) * 0.004).toFixed(6)),
    longitude: Number((locationMeta.center.longitude + neighborhood.lngOffset + ((index % 4) - 1.5) * 0.004).toFixed(6))
  };

  return {
    id: `indexed-${slugify(location)}-${slugify(niche)}-${index + 1}`,
    businessName,
    niche,
    city: location,
    region: locationMeta.region,
    location,
    country: locationMeta.country,
    address: `${streetNumber} ${street}, ${neighborhood.name}, ${location}`,
    phone: `(${areaCode}) 555-${String(1100 + index * 13 + location.length).slice(-4)}`,
    website,
    rating: Number((3.7 + ((index * 2) % 13) / 10).toFixed(1)),
    reviewCount: 10 + ((index * 19 + location.length) % 140),
    coordinates,
    placeSource: "indexed_seed",
    websiteStatus: hasWebsite ? "has-website" : "no-website",
    issueTags,
    opportunityScore,
    opportunityType,
    recommendedPitchAngle,
    analysisSummary: buildAnalysisSummary({ businessName, niche, neighborhood: neighborhood.name, issueTags }),
    sourceMode: "indexed",
    confidence: Number((0.74 + (index % 5) * 0.04).toFixed(2)),
    signals: buildSignals({ index, website, businessName, nicheLabel: nicheMeta.websiteLabel, seed }),
    lastScannedAt,
    createdAt: lastScannedAt,
    updatedAt: lastScannedAt
  };
}

function buildSignals({ index, website, businessName, nicheLabel, seed }) {
  const currentYear = 2026;
  const hasWebsite = website !== "No website";
  const hash = [...seed].reduce((sum, char, charIndex) => sum + char.charCodeAt(0) * (charIndex + 3), 0);

  if (!hasWebsite) {
    return {
      pageTitle: undefined,
      metaDescription: undefined,
      hasSsl: false,
      hasViewport: false,
      brokenLinks: 0,
      loadTimeMs: 0,
      hasBookingFlow: false,
      hasChatWidget: false,
      hasAnalytics: false,
      copyrightYear: undefined,
      hasWebsite: false
    };
  }

  return {
    pageTitle: `${businessName} | ${nicheLabel}`,
    metaDescription: index % 4 === 0 ? "" : `${businessName} helps local customers in Vancouver book and inquire faster.`,
    hasSsl: index % 8 !== 0,
    hasViewport: index % 5 !== 0,
    brokenLinks: index % 6 === 0 ? 2 : index % 4 === 0 ? 1 : 0,
    loadTimeMs: 1400 + (hash % 2400),
    hasBookingFlow: index % 3 !== 0,
    hasChatWidget: index % 4 === 1,
    hasAnalytics: index % 5 !== 2,
    copyrightYear: currentYear - (hash % 8),
    hasWebsite: true
  };
}

function buildIssueTags(index, hasWebsite) {
  if (!hasWebsite) {
    return ["no-website", "low-reviews"];
  }

  const tags = [];
  if (index % 3 === 0) tags.push("no-booking");
  if (index % 4 === 0) tags.push("weak-seo");
  if (index % 5 === 0) tags.push("poor-mobile");
  if (index % 6 === 0) tags.push("broken-links");
  if (index % 4 === 1) tags.push("no-chat-widget");
  if (index % 5 === 2) tags.push("no-analytics");
  if (index % 7 === 0) tags.push("outdated-site");
  if (index % 6 === 2) tags.push("slow-site");
  return tags.length ? tags : ["low-reviews"];
}

function buildOpportunityType(tags) {
  if (tags.includes("no-booking")) return "Automation opportunity";
  if (tags.includes("no-chat-widget")) return "AI chatbot opportunity";
  if (tags.includes("weak-seo")) return "SEO improvement opportunity";
  if (tags.includes("no-website") || tags.includes("outdated-site")) return "Website redesign opportunity";
  if (tags.includes("low-reviews")) return "Reputation management opportunity";
  return "Marketing funnel opportunity";
}

function buildAnalysisSummary({ businessName, niche, neighborhood, issueTags }) {
  if (issueTags.includes("no-website")) {
    return `${businessName} in ${neighborhood} has no visible website, making this ${niche} lead a direct credibility and lead-capture rebuild opportunity.`;
  }

  const topIssues = issueTags.slice(0, 2).map(readableIssue).join(" and ");
  return `${businessName} in ${neighborhood} shows visible signs of ${topIssues || "conversion friction"}, which makes it a strong Vancouver outreach target.`;
}

function fallbackNicheConfig(niche) {
  const title = niche.replace(/\b\w/g, (char) => char.toUpperCase());
  return {
    prefixes: ["Pacific", "Granville", "Harbor", "West End"],
    suffixes: [title, `${title} Group`, `${title} Studio`],
    serviceAngles: ["Lead capture refresh", "Search visibility upgrade", "Conversion funnel cleanup"],
    websiteLabel: title
  };
}

function readableIssue(issue) {
  return issue.replace(/-/g, " ");
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function readCsvArg(name, fallback) {
  return (process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1] || fallback)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function readExistingStore() {
  try {
    const raw = JSON.parse(await readFile(outputPath, "utf8"));
    return {
      usageLogs: raw.usageLogs ?? [],
      scanSessions: raw.scanSessions ?? [],
      savedLeads: raw.savedLeads ?? [],
      exportHistory: raw.exportHistory ?? []
    };
  } catch {
    return {
      usageLogs: [],
      scanSessions: [],
      savedLeads: [],
      exportHistory: []
    };
  }
}

async function importLeads(nextLeads) {
  try {
    if (process.env.SUPABASE_DATABASE_URL) {
      await importViaPg(nextLeads);
      return `Upserted ${nextLeads.length} indexed leads into the database over Postgres.`;
    }
  } catch (error) {
    console.warn("Postgres import failed, falling back to Supabase REST.", error.message);
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await importViaRest(nextLeads);
    return `Upserted ${nextLeads.length} indexed leads into the database over Supabase REST.`;
  }

  return null;
}

async function importViaPg(nextLeads) {
  const databaseUrl = new URL(process.env.SUPABASE_DATABASE_URL);
  const client = new Client({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 5432),
    database: databaseUrl.pathname.replace(/^\//, ""),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    family: 4,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();
  try {
    for (const lead of nextLeads) {
      await client.query(
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
  } finally {
    await client.end();
  }
}

async function importViaRest(nextLeads) {
  const batchSize = 200;
  const rows = nextLeads.map((lead) => ({
    id: lead.id,
    business_name: lead.businessName,
    niche: lead.niche,
    city: lead.city,
    region: lead.region,
    location: lead.location,
    country: lead.country,
    address: lead.address,
    phone: lead.phone,
    website: lead.website,
    rating: lead.rating,
    review_count: lead.reviewCount,
    lat: lead.coordinates.latitude,
    lng: lead.coordinates.longitude,
    place_source: lead.placeSource,
    website_status: lead.websiteStatus,
    issue_tags: lead.issueTags,
    opportunity_score: lead.opportunityScore,
    opportunity_type: lead.opportunityType,
    recommended_pitch_angle: lead.recommendedPitchAngle,
    analysis_summary: lead.analysisSummary,
    source_mode: lead.sourceMode,
    confidence: lead.confidence,
    signals: lead.signals,
    last_scanned_at: lead.lastScannedAt,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt
  }));

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/indexed_leads?on_conflict=id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(batch)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  }
}
