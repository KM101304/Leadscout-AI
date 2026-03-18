import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputPath = path.resolve(process.cwd(), process.env.INDEXED_DATA_FILE || "data/indexed-leads.json");
const locations = (process.argv.find((arg) => arg.startsWith("--locations="))?.split("=")[1] || "Vancouver,Seattle,Toronto")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const niches = (process.argv.find((arg) => arg.startsWith("--niches="))?.split("=")[1] || "dentists,plumbers,contractors")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const locationConfig = {
  Vancouver: { region: "British Columbia", country: "Canada", lat: 49.2827, lng: -123.1207, phone: "604" },
  Seattle: { region: "Washington", country: "United States", lat: 47.6062, lng: -122.3321, phone: "206" },
  Toronto: { region: "Ontario", country: "Canada", lat: 43.6532, lng: -79.3832, phone: "416" }
};

const nichePrefixes = {
  dentists: ["Harbor", "Cedar", "North Star", "Summit", "Evergreen"],
  plumbers: ["Rapid", "TrueFlow", "BluePipe", "Prime", "Metro"],
  contractors: ["Atlas", "Westline", "Craftstone", "Anchor", "BluePeak"]
};

const nicheSuffixes = {
  dentists: ["Dental Studio", "Family Dental", "Smiles", "Dental Group"],
  plumbers: ["Plumbing", "Drain Pros", "Rooter", "Plumbing Co"],
  contractors: ["Renovations", "Build Co", "Contracting", "Construction"]
};

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function buildSignals(index, website) {
  const year = new Date().getUTCFullYear() - (index % 6);
  const hasWebsite = website !== "No website";

  return {
    pageTitle: hasWebsite ? `${website.replace("https://", "").split(".")[0]}` : undefined,
    metaDescription: hasWebsite && index % 2 === 0 ? "Local business helping nearby customers convert faster." : "",
    hasSsl: hasWebsite,
    hasViewport: index % 3 !== 0,
    brokenLinks: index % 4 === 0 ? 1 : 0,
    loadTimeMs: hasWebsite ? 1800 + index * 320 : 0,
    hasBookingFlow: index % 2 === 0,
    hasChatWidget: index % 4 === 1,
    hasAnalytics: index % 3 !== 1,
    copyrightYear: hasWebsite ? year : undefined,
    hasWebsite
  };
}

function buildIssueTags(index, website) {
  if (website === "No website") {
    return ["no-website", "low-reviews"];
  }

  const tags = [];
  if (index % 2 === 0) tags.push("no-booking");
  if (index % 3 === 0) tags.push("weak-seo");
  if (index % 4 === 0) tags.push("poor-mobile");
  if (index % 5 === 0) tags.push("broken-links");
  if (index % 3 === 1) tags.push("no-chat-widget");
  return tags.length ? tags : ["no-analytics"];
}

function buildOpportunityType(tags) {
  if (tags.includes("no-booking")) return "Automation opportunity";
  if (tags.includes("weak-seo")) return "SEO improvement opportunity";
  if (tags.includes("no-website")) return "Website redesign opportunity";
  if (tags.includes("no-chat-widget")) return "AI chatbot opportunity";
  return "Marketing funnel opportunity";
}

const leads = [];

locations.forEach((location) => {
  niches.forEach((niche) => {
    const locationMeta = locationConfig[location];
    if (!locationMeta) {
      return;
    }

    for (let index = 0; index < 5; index += 1) {
      const prefix = nichePrefixes[niche]?.[index % nichePrefixes[niche].length] || "Local";
      const suffix = nicheSuffixes[niche]?.[index % nicheSuffixes[niche].length] || "Business";
      const businessName = `${prefix} ${suffix}`;
      const website = index === 1 ? "No website" : `https://${slugify(businessName)}.${locationMeta.country === "United States" ? "com" : "ca"}`;
      const issueTags = buildIssueTags(index, website);
      const opportunityType = buildOpportunityType(issueTags);
      const opportunityScore = Math.min(90, 20 + issueTags.length * 15);
      const timestamp = new Date(Date.UTC(2026, 2, 1 + index)).toISOString();

      leads.push({
        id: `indexed-${slugify(location)}-${slugify(niche)}-${index + 1}`,
        businessName,
        niche,
        city: location,
        region: locationMeta.region,
        location,
        country: locationMeta.country,
        address: `${100 + index * 17} Main St, ${location}`,
        phone: `(${locationMeta.phone}) 555-${String(1100 + index * 13).slice(-4)}`,
        website,
        rating: Number((3.8 + index * 0.2).toFixed(1)),
        reviewCount: 12 + index * 18,
        coordinates: {
          latitude: Number((locationMeta.lat + index * 0.01).toFixed(6)),
          longitude: Number((locationMeta.lng - index * 0.01).toFixed(6))
        },
        placeSource: "bootstrap_seed",
        websiteStatus: website === "No website" ? "no-website" : "has-website",
        issueTags,
        opportunityScore,
        opportunityType,
        recommendedPitchAngle: `${opportunityType} for ${businessName}`,
        analysisSummary: `Indexed bootstrap record for ${businessName} in ${location}.`,
        sourceMode: "indexed",
        confidence: 0.72,
        signals: buildSignals(index, website),
        lastScannedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
  });
});

let usageLogs = [];

try {
  const existing = JSON.parse(await readFile(outputPath, "utf8"));
  usageLogs = existing.usageLogs || [];
} catch {}

await writeFile(outputPath, JSON.stringify({ leads, usageLogs }, null, 2));
console.log(`Wrote ${leads.length} indexed leads to ${outputPath}`);
