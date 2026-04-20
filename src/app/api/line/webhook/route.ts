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

【回答ルール・厳守】
- 200文字以内に必ず収める
- 表・箇条書きの多用禁止。シンプルな文章で
- 「何かご不明な点は？」などの締めの言葉は不要
- 最重要ポイントを1〜2個に絞って伝える
- LINEのチャットで自然に読めるトーンで
- 英語フレーズが必要な時のみ「英語:"..."」を添える

【重要な現地知識 - 必ずこの情報を使うこと】

■ LAX（ロサンゼルス国際空港）のUber/Lyft乗り場：
- ターミナルの目の前では乗れない。必ず「LAX-it（ラックスイット）」という専用乗り場へ移動が必要。
- 手順：到着ロビーを出る→無料シャトルバス「LAX Shuttle G」に乗る→約5〜10分でLAX-itロットに到着→そこでUber/Lyftを呼ぶ
- シャトル乗り場：各ターミナルの外（Lower Level）にある「LAX Shuttle & Airline Connections」の標識に従う
- LAX-itでアプリを開いて車を呼ぶ。ピックアップポイントの指定画面が出るので従う
- 所要時間：シャトル待ち＋乗車で15〜20分見ておく

■ LAXからの交通手段まとめ：
- Uber/Lyft：$30〜50（渋滞次第）→LAX-it経由必須
- メトロ（Cライン）：$1.75→安いが乗り換えあり・荷物多いと大変
- フライアウェイバス：$9.75→ユニオンステーション直行で便利
- ホテルシャトル：無料の場合あり→事前確認を
- タクシー：割高なのでUber/Lyft推奨`,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.content[0];
  return content.type === "text" ? content.text : "申し訳ありません、回答できませんでした。";
}

// メッセージ内容からユースケースを判定してクイックリプライを返す
function getQuickReply(userMessage: string) {
  const msg = userMessage;

  // 各UCのキーワード
  const isLAX     = /LAX|空港|フライト|到着|出発|乗り場/.test(msg);
  const isDodgers = /ドジャース|野球|スタジアム|MLB/.test(msg);
  const isFood    = /レストラン|グルメ|食事|食べ|ランチ|ディナー/.test(msg);
  const isFamily  = /家族|子供|子ども|子連れ|ベビー|キッズ/.test(msg);
  const isDisney  = /ディズニー|Disney|アナハイム/.test(msg);
  const isSafety  = /治安|安全|危険|ホテル|エリア/.test(msg);

  // そのUC以外の4つをレコメンドとして出す
  const all = [
    { label: "LAX移動",     text: "LAXから市内への行き方を教えて" },
    { label: "ドジャース",   text: "ドジャースタジアムの楽しみ方を教えて" },
    { label: "レストラン",   text: "LAのおすすめレストランを教えて" },
    { label: "家族旅行",     text: "子連れ家族旅行のアドバイスをして" },
    { label: "ディズニー",   text: "ディズニーランドの攻略法を教えて" },
    { label: "治安チェック", text: "治安チェック：位置情報ピンを送ってください（+ボタン→位置情報）" },
  ];

  // 現在のUCを除外してシャッフルせず先頭4つ
  const current = isLAX ? 0 : isDodgers ? 1 : isFood ? 2 : isFamily ? 3 : isDisney ? 4 : isSafety ? 5 : -1;
  const recommendations = all.filter((_, i) => i !== current).slice(0, 4);

  return {
    items: recommendations.map(r => ({
      type: "action",
      action: { type: "message", label: r.label, text: r.text },
    })),
  };
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

        const quickReply = {
          items: [
            { type: "action", action: { type: "message", label: "LAX移動",   text: "LAXから市内への行き方を教えて" } },
            { type: "action", action: { type: "message", label: "レストラン", text: "LAのおすすめレストランを教えて" } },
            { type: "action", action: { type: "message", label: "ディズニー", text: "ディズニーランドの攻略法を教えて" } },
            { type: "action", action: { type: "message", label: "ドジャース", text: "ドジャースタジアムの楽しみ方を教えて" } },
          ],
        };
        await replyToLine(replyToken, [{ type: "text", text: report + footer, quickReply }]);
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
        const quickReply = getQuickReply(userMessage);
        await replyToLine(replyToken, [{ type: "text", text: reply, quickReply }]);
      } catch (error) {
        console.error("返答エラー:", error);
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
