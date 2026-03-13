import { DirectoryBusiness, WebsiteSignals } from "@/lib/types";
import { slugify } from "@/lib/utils";

const locationSeeds = {
  vancouver: {
    area: ["Kitsilano", "Downtown", "Mount Pleasant", "Burnaby", "Richmond"],
    street: ["Main St", "Broadway", "Kingsway", "Cambie St", "Granville St"],
    areaCode: "604",
    center: { latitude: 49.2827, longitude: -123.1207 }
  },
  seattle: {
    area: ["Ballard", "Capitol Hill", "Fremont", "Bellevue", "West Seattle"],
    street: ["Aurora Ave", "Pine St", "Market St", "Rainier Ave", "Olive Way"],
    areaCode: "206",
    center: { latitude: 47.6062, longitude: -122.3321 }
  },
  toronto: {
    area: ["North York", "Scarborough", "Etobicoke", "Downtown", "Yorkville"],
    street: ["King St", "Queen St", "Bloor St", "Danforth Ave", "Yonge St"],
    areaCode: "416",
    center: { latitude: 43.6532, longitude: -79.3832 }
  }
} as const;

const nicheSeeds = {
  dentists: ["Smile", "Harbor", "Evergreen", "Summit", "North Star", "Cedar"],
  contractors: ["Atlas", "BluePeak", "Westline", "Craftstone", "Maple", "Anchor"],
  plumbers: ["Rapid", "TrueFlow", "BluePipe", "Metro", "NorthLine", "Prime"],
  chiropractors: ["Vital", "Motion", "Core", "Peak", "Restore", "True Spine"]
} as const;

const suffixSeeds = {
  dentists: ["Dental Studio", "Family Dental", "Dental Group", "Smiles"],
  contractors: ["Construction", "Contracting", "Renovations", "Build Co"],
  plumbers: ["Plumbing", "Drain Pros", "Plumbing Co", "Rooter"],
  chiropractors: ["Chiropractic", "Wellness Clinic", "Spine Center", "Alignment Studio"]
} as const;

export function makeMockSignals(seed: number, website: string): WebsiteSignals {
  const currentYear = new Date().getFullYear();
  const hasWebsite = seed % 7 !== 0;
  const hasSsl = seed % 4 !== 0;
  const hasViewport = seed % 3 !== 0;
  const hasBookingFlow = seed % 5 !== 0;
  const hasChatWidget = seed % 6 === 0;
  const hasAnalytics = seed % 4 !== 1;
  const brokenLinks = seed % 5 === 0 ? 2 : seed % 3 === 0 ? 1 : 0;
  const loadTimeMs = 1200 + (seed % 6) * 650;
  const copyrightYear = currentYear - ((seed % 8) + 1);

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
    pageTitle: `${website.replace("https://", "").split(".")[0]} | Local Services`,
    metaDescription: seed % 4 === 0 ? undefined : "Trusted local provider helping new customers book quickly.",
    hasSsl,
    hasViewport,
    brokenLinks,
    loadTimeMs,
    hasBookingFlow,
    hasChatWidget,
    hasAnalytics,
    copyrightYear,
    hasWebsite: true
  };
}

export function generateMockBusinesses(location: string, niche: string): DirectoryBusiness[] {
  const locationKey = slugify(location) as keyof typeof locationSeeds;
  const nicheKey = slugify(niche) as keyof typeof nicheSeeds;
  const city = locationSeeds[locationKey] ?? locationSeeds.vancouver;
  const names = nicheSeeds[nicheKey] ?? nicheSeeds.dentists;
  const suffixes = suffixSeeds[nicheKey] ?? suffixSeeds.dentists;

  return Array.from({ length: 15 }, (_, index) => {
    const name = `${names[index % names.length]} ${suffixes[index % suffixes.length]}`;
    const streetNumber = 100 + index * 17;
    const area = city.area[index % city.area.length];
    const street = city.street[index % city.street.length];
    const website = index % 7 === 0 ? "No website" : `https://${slugify(name)}.com`;
    const seed = index + location.length + niche.length;
    const offsetScale = 0.038;
    const latitude = city.center.latitude + (((index % 5) - 2) * offsetScale) / 2;
    const longitude = city.center.longitude + ((Math.floor(index / 5) - 1) * offsetScale * 1.2) / 2;

    return {
      id: `${slugify(location)}-${slugify(niche)}-${index + 1}`,
      businessName: name,
      phone: `(${city.areaCode}) 555-${String(1100 + index * 7).slice(-4)}`,
      website,
      address: `${streetNumber} ${street}, ${area}`,
      coordinates: {
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6))
      },
      location,
      niche,
      reviewCount: 8 + ((index * 11) % 95),
      googleRating: Number((3.3 + ((index * 3) % 17) / 10).toFixed(1)),
      signals: makeMockSignals(seed, website)
    };
  });
}
