import { env } from "@/lib/env";
import { generateMockBusinesses, makeMockSignals } from "@/lib/mockData";
import { DirectoryBusiness, SearchInput } from "@/lib/types";
import { slugify } from "@/lib/utils";

export async function searchBusinessDirectory(input: SearchInput): Promise<DirectoryBusiness[]> {
  const liveMatches = await searchGooglePlaces(input);
  const matches = liveMatches.length > 0 ? liveMatches : generateMockBusinesses(input.location, input.niche);

  return matches.filter((business) => {
    if (typeof input.minimumReviewCount === "number") {
      if (business.reviewCount < input.minimumReviewCount) return false;
    }

    if (input.websiteStatus === "has-website" && business.website === "No website") return false;
    if (input.websiteStatus === "no-website" && business.website !== "No website") return false;

    if (input.businessSize === "solo" && business.reviewCount > 40) return false;
    if (input.businessSize === "small-team" && (business.reviewCount < 20 || business.reviewCount > 120)) return false;
    if (input.businessSize === "multi-location" && business.reviewCount < 80) return false;

    return true;
  });
}

async function searchGooglePlaces(input: SearchInput): Promise<DirectoryBusiness[]> {
  if (!env.googlePlacesApiKey) {
    return [];
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.googlePlacesApiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.location"
      },
      body: JSON.stringify({
        textQuery: `${input.location} ${input.niche}`,
        pageSize: 12
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        websiteUri?: string;
        nationalPhoneNumber?: string;
        rating?: number;
        userRatingCount?: number;
        location?: {
          latitude?: number;
          longitude?: number;
        };
      }>;
    };

    return (payload.places ?? []).map((place, index) => {
      const businessName = place.displayName?.text || `${input.niche} business ${index + 1}`;
      const website = place.websiteUri || "No website";
      const reviewCount = place.userRatingCount ?? 0;
      const seed = input.location.length + input.niche.length + index * 13;

      return {
        id: place.id || `${slugify(input.location)}-${slugify(input.niche)}-${index + 1}`,
        businessName,
        phone: place.nationalPhoneNumber || "Phone unavailable",
        website,
        address: place.formattedAddress || `${input.location}`,
        coordinates: {
          latitude: place.location?.latitude ?? 0,
          longitude: place.location?.longitude ?? 0
        },
        location: input.location,
        niche: input.niche,
        reviewCount,
        googleRating: place.rating ?? 0,
        signals: makeMockSignals(seed, website)
      };
    });
  } catch {
    return [];
  }
}
