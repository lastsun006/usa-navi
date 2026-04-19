import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// LINE署名検証
function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const channelSecret = process.env.LINE_CHANNEL_SECRET ?? "";
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

// LAPD犯罪データ取得（800m四方の直近6ヶ月）
async function fetchCrimeData(lat: number, lng: number): Promise<{ crm_cd_desc: string; cnt: string }[]> {
  const offset = { lat: 0.0072, lng: 0.009 }; // 約800m
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const dateStr = sixMonthsAgo.toISOString().split("T")[0];

  const params = new URLSearchParams({
    "$select": "crm_cd_desc,count(*) as cnt",
    "$where": `lat between ${lat - offset.lat} and ${lat + offset.lat} AND lon between ${lng - offset.lng} and ${lng + offset.lng} AND date_occ > '${dateStr}T00:00:00'`,
    "$group": "crm_cd_desc",
    "$order": "cnt DESC",
    "$limit": "20",
  });

  const res = await fetch(`https://data.lacity.org/resource/2nrs-mtv8.json?${params}`);
  if (!res.ok) return [];
  return res.json();
}

// Claudeで治安評価を生成
async function generateSafetyReport(lat: number, lng: number, crimes: { crm_cd_desc: string; cnt: string }[]): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const totalCrimes = crimes.reduce((sum, c) => sum + parseInt(c.cnt || "0"), 0);
  const topCrimes = crimes.slice(0, 5).map(c => `${c.crm_cd_desc}: ${c.cnt}件`).join("\n");
  const crimeText = crimes.length === 0
    ? "この地域の犯罪記録データはありませんでした（LAPDの管轄外の可能性あり）。"
    : `直近6ヶ月の犯罪総数: ${totalCrimes}件\n主な犯罪種別:\n${topCrimes}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: `あなたはLA在住10年以上の日本人として、初めてアメリカを旅行する日本人に治安情報を日本語で教えるアドバイザーです。
LAPDの犯罪データを基に、わかりやすく安全度を評価してください。
以下の形式で回答してください（LINEで読みやすく）：

🔴🟡🟢 安全度：[星1〜5で表示] ★★★☆☆など
📍 エリア概況：[2〜3文で地域の特徴]
⚠️ 注意点：[具体的な注意事項を箇条書き2〜3個]
✅ 安心ポイント：[ポジティブな点1〜2個]
🏨 ホテル選びのヒント：[このエリアでの宿泊についてのアドバイス]`,
    messages: [{
      role: "user",
      content: `以下のLAPD犯罪データを元に、この位置（緯度${lat.toFixed(4)}, 経度${lng.toFixed(4)}）周辺800m以内の治安評価をしてください。\n\n${crimeText}`
    }],
  });

  const content = response.content[0];
  return content.type === "text" ? content.text : "治安情報を取得できませんでした。";
}

// テキストメッセージ用Claude
async function generateReply(userMessage: string): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `あなたは「USA Navi」という初めてアメリカを旅行する日本人をサポートするAIコンシェルジュです。
アメリカ在住10年以上の日本人として、旅行者が「今この状況でどう動けばいいか」を日本語で具体的に案内してください。
英語フレーズが必要な場面では「英語: "..."」の形式で提示してください。
回答は簡潔にまとめてください（LINEで読みやすいよう300文字以内を目安に）。`,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.content[0];
  return content.type === "text" ? content.text : "申し訳ありません、回答できませんでした。";
}

// LINE返信
async function replyToLine(replyToken: string, messages: object[]) {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) {
    console.error("LINE返信エラー:", res.status, await res.text());
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifySignature(body, signature)) {
    console.warn("署名検証失敗");
  }

  const data = JSON.parse(body);

  for (const event of data.events ?? []) {
    if (event.type !== "message") continue;

    const replyToken = event.replyToken;

    // 📍 位置情報メッセージ → 治安チェック
    if (event.message.type === "location") {
      const { latitude, longitude, address } = event.message;

      try {
        // まず「取得中」メッセージを送る（LAPDとClaudeで時間かかるため）
        // ※ replyTokenは1回しか使えないので直接メインの返信を送る
        const crimes = await fetchCrimeData(latitude, longitude);
        const report = await generateSafetyReport(latitude, longitude, crimes);

        const locationLabel = address || `緯度${latitude.toFixed(4)}, 経度${longitude.toFixed(4)}`;
        const fullMessage = `📍 ${locationLabel}\n\n${report}\n\n※ データ出典: LAPD犯罪データ（直近6ヶ月）`;

        await replyToLine(replyToken, [{ type: "text", text: fullMessage }]);
      } catch (error) {
        console.error("治安チェックエラー:", error);
        await replyToLine(replyToken, [{
          type: "text",
          text: "治安情報の取得中にエラーが発生しました。しばらく後に再度お試しください。"
        }]);
      }
    }

    // 💬 テキストメッセージ → AI返答
    else if (event.message.type === "text") {
      const userMessage = event.message.text;

      try {
        const reply = await generateReply(userMessage);
        await replyToLine(replyToken, [{ type: "text", text: reply }]);
      } catch (error) {
        console.error("返答エラー:", error);
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
