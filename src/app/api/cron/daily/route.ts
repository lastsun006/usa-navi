import { NextRequest, NextResponse } from "next/server";
import { getUsersWithNotification } from "@/lib/supabase";
import { fetchWeatherAlert, fetchNewsAlert } from "@/lib/daily-alerts";

// ─────────────────────────────────────────────
// LINE Push Message
// ─────────────────────────────────────────────
async function pushToUser(lineUserId: string, text: string) {
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text }],
    }),
  });
}

// ─────────────────────────────────────────────
// Cron エンドポイント（毎朝7時 PT = 14:00 UTC）
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // Vercel Cron の署名確認
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 天気・ニュースを並列取得
  const [weather, news] = await Promise.all([fetchWeatherAlert(), fetchNewsAlert()]);

  let weatherSent = 0;
  let newsSent = 0;

  // 天気通知ユーザーへ送信
  if (weather.shouldNotify) {
    const users = await getUsersWithNotification("weather");
    await Promise.all(users.map(u => pushToUser(u.line_user_id, weather.message)));
    weatherSent = users.length;
  }

  // ニュース通知ユーザーへ送信
  if (news.shouldNotify) {
    const users = await getUsersWithNotification("news");
    await Promise.all(users.map(u => pushToUser(u.line_user_id, news.message)));
    newsSent = users.length;
  }

  return NextResponse.json({
    ok: true,
    weather: { notified: weather.shouldNotify, sent: weatherSent },
    news:    { notified: news.shouldNotify,    sent: newsSent },
  });
}
