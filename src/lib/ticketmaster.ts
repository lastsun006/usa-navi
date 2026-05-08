// Ticketmaster Discovery API

export interface TmEvent {
  name: string;
  date: string;       // "2025-06-15"
  time: string;       // "19:30"
  venue: string;
  city: string;
  priceMin?: number;
  priceMax?: number;
  url: string;
  genre?: string;
  image?: string;
}

export async function searchEvents(
  keyword: string,
  options: {
    city?: string;
    classificationName?: string; // "music" | "sports" | "arts" | "family"
    size?: number;
    daysAhead?: number;
  } = {}
): Promise<TmEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return [];

  const { city = "Los Angeles", size = 5, daysAhead = 30 } = options;

  const now = new Date();
  const end = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const startDateTime = now.toISOString().replace(".000", "");
  const endDateTime = end.toISOString().replace(".000", "");

  const params = new URLSearchParams({
    apikey: apiKey,
    keyword,
    city,
    stateCode: "CA",
    countryCode: "US",
    startDateTime,
    endDateTime,
    size: String(size),
    sort: "date,asc",
  });

  if (options.classificationName) {
    params.set("classificationName", options.classificationName);
  }

  try {
    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    const events = data._embedded?.events ?? [];

    return events.map((e: Record<string, unknown>) => {
      const dates = e.dates as Record<string, unknown>;
      const start = dates?.start as Record<string, unknown>;
      const venues = (e._embedded as Record<string, unknown>)?.venues as Record<string, unknown>[];
      const venue = venues?.[0];
      const prices = e.priceRanges as Record<string, unknown>[] | undefined;
      const classifications = e.classifications as Record<string, unknown>[] | undefined;
      const images = e.images as Record<string, unknown>[] | undefined;

      return {
        name: e.name as string,
        date: (start?.localDate as string) ?? "",
        time: (start?.localTime as string) ?? "",
        venue: (venue?.name as string) ?? "",
        city: ((venue?.city as Record<string, unknown>)?.name as string) ?? city,
        priceMin: prices?.[0]?.min as number | undefined,
        priceMax: prices?.[0]?.max as number | undefined,
        url: e.url as string,
        genre: (classifications?.[0]?.genre as Record<string, unknown>)?.name as string | undefined,
        image: images?.find((img: Record<string, unknown>) => img.ratio === "16_9" && (img.width as number) > 500)?.url as string | undefined,
      };
    });
  } catch {
    return [];
  }
}

export function formatEventsForClaude(events: TmEvent[]): string {
  if (events.length === 0) return "該当するイベントが見つかりませんでした。";

  return events.map(e => {
    const dateStr = e.date
      ? new Date(e.date + "T12:00:00").toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })
      : "日程未定";
    const timeStr = e.time ? e.time.slice(0, 5) : "";
    const priceStr = e.priceMin
      ? `$${e.priceMin}〜$${e.priceMax ?? e.priceMin}`
      : "価格未定";

    return [
      `📅 ${e.name}`,
      `　日時：${dateStr}${timeStr ? " " + timeStr : ""}`,
      `　会場：${e.venue}（${e.city}）`,
      `　料金：${priceStr}`,
      `　チケット：${e.url}`,
    ].join("\n");
  }).join("\n\n");
}
