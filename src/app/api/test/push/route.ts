import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherAlert, fetchNewsAlert } from "@/lib/daily-alerts";

// ─────────────────────────────────────────────
// デバッグ用テストエンドポイント
// GET /api/test/push?secret=xxxx&to=U1234567890
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const lineUserId = searchParams.get("to");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!lineUserId) {
    return NextResponse.json({ error: "to パラメータ（LINE User ID）が必要です" }, { status: 400 });
  }

  const results: Record<string, unknown> = {};

  // 1. 天気アラート取得テスト
  try {
    const weather = await fetchWeatherAlert();
    results.weather = { ok: true, shouldNotify: weather.shouldNotify, messageLength: weather.message.length };

    // Pushテスト
    const weatherText = weather.shouldNotify
      ? weather.message
      : "☀️ テスト送信：今日のSoCal は特に悪天候の予報はありません。";

    const pushRes = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text: weatherText }] }),
    });
    const pushBody = await pushRes.text();
    results.weatherPush = { status: pushRes.status, body: pushBody };
  } catch (e) {
    results.weather = { ok: false, error: String(e) };
  }

  // 2. ニュースアラート取得テスト
  try {
    const news = await fetchNewsAlert();
    results.news = { ok: true, shouldNotify: news.shouldNotify, messageLength: news.message.length };

    const newsText = news.shouldNotify
      ? news.message
      : "✅ テスト送信：現在デモ・道路閉鎖・緊急事態などの情報はありません。";

    const pushRes = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text: newsText }] }),
    });
    const pushBody = await pushRes.text();
    results.newsPush = { status: pushRes.status, body: pushBody };
  } catch (e) {
    results.news = { ok: false, error: String(e) };
  }

  return NextResponse.json(results);
}
