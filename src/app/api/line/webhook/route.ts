import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getOrCreateUser, updateUser, UserProfile } from "@/lib/supabase";

export const maxDuration = 60;

// LINE署名検証
function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const channelSecret = process.env.LINE_CHANNEL_SECRET ?? "";
  const hash = crypto.createHmac("SHA256", channelSecret).update(body).digest("base64");
  return hash === signature;
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
  if (!res.ok) console.error("LINE返信エラー:", res.status, await res.text());
}

// ──────────────────────────────────────
// オンボーディング
// ──────────────────────────────────────
async function handleOnboarding(replyToken: string, user: UserProfile, message: string) {
  const step = user.onboarding_step;

  // Step 0: 最初の挨拶 → 年齢を聞く
  if (step === 0) {
    await updateUser(user.line_user_id, { onboarding_step: 1 });
    await replyToLine(replyToken, [{
      type: "text",
      text: "はじめまして！USA Naviです🇺🇸\nより良いご案内のために、いくつか教えてください。（答えたくない項目はスキップできます）\n\nまず、年齢を教えてください👇",
      quickReply: {
        items: [
          { type: "action", action: { type: "message", label: "10代以下", text: "__age_10代以下" } },
          { type: "action", action: { type: "message", label: "20代",   text: "__age_20代" } },
          { type: "action", action: { type: "message", label: "30代",   text: "__age_30代" } },
          { type: "action", action: { type: "message", label: "40代",   text: "__age_40代" } },
          { type: "action", action: { type: "message", label: "50代以上", text: "__age_50代以上" } },
          { type: "action", action: { type: "message", label: "答えない", text: "__age_skip" } },
        ],
      },
    }]);
    return;
  }

  // Step 1: 年齢を受け取る → 目的を聞く
  if (step === 1) {
    const ageGroup = message.startsWith("__age_") ? message.replace("__age_", "") : null;
    await updateUser(user.line_user_id, {
      age_group: ageGroup === "skip" ? null : ageGroup,
      onboarding_step: 2,
    });
    await replyToLine(replyToken, [{
      type: "text",
      text: "ありがとうございます！\n次に、旅の目的を教えてください👇",
      quickReply: {
        items: [
          { type: "action", action: { type: "message", label: "家族旅行", text: "__purpose_家族旅行" } },
          { type: "action", action: { type: "message", label: "カップル", text: "__purpose_カップル" } },
          { type: "action", action: { type: "message", label: "友達と",  text: "__purpose_友達と" } },
          { type: "action", action: { type: "message", label: "一人旅",  text: "__purpose_一人旅" } },
          { type: "action", action: { type: "message", label: "仕事",    text: "__purpose_仕事" } },
          { type: "action", action: { type: "message", label: "答えない", text: "__purpose_skip" } },
        ],
      },
    }]);
    return;
  }

  // Step 2: 目的を受け取る → 完了
  if (step === 2) {
    const purpose = message.startsWith("__purpose_") ? message.replace("__purpose_", "") : null;
    await updateUser(user.line_user_id, {
      travel_purpose: purpose === "skip" ? null : purpose,
      onboarding_done: true,
      onboarding_step: 3,
    });

    const purposeLabel = purpose && purpose !== "skip" ? purpose : "旅行";
    await replyToLine(replyToken, [{
      type: "text",
      text: `ありがとうございます！${purposeLabel}を思いっきり楽しめるようサポートします🎉\n\n下のメニューから気になるカテゴリを選んでください👇`,
    }]);
    return;
  }
}

