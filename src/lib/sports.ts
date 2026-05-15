// Sports schedule fetchers - MLB (official) + NBA (ESPN unofficial)

export interface Game {
  sport: "baseball" | "basketball";
  date: string;       // "2026-05-15"
  time: string;       // "19:10 PT"
  home: string;
  away: string;
  venue: string;
  status: string;     // "Scheduled" | "Final" | "In Progress"
  homeScore?: number;
  awayScore?: number;
}

// ─── MLB (Dodgers teamId=119) ───────────────────────────────────────────────
export async function getDodgersSchedule(startDate: string, endDate: string): Promise<Game[]> {
  try {
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=119&startDate=${startDate}&endDate=${endDate}&hydrate=team,venue,game(content(summary))&language=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();

    const games: Game[] = [];
    for (const day of data.dates ?? []) {
      for (const g of day.games ?? []) {
        const dtUtc = new Date(g.gameDate);
        const timePT = dtUtc.toLocaleTimeString("en-US", {
          timeZone: "America/Los_Angeles",
          hour: "2-digit", minute: "2-digit", hour12: true,
        });
        games.push({
          sport: "baseball",
          date: day.date,
          time: `${timePT} PT`,
          home: g.teams?.home?.team?.name ?? "",
          away: g.teams?.away?.team?.name ?? "",
          venue: g.venue?.name ?? "Dodger Stadium",
          status: g.status?.detailedState ?? "Scheduled",
          homeScore: g.teams?.home?.score,
          awayScore: g.teams?.away?.score,
        });
      }
    }
    return games;
  } catch {
    return [];
  }
}

// ─── NBA (Lakers teamId=lal) via ESPN unofficial API ────────────────────────
export async function getLakersSchedule(startDate: string, endDate: string): Promise<Game[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/lal/schedule`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);

    const games: Game[] = [];
    for (const event of data.events ?? []) {
      const gameDate = new Date(event.date);
      if (gameDate < start || gameDate > end) continue;

      const comp = event.competitions?.[0];
      const home = comp?.competitors?.find((c: { homeAway: string }) => c.homeAway === "home");
      const away = comp?.competitors?.find((c: { homeAway: string }) => c.homeAway === "away");
      const timePT = gameDate.toLocaleTimeString("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "2-digit", minute: "2-digit", hour12: true,
      });
      const datePT = gameDate.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

      games.push({
        sport: "basketball",
        date: datePT,
        time: `${timePT} PT`,
        home: home?.team?.displayName ?? "",
        away: away?.team?.displayName ?? "",
        venue: comp?.venue?.fullName ?? "Crypto.com Arena",
        status: comp?.status?.type?.description ?? "Scheduled",
        homeScore: home?.score ? parseInt(home.score) : undefined,
        awayScore: away?.score ? parseInt(away.score) : undefined,
      });
    }
    return games;
  } catch {
    return [];
  }
}

// ─── フォーマット（LINEに送るテキスト用）──────────────────────────────────
export function formatGamesForLine(dodgers: Game[], lakers: Game[]): string {
  const lines: string[] = [];

  // ドジャース
  lines.push("⚾ ドジャース今週の試合");
  if (dodgers.length === 0) {
    lines.push("・今週は試合なし（またはオフ）");
  } else {
    for (const g of dodgers) {
      const dateJa = new Date(g.date + "T12:00:00").toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
      const opponent = g.home.includes("Dodgers") ? `vs ${g.away}` : `@ ${g.home}`;
      const score = g.homeScore !== undefined
        ? ` → ${g.home.includes("Dodgers") ? g.homeScore : g.awayScore} - ${g.home.includes("Dodgers") ? g.awayScore : g.homeScore} (${g.status})`
        : "";
      lines.push(`・${dateJa} ${g.time} ${opponent}${score}`);
      lines.push(`　会場：${g.venue}`);
    }
  }
  lines.push("　チケット：https://www.mlb.com/dodgers/tickets");

  lines.push("");

  // レイカーズ
  lines.push("🏀 レイカーズ今週の試合");
  if (lakers.length === 0) {
    lines.push("・今週は試合なし（またはオフシーズン）");
  } else {
    for (const g of lakers) {
      const dateJa = new Date(g.date + "T12:00:00").toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
      const opponent = g.home.includes("Lakers") ? `vs ${g.away}` : `@ ${g.home}`;
      const score = g.homeScore !== undefined
        ? ` → ${g.home.includes("Lakers") ? g.homeScore : g.awayScore} - ${g.home.includes("Lakers") ? g.awayScore : g.homeScore} (${g.status})`
        : "";
      lines.push(`・${dateJa} ${g.time} ${opponent}${score}`);
      lines.push(`　会場：${g.venue}`);
    }
  }
  lines.push("　チケット：https://www.nba.com/lakers/tickets");

  return lines.join("\n");
}
