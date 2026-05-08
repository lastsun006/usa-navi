export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getUsersWithNotification } from "@/lib/supabase";
import { searchEvents, formatEventsForClaude } from "@/lib/ticketmaster";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
// 今日のおすすめ情報を生成
// ─────────────────────────────────────────────
async function generateTodayRecommend(): Promise<string> {
  // Ticketmasterで直近イベント検索
  const [dodgersEvt, lakersEvt, musicEvt] = await Promise.all([
    searchEvents("Dodgers", { daysAhead: 3, size: 2 }),
    searchEvents("Lakers",  { daysAhead: 3, size: 2 }),
    searchEvents("concert", { daysAhead: 3, size: 3, classificationName: "music" }),
  ]);
  const allEvents = [...dodgersEvt, ...lakersEvt, ...musicEvt];
  const eventsText = allEvents.length > 0 ? formatEventsForClaude(allEvents) : "";

  const today = new Date().toLocaleDateString("ja-JP", {
    timeZone: "America/Los_Angeles",
    month: "long", day: "numeric", weekday: "short",
  });

  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `今日（${today}、カリフォルニア時間）の南カリフォルニア旅行者向けおすすめ情報を3つ教えてください。\n${eventsText ? `\n【直近イベント情報】\n${eventsText}\n\n上記を優先的に含めて` : ""}ドジャース・レイカーズ・大型コンサート・観光・グルメなど。絵文字で読みやすく、各項目2〜3行で。`,
    }],
  });

  return res.content[0].type === "text"
    ? res.content[0].text.trim()
    : "今日もSoCalを楽しんでください！☀️";
}

// ─────────────────────────────────────────────
// Cron エンドポイント（毎朝7時 PT = 15:00 UTC）
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // おすすめ情報通知ユーザーを取得
  const users = await getUsersWithNotification("recommend");

  if (users.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // 今日のおすすめ情報を生成（全ユーザー共通）
  const todayInfo = await generateTodayRecommend();
  const message = `☀️ おはようございます！今日のSoCal おすすめ情報\n\n${todayInfo}\n\n配信停止は「配信停止」と送ってください。`;

  // 全ユーザーにpush
  let sent = 0;
  for (const user of users) {
    try {
      await pushToUser(user.line_user_id, message);
      sent++;
    } catch (e) {
      console.error("Push失敗:", user.line_user_id, e);
    }
  }

  return NextResponse.json({ ok: true, sent, total: users.length });
}
