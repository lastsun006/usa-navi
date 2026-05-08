// Google Places API (New) ラッパー

export interface PlaceResult {
  name: string;
  address: string;
  rating?: number;
  totalRatings?: number;
  phone?: string;
  website?: string;
  isOpenNow?: boolean;
  todayHours?: string;
  priceLevel?: string;
}

export async function searchPlaces(query: string, maxResults = 3): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY未設定");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.displayName",
        "places.formattedAddress",
        "places.rating",
        "places.userRatingCount",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.currentOpeningHours",
        "places.priceLevel",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: maxResults,
      languageCode: "ja",
    }),
  });

  if (!res.ok) throw new Error(`Google Places API error: ${res.status}`);
  const data = await res.json();
  const places = data.places ?? [];

  return places.map((p: Record<string, unknown>) => {
    const hours = p.currentOpeningHours as Record<string, unknown> | undefined;
    const weekdayText = (hours?.weekdayDescriptions as string[] | undefined) ?? [];
    const todayIndex = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "long" });
    const todayHours = weekdayText.find(h => h.toLowerCase().startsWith(todayIndex.toLowerCase())) ?? weekdayText[0];
    const priceLevelMap: Record<string, string> = {
      PRICE_LEVEL_FREE: "無料",
      PRICE_LEVEL_INEXPENSIVE: "$",
      PRICE_LEVEL_MODERATE: "$$",
      PRICE_LEVEL_EXPENSIVE: "$$$",
      PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
    };
    return {
      name: (p.displayName as { text: string } | undefined)?.text ?? "",
      address: (p.formattedAddress as string | undefined) ?? "",
      rating: p.rating as number | undefined,
      totalRatings: p.userRatingCount as number | undefined,
      phone: p.nationalPhoneNumber as string | undefined,
      website: p.websiteUri as string | undefined,
      isOpenNow: (hours?.openNow as boolean | undefined),
      todayHours,
      priceLevel: priceLevelMap[p.priceLevel as string] ?? undefined,
    };
  });
}

// 現在地周辺のレストラン検索
export async function searchNearbyRestaurants(lat: number, lng: number, maxResults = 5, keyword?: string): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  // キーワード指定の場合はsearchTextで近傍検索
  if (keyword) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "places.displayName","places.formattedAddress","places.rating",
          "places.userRatingCount","places.nationalPhoneNumber","places.websiteUri",
          "places.currentOpeningHours","places.priceLevel",
        ].join(","),
      },
      body: JSON.stringify({
        textQuery: keyword,
        maxResultCount: maxResults,
        languageCode: "ja",
        locationBias: {
          circle: { center: { latitude: lat, longitude: lng }, radius: 2000.0 },
        },
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const places = data.places ?? [];
    return places.map((p: Record<string, unknown>) => {
      const hours = p.currentOpeningHours as Record<string, unknown> | undefined;
      const weekdayText = (hours?.weekdayDescriptions as string[] | undefined) ?? [];
      const todayIndex = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "long" });
      const todayHours = weekdayText.find(h => h.toLowerCase().startsWith(todayIndex.toLowerCase())) ?? weekdayText[0];
      const priceLevelMap: Record<string, string> = { PRICE_LEVEL_INEXPENSIVE: "$", PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$", PRICE_LEVEL_VERY_EXPENSIVE: "$$$$" };
      return {
        name: (p.displayName as { text: string } | undefined)?.text ?? "",
        address: (p.formattedAddress as string | undefined) ?? "",
        rating: p.rating as number | undefined,
        totalRatings: p.userRatingCount as number | undefined,
        phone: p.nationalPhoneNumber as string | undefined,
        website: p.websiteUri as string | undefined,
        isOpenNow: (hours?.openNow as boolean | undefined),
        todayHours,
        priceLevel: priceLevelMap[p.priceLevel as string] ?? undefined,
      };
    });
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.displayName",
        "places.formattedAddress",
        "places.rating",
        "places.userRatingCount",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.currentOpeningHours",
        "places.priceLevel",
      ].join(","),
    },
    body: JSON.stringify({
      includedTypes: ["restaurant"],
      maxResultCount: maxResults,
      languageCode: "ja",
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 800.0,
        },
      },
      rankPreference: "POPULARITY",
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const places = data.places ?? [];

  return places.map((p: Record<string, unknown>) => {
    const hours = p.currentOpeningHours as Record<string, unknown> | undefined;
    const weekdayText = (hours?.weekdayDescriptions as string[] | undefined) ?? [];
    const todayIndex = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "long" });
    const todayHours = weekdayText.find(h => h.toLowerCase().startsWith(todayIndex.toLowerCase())) ?? weekdayText[0];
    const priceLevelMap: Record<string, string> = {
      PRICE_LEVEL_INEXPENSIVE: "$",
      PRICE_LEVEL_MODERATE: "$$",
      PRICE_LEVEL_EXPENSIVE: "$$$",
      PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
    };
    return {
      name: (p.displayName as { text: string } | undefined)?.text ?? "",
      address: (p.formattedAddress as string | undefined) ?? "",
      rating: p.rating as number | undefined,
      totalRatings: p.userRatingCount as number | undefined,
      phone: p.nationalPhoneNumber as string | undefined,
      website: p.websiteUri as string | undefined,
      isOpenNow: (hours?.openNow as boolean | undefined),
      todayHours,
      priceLevel: priceLevelMap[p.priceLevel as string] ?? undefined,
    };
  });
}

export function formatPlacesForClaude(places: PlaceResult[]): string {
  return places.map((p, i) => {
    const parts = [`${i + 1}. ${p.name}`];
    if (p.rating) parts.push(`⭐ ${p.rating}（${p.totalRatings?.toLocaleString()}件）`);
    if (p.priceLevel) parts.push(`💰 ${p.priceLevel}`);
    if (p.isOpenNow !== undefined) parts.push(p.isOpenNow ? "🟢 営業中" : "🔴 営業時間外");
    if (p.todayHours) parts.push(`🕐 ${p.todayHours}`);
    if (p.phone) parts.push(`📞 ${p.phone}`);
    if (p.address) parts.push(`📍 ${p.address}`);
    if (p.website) parts.push(`🌐 ${p.website}`);
    return parts.join("\n");
  }).join("\n\n");
}
