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

// 逆ジオコーディング（Nominatim / OpenStreetMap）
interface NominatimResult {
  display_name: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

async function reverseGeocode(lat: number, lng: number): Promise<NominatimResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "User-Agent": "USANavi/1.0 (travel-assistant-app)" } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
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

// Claudeで治安評価を生成（住所情報＋LAPDデータを両方活用）
async function generateSafetyReport(
  lat: number,
  lng: number,
  crimes: { crm_cd_desc: string; cnt: string }[],
  geoInfo: NominatimResult | null,
  lineAddress: string | undefined
): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // エリア情報を組み立て
  const addr = geoInfo?.address;
  const city = addr?.city || addr?.town || addr?.village || "不明";
  const neighbourhood = addr?.neighbourhood || addr?.suburb || "";
  const county = addr?.county || "";
  const state = addr?.state || "";
  const fullLocation = [neighbourhood, city, county, state].filter(Boolean).join(", ");

  // LAPD犯罪データ
  const totalCrimes = crimes.reduce((sum, c) => sum + parseInt(c.cnt || "0"), 0);
  const topCrimes = crimes.slice(0, 5).map(c => `  ・${c.crm_cd_desc}: ${c.cnt}件`).join("\n");

  const lapdText = crimes.length === 0
    ? "LAPDのデータなし（LAPD管轄外のエリア：オレンジ郡・サンタモニカ市・ビバリーヒルズ市などは独自の警察が管轄）"
    : `直近6ヶ月の犯罪総数: ${totalCrimes}件\n主な犯罪:\n${topCrimes}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 700,
    system: `あなたはLA・南カリフォルニア在住10年以上の日本人として、初めてアメリカを旅行する日本人に治安情報を日本語で教えるアドバイザーです。

以下の2つの観点を組み合わせて治安評価してください：
1. 住所・エリア名から判断できる地域の特性（あなたの知識）
2. LAPDの実際の犯罪データ（ただしLAPD管轄外エリアはデータなし）

回答形式（LINEで読みやすく簡潔に）：
📍 エリア：[特定した場所名]
🔒 安全度：★★★★★（5段階）
📊 データ：[LAPDデータの有無と概要、または管轄外の説明]
⚠️ 注意：[箇条書き2〜3個]
✅ 安心：[1〜2個]
🏨 ホテルヒント：[このエリアの宿泊アドバイス]`,
    messages: [{
      role: "user",
      content: `【位置情報】
緯度: ${lat.toFixed(5)}, 経度: ${lng.toFixed(5)}
LINEの住所: ${lineAddress || "なし"}
逆ジオコーディング結果: ${fullLocation || geoInfo?.display_name || "取得失敗"}

【LAPDデータ】
${lapdText}

上記を踏まえてこのエリアの治安評価をしてください。`
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
        // 逆ジオコーディング＋LAPDデータを並列取得
        const [geoInfo, crimes] = await Promise.all([
          reverseGeocode(latitude, longitude),
          fetchCrimeData(latitude, longitude),
        ]);

        const report = await generateSafetyReport(latitude, longitude, crimes, geoInfo, address);
        const footer = crimes.length > 0
          ? "\n\n※ データ出典: LAPD犯罪データ（直近6ヶ月）"
          : "\n\n※ このエリアはLAPD管轄外のため、エリア特性とClaude AIの知識をもとに評価しています";

        await replyToLine(replyToken, [{ type: "text", text: report + footer }]);
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
