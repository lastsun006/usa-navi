// ─────────────────────────────────────────────
// 天気・ニュースアラート取得（共通モジュール）
// cron と onboarding 完了時の両方から使う
// ─────────────────────────────────────────────

export interface Alert {
  shouldNotify: boolean;
  message: string;
}

// ── 天気（open-meteo.com・APIキー不要）──────────
export async function fetchWeatherAlert(): Promise<Alert> {
  const cities = [
    { name: "ロサンゼルス", lat: 34.0522, lon: -118.2437 },
    { name: "アナハイム",   lat: 33.8353, lon: -117.9145 },
    { name: "サンディエゴ", lat: 32.7157, lon: -117.1611 },
  ];

  const alerts: string[] = [];

  for (const city of cities) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}`
        + `&daily=precipitation_sum,temperature_2m_max,weathercode`
        + `&timezone=America%2FLos_Angeles&forecast_days=2`;

      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();

      const precipMm = data.daily.precipitation_sum[1] as number;
      const maxTemp  = data.daily.temperature_2m_max[1] as number;
      const wcode    = data.daily.weathercode[1] as number;

      const isRainy = precipMm > 1 || (wcode >= 51 && wcode <= 67) || (wcode >= 80 && wcode <= 82) || wcode >= 95;
      const isHot   = maxTemp >= 35;

      if (isRainy) alerts.push(`🌧️ ${city.name}：明日は雨の予報（${precipMm.toFixed(0)}mm）。屋外観光は午前中がおすすめ。`);
      if (isHot)   alerts.push(`🌡️ ${city.name}：明日は${Math.round(maxTemp)}℃予報。水分・日焼け止め必須！`);
    } catch { /* 個別エラーは無視 */ }
  }

  if (alerts.length === 0) return { shouldNotify: false, message: "" };
  return {
    shouldNotify: true,
    message: `【SoCal Navi 天気アラート☀️】\n${alerts.join("\n")}\n\n─\n配信停止は「配信停止」と送信`,
  };
}

// ── ニュース（Google News RSS・APIキー不要）──────
const NEWS_KEYWORDS = ["protest", "demonstration", "road closure", "freeway closure", "wildfire", "evacuation", "shooting", "emergency"];
const NEWS_KEYWORDS_JA: Record<string, string> = {
  protest:           "デモ",
  demonstration:     "デモ",
  "road closure":    "道路閉鎖",
  "freeway closure": "フリーウェイ閉鎖",
  wildfire:          "山火事",
  evacuation:        "避難指示",
  shooting:          "銃撃事件",
  emergency:         "緊急事態",
};

export async function fetchNewsAlert(): Promise<Alert> {
  try {
    const query = encodeURIComponent("Los Angeles OR Anaheim OR San Diego " + NEWS_KEYWORDS.join(" OR "));
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    const res = await fetch(rssUrl, { headers: { "User-Agent": "SoCalNavi/1.0" } });
    if (!res.ok) return { shouldNotify: false, message: "" };

    const xml = await res.text();
    const titles = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)]
      .map(m => m[1])
      .filter(t => !t.includes("Google News"))
      .slice(0, 10);

    const matched: string[] = [];
    for (const title of titles) {
      const lower = title.toLowerCase();
      for (const kw of NEWS_KEYWORDS) {
        if (lower.includes(kw)) {
          matched.push(`・${NEWS_KEYWORDS_JA[kw] ?? kw}：${title}`);
          break;
        }
      }
    }

    if (matched.length === 0) return { shouldNotify: false, message: "" };
    return {
      shouldNotify: true,
      message: `【SoCal Navi 安全情報⚠️】\n${matched.slice(0, 3).join("\n")}\n\n外出前に最新情報をご確認ください。\n\n─\n配信停止は「配信停止」と送信`,
    };
  } catch {
    return { shouldNotify: false, message: "" };
  }
}