// ──────────────────────────────────────
// Claude AI 返答生成
// ──────────────────────────────────────
async function generateReply(userMessage: string, profile: UserProfile): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // プロフィール情報をプロンプトに反映
  const profileContext = [
    profile.age_group ? `ユーザーの年齢帯: ${profile.age_group}` : "",
    profile.travel_purpose ? `旅の目的: ${profile.travel_purpose}` : "",
  ].filter(Boolean).join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `あなたは「USA Navi」という初めてアメリカを旅行する日本人をサポートするAIコンシェルジュです。
アメリカ在住10年以上の日本人として、旅行者が「今この状況でどう動けばいいか」を日本語で具体的に案内してください。

【ユーザープロフィール】
${profileContext || "プロフィール未設定"}

【回答ルール・厳守】
- 200文字以内に必ず収める
- 表・箇条書きの多用禁止。シンプルな文章で
- 「何かご不明な点は？」などの締めの言葉は不要
- 最重要ポイントを1〜2個に絞って伝える
- LINEのチャットで自然に読めるトーンで
- 英語フレーズが必要な時のみ「英語:"..."」を添える
- プロフィールがある場合はそれに合わせた情報を優先する
  例：家族旅行→子連れ目線、20代カップル→デート向けスポット

【重要な現地知識】

■ LAX（ロサンゼルス国際空港）のUber/Lyft乗り場：
- ターミナルの目の前では乗れない。必ず「LAX-it（ラックスイット）」という専用乗り場へ移動が必要。
- 手順：到着ロビーを出る→無料シャトルバス「LAX Shuttle G」に乗る→約5〜10分でLAX-itロットに到着→そこでUber/Lyftを呼ぶ
- 所要時間：シャトル待ち＋乗車で15〜20分見ておく

■ LAXからの交通手段まとめ：
- Uber/Lyft：$30〜50（渋滞次第）→LAX-it経由必須
- メトロ（Cライン）：$1.75→安いが乗り換えあり・荷物多いと大変
- フライアウェイバス：$9.75→ユニオンステーション直行で便利
- ホテルシャトル：無料の場合あり→事前確認を
- タクシー：割高なのでUber/Lyft推奨

■ お土産：用途別おすすめ
【自分用・こだわり派】
- Trader Joe's クッキーバター：日本未上陸、絶対買うべき
- Trader Joe's エコバッグ：$2以下でおしゃれ
- Erewhon トートバッグ：セレブ御用達スーパー、インスタ映え
- In-N-Out Tシャツ・キャップ：西海岸限定
【会社用バラまき】
- CVS/Walgreens：Reese's・Hershey'sなど大量買い、1袋$3〜5
- Trader Joe's ジャンブルGummies：大袋でコスパ最高
- See's Candies：個包装チョコのボックス
【友達・家族へ】
- See's Candies ボックス：LA老舗チョコ、LAX・モール内にある
- ドジャースグッズ：大谷翔平人気で今が一番ウケる、キャップ$40前後
- ディズニーランドのパーク限定グッズ
【ローカル・穴場】
- Intelligentsia Coffee：LA発の有名コーヒー豆
- Tajín：メキシカンスパイス$3、LA飯に欠かせない調味料
- Guittard Chocolate：製菓好きに刺さる本格チョコ

■ LAのショッピングスポット：
- Citadel Outlets：LAX近く・Coach・Nike等が安い
- Desert Hills Premium Outlets：ブランド品が大幅割引
- The Grove：おしゃれなオープンモール
- Third Street Promenade：サンタモニカ・屋外歩行者天国
- Rodeo Drive：ビバリーヒルズ・超高級ブランド街

■ アメリカのチップとマナー：
- レストラン：税抜き金額の18〜20%が標準
- バー：ドリンク1杯につき$1〜2
- タクシー/Uber：15〜18%（Uberはアプリで選択）
- ホテルベルボーイ：荷物1個$1〜2
- ホテルハウスキーピング：1泊$2〜5、枕元に置く
- チップ不要：ファストフード・セルフサービス（iPad催促画面はNo Tipを選んでOK）`,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.content[0];
  return content.type === "text" ? content.text : "申し訳ありません、回答できませんでした。";
}

// フォローアップ生成（Haiku使用）
async function generateFollowUps(userMessage: string, reply: string): Promise<{ label: string; text: string }[]> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 250,
    system: `アメリカ旅行中の日本人が使うLINE Botです。
ユーザーの質問とBotの回答を読んで、この人が「次に自然に聞きたくなること」を3つ生成してください。

【必須ルール】
- 回答の内容を踏まえた具体的な深掘り質問にする
- 必ず1つは子連れ・家族視点を入れる
- 次の行動ステップになる質問を入れる
- labelは8文字以内、具体的に

JSON配列のみ返す。形式: [{"label":"...", "text":"..."}, ...]`,
    messages: [{ role: "user", content: `質問：${userMessage}\n\n回答：${reply}` }],
  });

  try {
    const raw = res.content[0].type === "text" ? res.content[0].text : "[]";
    const jsonStr = raw.match(/\[[\s\S]*\]/)?.[0] ?? "[]";
    return JSON.parse(jsonStr).slice(0, 3);
  } catch {
    return [];
  }
}

// LAPD犯罪データ取得
async function fetchCrimeData(lat: number, lng: number): Promise<{ crm_cd_desc: string; cnt: string }[]> {
  const offset = { lat: 0.0072, lng: 0.009 };
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

// 逆ジオコーディング
async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "User-Agent": "USANavi/1.0" } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// 治安レポート生成
async function generateSafetyReport(lat: number, lng: number, crimes: { crm_cd_desc: string; cnt: string }[], geoInfo: any, lineAddress: string | undefined): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const addr = geoInfo?.address;
  const city = addr?.city || addr?.town || addr?.village || "不明";
  const neighbourhood = addr?.neighbourhood || addr?.suburb || "";
  const fullLocation = [neighbourhood, city, addr?.county, addr?.state].filter(Boolean).join(", ");

  const totalCrimes = crimes.reduce((sum, c) => sum + parseInt(c.cnt || "0"), 0);
  const topCrimes = crimes.slice(0, 5).map(c => `  ・${c.crm_cd_desc}: ${c.cnt}件`).join("\n");
  const lapdText = crimes.length === 0
    ? "LAPDのデータなし（LAPD管轄外エリア）"
    : `直近6ヶ月の犯罪総数: ${totalCrimes}件\n主な犯罪:\n${topCrimes}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 700,
    system: `あなたはLA・南カリフォルニア在住10年以上の日本人として、初めてアメリカを旅行する日本人に治安情報を日本語で教えるアドバイザーです。

回答形式（LINEで読みやすく簡潔に）：
📍 エリア：[特定した場所名]
🔒 安全度：★★★★★（5段階）
📊 データ：[LAPDデータの有無と概要]
⚠️ 注意：[箇条書き2〜3個]
✅ 安心：[1〜2個]
🏨 ホテルヒント：[宿泊アドバイス]`,
    messages: [{
      role: "user",
      content: `【位置情報】
緯度: ${lat.toFixed(5)}, 経度: ${lng.toFixed(5)}
LINEの住所: ${lineAddress || "なし"}
逆ジオコーディング: ${fullLocation || geoInfo?.display_name || "取得失敗"}

【LAPDデータ】
${lapdText}

上記を踏まえてこのエリアの治安評価をしてください。`
    }],
  });

  const content = response.content[0];
  return content.type === "text" ? content.text : "治安情報を取得できませんでした。";
}

// ──────────────────────────────────────
// メインハンドラー
// ──────────────────────────────────────
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");
  if (!verifySignature(body, signature)) console.warn("署名検証失敗");

  const data = JSON.parse(body);

  for (const event of data.events ?? []) {
    if (event.type !== "message") continue;

    const replyToken = event.replyToken;
    const lineUserId = event.source?.userId;

    // ユーザー取得or作成
    const user = lineUserId ? await getOrCreateUser(lineUserId) : null;

    // 📍 位置情報 → 治安チェック
    if (event.message.type === "location") {
      const { latitude, longitude, address } = event.message;
      try {
        const [geoInfo, crimes] = await Promise.all([
          reverseGeocode(latitude, longitude),
          fetchCrimeData(latitude, longitude),
        ]);
        const report = await generateSafetyReport(latitude, longitude, crimes, geoInfo, address);
        const footer = crimes.length > 0
          ? "\n\n※ データ出典: LAPD犯罪データ（直近6ヶ月）"
          : "\n\n※ LAPD管轄外のため、エリア特性とAI知識をもとに評価しています";

        const quickReply = {
          items: [
            { type: "action", action: { type: "location", label: "別の場所を調べる" } },
            { type: "action", action: { type: "message", label: "お土産は？",   text: "このエリアのおすすめお土産を教えて" } },
            { type: "action", action: { type: "message", label: "近くのグルメ", text: "このエリアの近くのおすすめレストランを教えて" } },
            { type: "action", action: { type: "message", label: "ホテル選び",   text: "LAのホテル選びのコツを教えて" } },
          ],
        };
        await replyToLine(replyToken, [{ type: "text", text: report + footer, quickReply }]);
      } catch (error) {
        console.error("治安チェックエラー:", error);
        await replyToLine(replyToken, [{ type: "text", text: "治安情報の取得中にエラーが発生しました。しばらく後に再度お試しください。" }]);
      }
      continue;
    }

    // 💬 テキストメッセージ
    if (event.message.type !== "text") continue;
    const userMessage = event.message.text;

    // オンボーディング中
    if (user && !user.onboarding_done) {
      await handleOnboarding(replyToken, user, userMessage);
      continue;
    }

    // オンボーディング完了後 → 通常の返答
    try {
      const isOmiyage = /お土産|おみやげ/i.test(userMessage) && !/自分用|会社|友達|家族|ローカル|穴場/.test(userMessage);

      if (isOmiyage) {
        const reply = await generateReply(userMessage, user!);
        const quickReply = {
          items: [
            { type: "action", action: { type: "message", label: "自分用",       text: "自分へのこだわりのお土産が欲しい" } },
            { type: "action", action: { type: "message", label: "会社バラまき", text: "会社用のバラまきお土産をコスパよく買いたい" } },
            { type: "action", action: { type: "message", label: "友達・家族へ", text: "友達や家族へのちゃんとしたお土産が欲しい" } },
            { type: "action", action: { type: "message", label: "ローカル限定", text: "観光客が知らないローカルなお土産を教えて" } },
          ],
        };
        await replyToLine(replyToken, [{ type: "text", text: reply, quickReply }]);
      } else {
        const reply = await generateReply(userMessage, user!);
        const followUps = await generateFollowUps(userMessage, reply);
        const quickReply = followUps.length > 0
          ? { items: followUps.map(f => ({ type: "action", action: { type: "message", label: f.label, text: f.text } })) }
          : undefined;
        await replyToLine(replyToken, [{ type: "text", text: reply, ...(quickReply && { quickReply }) }]);
      }
    } catch (error) {
      console.error("返答エラー:", error);
    }
  }

  return NextResponse.json({ status: "ok" });
}
