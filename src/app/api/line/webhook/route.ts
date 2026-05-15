import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getOrCreateUser, updateUser, UserProfile, saveConversation, getRecentConversations, ConversationMessage, savePendingCall, getPendingCall, updateCall, getCallByBlandId, supabase } from "@/lib/supabase";
import { isHotelQuery, buildHotelFlexMessage, HOTEL_ZONE_TIPS } from "@/lib/hotel-affiliate";
import { isEsimQuery, buildEsimFlexMessage, ESIM_CONTEXT } from "@/lib/esim-affiliate";
import { detectArea } from "@/lib/knowledge-base";
import { isCallProxyQuery, makeReservationCall, ReservationRequest } from "@/lib/bland-caller";
import { createPaymentLink } from "@/lib/square-payment";
import { scheduleCronJobAt, deleteCronJob } from "@/lib/cron-scheduler";
import { searchPlaces, formatPlacesForClaude, searchNearbyRestaurants } from "@/lib/google-places";
import { searchEvents, formatEventsForClaude } from "@/lib/ticketmaster";

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

// LINE Push（replyTokenなしで送信）
// Square 相談決済リンク生成（$9）
async function createSquareConsultationLink(lineUserId: string): Promise<string | null> {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId  = process.env.SQUARE_LOCATION_ID;
  if (!accessToken || !locationId) return null;

  try {
    const res = await fetch("https://connect.squareup.com/v2/online-checkout/payment-links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        idempotency_key: `consult-${lineUserId}-${Date.now()}`,
        quick_pay: {
          name: "スタッフ相談 $9",
          price_money: { amount: 900, currency: "USD" },
          location_id: locationId,
        },
        payment_note: lineUserId, // webhookでユーザー特定に使用
      }),
    });
    if (!res.ok) {
      console.error("Square payment link error:", res.status, await res.text());
      return null;
    }
    const data = await res.json() as { payment_link?: { url?: string } };
    return data.payment_link?.url ?? null;
  } catch (e) {
    console.error("Square createLink error:", e);
    return null;
  }
}

// LINEユーザーの表示名を取得
async function getLineDisplayName(lineUserId: string): Promise<string> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
      headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` },
    });
    if (!res.ok) return lineUserId;
    const data = await res.json() as { displayName?: string };
    return data.displayName ?? lineUserId;
  } catch {
    return lineUserId;
  }
}

async function pushToUser(lineUserId: string, text: string, quickReplyItems?: { label: string; text: string }[]) {
  const message: Record<string, unknown> = { type: "text", text };
  if (quickReplyItems && quickReplyItems.length > 0) {
    message.quickReply = {
      items: quickReplyItems.map((item) => ({
        type: "action",
        action: { type: "message", label: item.label, text: item.text },
      })),
    };
  }
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: lineUserId, messages: [message] }),
  });
  if (!res.ok) console.error("LINE Push エラー:", res.status, await res.text());
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
      text: "はじめまして！SoCal Naviです🇺🇸\nより良いご案内のために、いくつか教えてください。（答えたくない項目はスキップできます）\n\nまず、年齢を教えてください👇",
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
    return true;
  }

  // Step 1: 年齢を受け取る → 目的を聞く
  if (step === 1) {
    // クイックリプライ以外（普通の質問など）が来たらオンボーディングをスキップして通常応答へ
    if (!message.startsWith("__age_")) {
      try {
        await updateUser(user.line_user_id, { onboarding_done: true, onboarding_step: 5 });
      } catch (_) { /* ignore */ }
      return false; // 通常の会話処理に回す
    }
    const ageGroup = message.replace("__age_", "");
    // replyを先に送ってからSupabase更新（クラッシュしても返信は届く）
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
    try {
      await updateUser(user.line_user_id, {
        age_group: ageGroup === "skip" ? null : ageGroup,
        onboarding_step: 2,
      });
    } catch (_) { /* Supabase失敗しても返信済みなので続行 */ }
    return true;
  }

  // Step 2: 目的を受け取る → おすすめ情報ボタンへ
  if (step === 2) {
    const purpose = message.startsWith("__purpose_") ? message.replace("__purpose_", "") : null;
    const purposeLabel = purpose && purpose !== "skip" ? purpose : "旅行";
    await replyToLine(replyToken, [
      { type: "text", text: `ありがとうございます！${purposeLabel}を思いっきり楽しめるようサポートします🎉` },
      {
        type: "text",
        text: "最後に！SoCal Naviからの今日のおすすめ情報を見てみますか？✨",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "📍 おすすめ情報を見る", text: "__show_recommend" } },
            { type: "action", action: { type: "message", label: "スキップ",              text: "__notify_none" } },
          ],
        },
      },
    ]);
    try {
      await updateUser(user.line_user_id, {
        travel_purpose: purpose === "skip" ? null : purpose,
        onboarding_step: 3,
      });
    } catch (_) { /* Supabase失敗しても返信済みなので続行 */ }
    return true;
  }

  // Step 3: おすすめ情報を表示 → 毎日受け取るか確認
  if (step === 3) {
    if (message === "__show_recommend") {
      await updateUser(user.line_user_id, { onboarding_step: 4 });

      // 今日のおすすめ情報をClaudeで生成
      const purpose = user.travel_purpose ?? "旅行";
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const res = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: `南カリフォルニア旅行中の日本人（目的：${purpose}）向けに、今日のおすすめ情報を3つ教えてください。\n観光スポット・グルメ・イベント・季節情報など、今すぐ役立つ具体的な情報を。\n絵文字を使って読みやすく、各項目2〜3行で。`,
        }],
      });
      const todayRecommend = res.content[0].type === "text" ? res.content[0].text.trim() : "今日もSoCalを楽しんでください！";

      // 今日のおすすめを即reply
      await replyToLine(replyToken, [{
        type: "text",
        text: `📍 今日のSoCal おすすめ情報\n\n${todayRecommend}`,
      }]);

      // 毎日受け取るか確認をpushで送信
      await pushToUser(user.line_user_id,
        "毎日このようなおすすめ情報を受け取りますか？📲\n\n不要になったらいつでも「配信停止」と送ればOKです。",
        [
          { label: "✅ 毎日受け取る", text: "__notify_recommend" },
          { label: "❌ いらない",     text: "__notify_none" },
        ]
      );
      return true;
    }

    // スキップ → オンボーディング完了
    if (message === "__notify_none") {
      await updateUser(user.line_user_id, {
        notify_recommend: false,
        onboarding_done: true,
        onboarding_step: 5,
      });
      await replyToLine(replyToken, [{
        type: "text",
        text: "了解です！いつでもメニューの「おすすめ情報」から変更できます👍\n\n何でも日本語で聞いてください😊",
      }]);
      return true;
    }
  }

  // Step 4: 毎日受け取るか → オンボーディング完了
  if (step === 4) {
    const notifyRecommend = message === "__notify_recommend";
    await updateUser(user.line_user_id, {
      notify_recommend: notifyRecommend,
      notify_weather:   false,
      notify_news:      false,
      onboarding_done:  true,
      onboarding_step:  5,
    });

    await replyToLine(replyToken, [{
      type: "text",
      text: notifyRecommend
        ? "毎日おすすめ情報をお届けします✅\n不要になったらいつでも「配信停止」と送ってください。\n\n何でも日本語で聞いてください😊"
        : "了解です！いつでもメニューの「おすすめ情報」から変更できます👍\n\n何でも日本語で聞いてください😊",
    }]);
    return true;
  }
}

// ──────────────────────────────────────
// ──────────────────────────────────────
// 会話から記憶を抽出してSupabaseに保存
// ──────────────────────────────────────
async function extractAndSaveMemory(
  lineUserId: string,
  userMessage: string,
  assistantReply: string,
  currentProfile: UserProfile
) {
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `以下の会話から記憶すべき情報を抽出してください。

ユーザー: ${userMessage}
アシスタント: ${assistantReply}

現在の記憶:
- 同行者: ${currentProfile.memory_companions ?? "なし"}
- 訪問済み・予定: ${currentProfile.memory_spots ?? "なし"}
- 食の好み: ${currentProfile.memory_food ?? "なし"}

以下のJSON形式で返してください（更新不要な場合はnullを返す）:
{
  "memory_companions": "子供2人(3歳・6歳)と夫" または null,
  "memory_spots": "ディズニー済み、ユニバーサル予定" または null,
  "memory_food": "辛いもの苦手、魚介類好き" または null
}
JSONのみ返してください。`,
      }],
    });

    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    const json = JSON.parse(text.replace(/```json|```/g, "").trim()) as {
      memory_companions?: string | null;
      memory_spots?: string | null;
      memory_food?: string | null;
    };

    const updates: Partial<UserProfile> = {};
    if (json.memory_companions) updates.memory_companions = json.memory_companions;
    if (json.memory_spots) updates.memory_spots = json.memory_spots;
    if (json.memory_food) updates.memory_food = json.memory_food;

    if (Object.keys(updates).length > 0) {
      await updateUser(lineUserId, updates);
    }
  } catch {
    // 記憶抽出失敗は無視（メイン返答には影響させない）
  }
}

// Claude AI 返答生成
// ──────────────────────────────────────
async function generateReply(userMessage: string, profile: UserProfile, history: ConversationMessage[]): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const profileContext = [
    profile.age_group ? `ユーザーの年齢帯: ${profile.age_group}` : "",
    profile.travel_purpose ? `旅の目的: ${profile.travel_purpose}` : "",
    profile.memory_companions ? `同行者: ${profile.memory_companions}` : "",
    profile.memory_spots ? `訪問済み・予定スポット: ${profile.memory_spots}` : "",
    profile.memory_food ? `食事の好み・苦手: ${profile.memory_food}` : "",
  ].filter(Boolean).join("\n");

  // 会話履歴 + 今の質問を組み立て
  const messages = [
    ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
    { role: "user" as const, content: userMessage },
  ];

  // web_search ツールを使って検索が必要な質問に自動対応（Claudeが判断）
  const systemPrompt = `あなたは「SoCal Navi」という初めてアメリカを旅行する日本人をサポートするAIコンシェルジュです。
アメリカ在住10年以上の日本人として、旅行者が「今この状況でどう動けばいいか」を日本語で具体的に案内してください。

【ユーザープロフィール】
${profileContext || "プロフィール未設定"}

【回答ルール・厳守】
- 通常は200文字以内に収める
- 救急・ER・保険・病院など医療緊急系の質問は400文字まで許可（手順や連絡先を省略しない）
- 表・箇条書きの多用禁止。シンプルな文章で（医療緊急時は手順リストOK）
- 「何かご不明な点は？」などの締めの言葉は不要
- 最重要ポイントを1〜2個に絞って伝える
- LINEのチャットで自然に読めるトーンで
- 英語フレーズが必要な時のみ「英語:"..."」を添える
- プロフィールがある場合はそれに合わせた情報を優先する
- 電話代行サービスのコールバック番号・折り返し番号は絶対にユーザーに教えない
  例：家族旅行→子連れ目線、20代カップル→デート向けスポット
- 【食事案内の鉄則】ユーザーは日本からの旅行者。わざわざアメリカに来て日本食を食べる必要はない。
  食事を聞かれたらアメリカならではの体験（In-N-Out・ハンバーガー・タコス・シーフード・BBQ・ブランチ等）を優先して案内する。
  「日本食が食べたい」と明示された場合のみ日系レストランを案内する。

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

■ アメリカ・SoCalのグルメ体験（食事を聞かれたらまずこれを案内）：
【絶対外せない定番】
- In-N-Out Burger：西海岸限定、ダブルダブルが定番。「アニマルスタイル」は隠れメニュー。$5〜
- タコス：LA・SDはメキシコ系タコスが最高。本場の味。$3〜
- ブランチ：週末はどこのカフェも行列。エッグベネディクト・アボカドトーストが定番
- Erewhon のスムージー：セレブ御用達、$20超えだが「LA体験」として人気
- フードトラック：ハンバーガー・メキシカン・韓国系など。LAらしい食文化
【エリア別おすすめ】
- サンタモニカ：シーフード・オーシャンビューのレストランで贅沢ランチ
- ベニスビーチ：カフェ巡り・ビーチサイドのタコス
- アナハイム（ディズニー周辺）：パーク内フードもアメリカ体験のひとつ
- サンディエゴ：新鮮なシーフード、ガスランプクォーターの多国籍グルメ
- リトルイタリー（SD）：本格イタリアン、週末マーケットも

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
- チップ不要：ファストフード・セルフサービス（iPad催促画面はNo Tipを選んでOK）`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchTools: any[] = [
    { type: "web_search_20250305", name: "web_search" },
    ...(process.env.GOOGLE_PLACES_API_KEY ? [{
      name: "search_places",
      description: "レストラン・観光スポット・お店を検索して営業時間・評価・電話番号・住所をリアルタイムで取得する。店名や場所の具体的な情報が必要なときに使う。",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "検索クエリ（例: 'ramen Santa Monica', 'In-N-Out Burger Anaheim'）" },
        },
        required: ["query"],
      },
    }] : []),
    ...(process.env.TICKETMASTER_API_KEY ? [{
      name: "search_events",
      description: "コンサート・スポーツ・ショー・家族向けイベントなどチケットが必要なイベントを検索する。「何かイベントある？」「ドジャースの試合は？」「コンサート情報」などの質問に使う。",
      input_schema: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "検索キーワード（例: 'Dodgers', 'Lakers', 'concert', 'family'）" },
          classificationName: { type: "string", description: "ジャンル: music / sports / arts / family（省略可）" },
          daysAhead: { type: "number", description: "何日先まで検索するか（デフォルト30）" },
        },
        required: ["keyword"],
      },
    }] : []),
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentMessages: any[] = [...messages];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: any = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    tools: searchTools,
    system: systemPrompt,
    messages: currentMessages,
  });

  // tool_use ループ（Claudeが検索を呼んだ場合に続きを処理）
  let loopCount = 0;
  while (response.stop_reason === "tool_use" && loopCount < 3) {
    loopCount++;
    currentMessages.push({ role: "assistant", content: response.content });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolResults = await Promise.all(
      response.content
        .filter((b: any) => b.type === "tool_use")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map(async (b: any) => {
          let content = "";
          if (b.name === "search_places") {
            try {
              const places = await searchPlaces(b.input.query, 3);
              content = places.length > 0
                ? formatPlacesForClaude(places)
                : "該当する場所が見つかりませんでした。";
            } catch {
              content = "Google Places検索に失敗しました。";
            }
          } else if (b.name === "search_events") {
            try {
              const events = await searchEvents(b.input.keyword, {
                classificationName: b.input.classificationName,
                daysAhead: b.input.daysAhead ?? 30,
                size: 5,
              });
              content = formatEventsForClaude(events);
            } catch {
              content = "Ticketmaster検索に失敗しました。";
            }
          }
          // web_searchはAnthropicが内部処理するのでcontentは空でOK
          return { type: "tool_result", tool_use_id: b.id, content };
        })
    );
    currentMessages.push({ role: "user", content: toolResults });
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      tools: searchTools,
      system: systemPrompt,
      messages: currentMessages,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = response.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  return text || "申し訳ありません、回答できませんでした。";
}

// フォローアップ生成（Haiku使用）
async function generateFollowUps(userMessage: string, reply: string, profile: UserProfile): Promise<{ label: string; text: string }[]> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const profileContext = [
    profile.age_group ? `年齢帯: ${profile.age_group}` : "",
    profile.travel_purpose ? `旅の目的: ${profile.travel_purpose}` : "",
  ].filter(Boolean).join("、");

  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 250,
    system: `アメリカ旅行中の日本人が使うLINE Botです。
ユーザーの質問とBotの回答を読んで、この人が「次に自然に聞きたくなること」を3つ生成してください。

【ユーザープロフィール】
${profileContext || "未設定"}

【必須ルール】
- 回答の内容を踏まえた具体的な深掘り質問にする
- プロフィールに合わせた視点を必ず1つ入れる
  例：家族旅行→チャイルドシート・子供料金・授乳室
  例：カップル→ロマンチックなスポット・二人向けプラン
  例：一人旅→安全情報・コスパ重視
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

// ──────────────────────────────────────
// 電話代行：ステップ定義
// ──────────────────────────────────────
interface CallData {
  step: number;
  restaurantName?: string;
  phoneNumber?: string;
  date?: string;
  time?: string;
  timeDisplay?: string;  // ユーザー表示用（19:00形式）
  partySize?: number;
  guestName?: string;
  specialRequest?: string;
}

const CALL_STEPS = [
  { key: "restaurantName",  question: "① お店の名前は？" },
  { key: "phoneNumber",     question: "② お店の電話番号は？\n例: 3106599449（ハイフンなし・10桁）" },
  { key: "dateTime",        question: "③ 希望日時は？\n例: 5月10日19時\n※ 日付は月と日付を入れてください\n※ 時間は現地時間で19時・20時など24時間表記でお願いします" },
  { key: "partySize",       question: "④ 何名ですか？" },
  { key: "guestName",       question: "⑤ 予約名をローマ字で教えてください\n例: Tanaka" },
  { key: "specialRequest",  question: "⑥ 備考はありますか？（任意）\n例: 子供用の椅子が1つ欲しい / 誕生日なのでデザートを用意してほしい\nなければ「なし」と送ってください" },
];

// 日時をClaudeで英語変換
async function convertDateTimeToEnglish(input: string): Promise<{ date: string; time: string; timeDisplay: string }> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 120,
    system: `日本語の日時をJSON形式に変換してください。現在の年は2026年。
絶対に"today"や"tonight"にしない。必ず曜日と月日を含める。
形式:
{
  "date": "Thursday, May 1",
  "time": "7:00 PM",
  "timeDisplay": "19:00"
}
JSONのみ返す。`,
    messages: [{ role: "user", content: input }],
  });
  try {
    const raw = res.content[0].type === "text" ? res.content[0].text : "{}";
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    return { date: json.date ?? input, time: json.time ?? "", timeDisplay: json.timeDisplay ?? json.time ?? "" };
  } catch {
    return { date: input, time: "", timeDisplay: "" };
  }
}

// 予約確認メッセージ生成
function buildConfirmMessage(info: Partial<ReservationRequest & CallData>): string {
  return [
    "📞 以下の内容で電話をかけます。よろしいですか？",
    "",
    `🍽 お店: ${info.restaurantName ?? "未設定"}`,
    `📱 電話番号: ${info.phoneNumber ?? "未設定"}`,
    `📅 日時: ${info.date ?? "未設定"} ${(info as CallData).timeDisplay ?? info.time ?? ""}`,
    `👥 人数: ${info.partySize ?? "未設定"}名`,
    `👤 予約名: ${info.guestName ?? "未設定"}`,
    info.specialRequest ? `📝 備考: ${info.specialRequest}` : "",
  ].filter(l => l !== "").join("\n");
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

    // 👋 友達追加 → ウェルカム＋オンボーディング開始
    if (event.type === "follow") {
      const lineUserId = event.source?.userId;
      const replyToken = event.replyToken;
      if (!lineUserId) continue;

      const user = await getOrCreateUser(lineUserId);

      // LINEプロフィールから表示名を取得
      let displayName = "";
      try {
        const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
          headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          displayName = profile.displayName ?? "";
        }
      } catch (_) { /* プロフィール取得失敗時は名前なしで続行 */ }

      // 友達追加 or 再登録のたびにウェルカムを送る（onboarding リセット）
      await updateUser(lineUserId, { onboarding_step: 1, onboarding_done: false });

      const namePrefix = displayName ? `${displayName}さん\n` : "";

      await replyToLine(replyToken, [
        {
          type: "text",
          text: [
            "ご登録ありがとうございます🌴",
            "LA&Socalコンシェルジュです。",
            "",
            "LA・南カリフォルニア旅行中の",
            "「これどうしたらいい？」を日本語で相談できます。",
            "",
            "移動・治安・ホテル・食事・チップ・トイレ・写真チェックなど、現地で困った時にそのまま聞いてください。",
            "",
            "📸 スーパーの商品やバーコードを写真で送ると、商品名・原材料・値段の目安・おすすめ度を日本語でお知らせします。",
            "",
            "また、必要に応じて",
            "予約代行・お土産の購入代行・日本への発送代行・スタッフ相談もご利用いただけます🎁",
            "",
            "下のメニューを選ぶか、",
            "そのまま日本語で質問してください📩",
          ].join("\n"),
        },
        {
          type: "text",
          text: "まず旅のスタイルに合わせたご案内のために、年齢を教えてもらえますか？",
          quickReply: {
            items: [
              { type: "action", action: { type: "message", label: "10代以下",  text: "__age_10代以下" } },
              { type: "action", action: { type: "message", label: "20代",      text: "__age_20代" } },
              { type: "action", action: { type: "message", label: "30代",      text: "__age_30代" } },
              { type: "action", action: { type: "message", label: "40代",      text: "__age_40代" } },
              { type: "action", action: { type: "message", label: "50代以上",  text: "__age_50代以上" } },
              { type: "action", action: { type: "message", label: "答えない",  text: "__age_skip" } },
            ],
          },
        },
      ]);
      continue;
    }

    if (event.type !== "message") continue;

    const replyToken = event.replyToken;
    const lineUserId = event.source?.userId;

    // ユーザー取得or作成
    const user = lineUserId ? await getOrCreateUser(lineUserId) : null;

    // 📍 位置情報 → 治安チェック
    if (event.message.type === "location") {
      const { latitude, longitude, address } = event.message;

      // 食事モード：近くのレストランを検索
      if (user?.pending_action === "restaurant_search" || user?.pending_action === "restaurant_japanese") {
        const isJapanese = user.pending_action === "restaurant_japanese";
        await updateUser(user.line_user_id, {
          pending_action: null,
          last_lat: latitude,
          last_lng: longitude,
        });
        try {
          const restaurants = isJapanese
            ? await searchNearbyRestaurants(latitude, longitude, 5, "Japanese restaurant")
            : await searchNearbyRestaurants(latitude, longitude, 5);

          if (restaurants.length === 0) {
            await replyToLine(replyToken, [{ type: "text", text: "📍 近くにレストランが見つかりませんでした。エリアを変えて再度試してください。" }]);
          } else {
            const label = isJapanese ? "日系レストラン" : "レストラン";
            const list = restaurants.map((r, i) => {
              const parts = [`${i + 1}. ${r.name}`];
              if (r.rating) parts.push(`⭐ ${r.rating}（${r.totalRatings?.toLocaleString()}件）`);
              if (r.priceLevel) parts.push(`💰 ${r.priceLevel}`);
              if (r.isOpenNow !== undefined) parts.push(r.isOpenNow ? "🟢 営業中" : "🔴 営業時間外");
              if (r.todayHours) parts.push(`🕐 ${r.todayHours}`);
              if (r.phone) parts.push(`📞 ${r.phone}`);
              return parts.join("\n");
            }).join("\n\n");

            await replyToLine(replyToken, [{
              type: "text",
              text: `🍽️ 現在地周辺の${label}（半径800m）\n\n${list}`,
              quickReply: {
                items: [
                  { type: "action", action: { type: "message", label: "🍱 日系を探す",       text: "__restaurant_japanese" } },
                  { type: "action", action: { type: "message", label: "📍 もう一度探す",      text: "__restaurant_search" } },
                  { type: "action", action: { type: "message", label: "📞 予約を頼む",        text: "予約代行" } },
                  { type: "action", action: { type: "message", label: "💡 チップの相場は？",  text: "アメリカのチップ相場を教えて" } },
                ],
              },
            }]);
          }
        } catch (e) {
          console.error("レストラン検索エラー:", e);
          await replyToLine(replyToken, [{ type: "text", text: "レストランの取得中にエラーが発生しました。" }]);
        }
        continue;
      }

      // トイレ検索モード
      if (user?.pending_action === "toilet_search") {
        await updateUser(user.line_user_id, { pending_action: null, last_lat: latitude, last_lng: longitude });
        try {
          // Overpass API と LAPD を並列取得
          const overpassQuery = `[out:json][timeout:15];node["amenity"="toilets"](around:800,${latitude},${longitude});out body 8;`;

          const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
          const [ovRes, crimes] = await Promise.all([
            fetch(overpassUrl, {
              headers: { "User-Agent": "SoCalNavi/1.0", "Accept": "*/*" },
            }),
            fetchCrimeData(latitude, longitude).catch(e => { console.error("LAPD error:", e); return []; }),
          ]);

          if (!ovRes.ok) {
            console.error("Overpass API error:", ovRes.status, await ovRes.text());
            throw new Error(`Overpass ${ovRes.status}`);
          }
          const ovData = await ovRes.json() as { elements?: { id: number; lat: number; lon: number; tags?: Record<string, string> }[] };
          const elements = ovData.elements ?? [];

          // 距離計算（km）
          const toKm = (lat2: number, lon2: number) => {
            const R = 6371;
            const dLat = (lat2 - latitude) * Math.PI / 180;
            const dLon = (lon2 - longitude) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(latitude * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          };

          const totalCrimes = crimes.reduce((s, c) => s + parseInt(c.cnt || "0"), 0);
          const safetyLevel = totalCrimes === 0 ? "不明" : totalCrimes < 20 ? "比較的安全" : totalCrimes < 60 ? "注意が必要" : "治安に注意";
          const safetyEmoji = totalCrimes === 0 ? "⚠️" : totalCrimes < 20 ? "🟢" : totalCrimes < 60 ? "🟡" : "🔴";
          const kidsAdvice = totalCrimes >= 40
            ? "⚠️ このエリアは子供だけでのトイレ利用は避けてください。必ず大人が同行を。"
            : totalCrimes >= 20
            ? "👀 子供が一人でトイレに行く際は必ず近くで待機してください。"
            : "✅ 比較的安全なエリアですが、子供は必ず大人と一緒に。";

          if (elements.length === 0) {
            await replyToLine(replyToken, [{
              type: "text",
              text: `🚻 半径800m内に公衆トイレのデータが見つかりませんでした。\n\n${safetyEmoji} エリア治安：${safetyLevel}\n${kidsAdvice}\n\n💡 ショッピングモール・Walmart・Target・スタバ・マクドナルド内のトイレが安全でおすすめです。`,
              quickReply: { items: [{ type: "action", action: { type: "location", label: "📍 別の場所で探す" } }] },
            }]);
          } else {
            const sorted = elements
              .map(e => ({ ...e, dist: toKm(e.lat, e.lon) }))
              .sort((a, b) => a.dist - b.dist)
              .slice(0, 5);

            const list = sorted.map((t, i) => {
              const tags = t.tags ?? {};
              const name = tags.name || tags["name:en"] || tags["name:ja"] || "公衆トイレ";
              const fee = tags.fee === "yes" ? "💰 有料" : tags.fee === "no" ? "無料" : "";
              const accessible = tags.wheelchair === "yes" ? "♿ バリアフリー" : "";
              const changing = tags.changing_table === "yes" ? "👶 おむつ台あり" : "";
              const distStr = t.dist < 0.1 ? `${Math.round(t.dist * 1000)}m` : `${t.dist.toFixed(1)}km`;
              const extras = [fee, accessible, changing].filter(Boolean).join(" / ");
              return `${i + 1}. ${name}（${distStr}）${extras ? "\n   " + extras : ""}`;
            }).join("\n");

            await replyToLine(replyToken, [{
              type: "text",
              text: [
                `🚻 近くの公衆トイレ（${elements.length}件ヒット）`,
                "",
                list,
                "",
                `${safetyEmoji} エリア治安：${safetyLevel}`,
                kidsAdvice,
                "",
                "💡 モール・パーク内のトイレが清潔で安心です。",
              ].join("\n"),
              quickReply: {
                items: [
                  { type: "action", action: { type: "location", label: "📍 別の場所で探す" } },
                  { type: "action", action: { type: "message", label: "🔒 治安を詳しく",    text: "__resend_location_safety" } },
                ],
              },
            }]);
          }
        } catch (e) {
          console.error("トイレ検索エラー詳細:", String(e));
          await replyToLine(replyToken, [{
            type: "text",
            text: `🚻 トイレ情報の取得に失敗しました（${String(e).slice(0, 60)}）\n\n💡 モール・Walmart・Target・スタバ・マクドナルド内のトイレが清潔で安全です。`,
          }]);
        }
        continue;
      }

      // 通常モード：治安チェック
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
            { type: "action", action: { type: "message", label: "近くのグルメ", text: "__restaurant_search" } },
            { type: "action", action: { type: "message", label: "お土産は？",   text: "このエリアのおすすめお土産を教えて" } },
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

    // 🖼️ 画像メッセージ → Vision分析 / 商品スキャン
    if (event.message.type === "image") {
      const messageId = event.message.id;
      try {
        // LINE から画像バイナリを取得
        const imgRes = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
          headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` },
        });
        if (!imgRes.ok) throw new Error(`画像取得失敗: ${imgRes.status}`);
        const imgBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(imgBuffer).toString("base64");
        const mimeType = (imgRes.headers.get("content-type") || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const imgSource = { type: "base64" as const, media_type: mimeType, data: base64 };

        // Step 1: バーコード検出（Haiku で高速抽出）
        const barcodeRes = await anthropic.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 50,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: imgSource },
              { type: "text", text: "この画像にバーコード（UPC/EAN）がありますか？ある場合は数字のみ返してください。ない場合は「なし」とだけ返してください。" },
            ],
          }],
        });
        const barcodeRaw = barcodeRes.content[0].type === "text" ? barcodeRes.content[0].text.trim().replace(/\s/g, "") : "なし";
        const barcode = /^\d{8,14}$/.test(barcodeRaw) ? barcodeRaw : null;

        // Step 2: バーコードがあれば Open Food Facts で商品情報を取得
        let productData = "";
        if (barcode) {
          try {
            const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, { signal: AbortSignal.timeout(4000) });
            if (offRes.ok) {
              const off = await offRes.json();
              if (off.status === 1) {
                const p = off.product;
                productData = JSON.stringify({
                  name: p.product_name || p.product_name_en,
                  brand: p.brands,
                  quantity: p.quantity,
                  ingredients: p.ingredients_text_en || p.ingredients_text,
                  allergens: p.allergens_tags?.join(", "),
                  categories: p.categories,
                  nutriscore: p.nutriscore_grade,
                });
              }
            }
          } catch { /* タイムアウト等は無視してVisionにフォールバック */ }
        }

        // バーコードあり・DBヒットなしの場合 → パッケージ写真を促す
        if (barcode && !productData) {
          await replyToLine(replyToken, [{
            type: "text",
            text: "バーコードを読み取れませんでした。商品名が見えるようにパッケージ正面の写真を送ってもらえますか？📦",
            quickReply: {
              items: [
                { type: "action", action: { type: "message", label: "📸 別の写真を送る", text: "写真を送る" } },
              ],
            },
          }]);
          continue;
        }

        // Step 3: Claude で日本語解説を生成
        let prompt = "";
        if (productData) {
          // バーコードDB成功 → 正確な商品データを使って解説
          prompt = `アメリカのスーパーで見つけた商品です。以下のデータを元に日本人旅行者向けに日本語で説明してください。

【商品データ】
${productData}

以下を含めて400文字以内で絵文字付きで：
1. 🏷️ 商品名（英語＋日本語訳）
2. 📦 どんな商品か
3. 🥗 主な原材料（日本語）
4. ⚠️ アレルギー情報
5. 🍽️ 食べ方・使い方
6. 💰 アメリカのスーパーでの平均価格の目安
7. ⭐ おすすめ度（★1〜5）とひとこと`;
        } else {
          // バーコードなし or DB未ヒット → Vision で商品・その他全般を判断
          prompt = `あなたはアメリカ（南カリフォルニア）を旅行中の日本人をサポートするAIアシスタントです。
送られてきた画像を見て、内容に応じて日本語で答えてください。

【商品・食品の場合】（最優先）
1. 🏷️ 商品名（英語＋日本語）
2. 📦 どんな商品か
3. 🥗 主な原材料
4. ⚠️ アレルギー情報
5. 🍽️ 食べ方・使い方
6. 💰 アメリカのスーパーでの平均価格の目安
7. ⭐ おすすめ度（★1〜5）

【その他の場合】
- 標識・看板 → 意味・注意事項
- レシート → チップ確認・金額の妥当性
- メニュー → おすすめ・アレルギー注意
- 英語テキスト → 日本語訳
- 街並み → 雰囲気・安全性

400文字以内で絵文字を使って読みやすく。`;
        }

        const visionRes = await anthropic.messages.create({
          model: "claude-opus-4-5",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: imgSource },
              { type: "text", text: prompt },
            ],
          }],
        });

        const answer = visionRes.content[0].type === "text" ? visionRes.content[0].text : "画像を解析できませんでした。";

        await replyToLine(replyToken, [{
          type: "text",
          text: answer,
          quickReply: {
            items: [
              { type: "action", action: { type: "message", label: "📸 別の写真を分析", text: "写真を送る" } },
              { type: "action", action: { type: "message", label: "🏠 メニューへ", text: "メニュー" } },
            ],
          },
        }]);
      } catch (e) {
        console.error("画像分析エラー:", e);
        await replyToLine(replyToken, [{ type: "text", text: "📸 画像の分析中にエラーが発生しました。もう一度お試しください。" }]);
      }
      continue;
    }

    // 💬 テキストメッセージ
    if (event.message.type !== "text") continue;
    const userMessage = event.message.text;

    // オンボーディング中
    if (user && !user.onboarding_done) {
      const handled = await handleOnboarding(replyToken, user, userMessage);
      if (handled !== false) continue; // falseが返ったら通常の会話処理へ流す
    }

    // ──────────────────────────────────────
    // 隠し管理者コマンド
    // ──────────────────────────────────────

    // 隠しコード入力 → コンボ開始
    if (userMessage === "NaokiSugishimaYorozu" && user) {
      // 既存のadminセッションがあれば削除
      const existing = await getPendingCall(user.line_user_id);
      if (existing && (existing.status === "admin_combo" || existing.status === "admin_credits")) {
        await updateCall(existing.id, { status: "cancelled" });
      }
      await savePendingCall(user.line_user_id, { status: "admin_combo", result: JSON.stringify({ combo: 0 }) });
      await replyToLine(replyToken, [{
        type: "text",
        text: "🔐",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "0", text: "__admin_0" } },
            { type: "action", action: { type: "message", label: "1", text: "__admin_1" } },
            { type: "action", action: { type: "message", label: "2", text: "__admin_2" } },
            { type: "action", action: { type: "message", label: "3", text: "__admin_3" } },
            { type: "action", action: { type: "message", label: "4", text: "__admin_4" } },
          ],
        },
      }]);
      continue;
    }

    // adminコンボ処理
    if (user && userMessage.startsWith("__admin_")) {
      const pending = await getPendingCall(user.line_user_id);
      if (pending?.status === "admin_combo") {
        const data = JSON.parse(pending.result ?? "{}");
        if (userMessage === "__admin_0") {
          data.combo = (data.combo ?? 0) + 1;
          if (data.combo >= 4) {
            // コンボ成功 → クレジット入力モードへ
            await updateCall(pending.id, { status: "admin_credits", result: JSON.stringify({}) });
            await replyToLine(replyToken, [{ type: "text", text: "✅ 付与するクレジット数を入力：" }]);
          } else {
            await updateCall(pending.id, { result: JSON.stringify(data) });
            await replyToLine(replyToken, [{
              type: "text",
              text: "🔐",
              quickReply: {
                items: [
                  { type: "action", action: { type: "message", label: "0", text: "__admin_0" } },
                  { type: "action", action: { type: "message", label: "1", text: "__admin_1" } },
                  { type: "action", action: { type: "message", label: "2", text: "__admin_2" } },
                  { type: "action", action: { type: "message", label: "3", text: "__admin_3" } },
                  { type: "action", action: { type: "message", label: "4", text: "__admin_4" } },
                ],
              },
            }]);
          }
        } else {
          // 0以外を選択 → リセット
          await updateCall(pending.id, { status: "cancelled" });
          await replyToLine(replyToken, [{ type: "text", text: "❌" }]);
        }
        continue;
      }
      // adminセッションなければ無視
      if (pending?.status !== "admin_credits") continue;
    }

    // クレジット付与処理
    if (user) {
      const pending = await getPendingCall(user.line_user_id);
      if (pending?.status === "admin_credits") {
        const n = parseInt(userMessage.replace(/\D/g, ""));
        if (!isNaN(n) && n > 0) {
          const current = user.call_credits ?? 0;
          await updateUser(user.line_user_id, { call_credits: current + n });
          await updateCall(pending.id, { status: "completed" });
          await replyToLine(replyToken, [{ type: "text", text: `✅ ${n}クレジット付与（合計${current + n}回）` }]);
        } else {
          await replyToLine(replyToken, [{ type: "text", text: "数字を入力してください" }]);
        }
        continue;
      }
    }

    // ──────────────────────────────────────
    // 電話代行フロー
    // ──────────────────────────────────────

    // 15分リトライ確認
    if (userMessage === "__retry_confirm" && user) {
      const { data: rows } = await supabase
        .from("calls").select("*").eq("user_id", user.line_user_id)
        .eq("status", "awaiting_retry").order("created_at", { ascending: false }).limit(1);
      const call = rows?.[0];
      if (!call) {
        await replyToLine(replyToken, [{ type: "text", text: "リトライ対象の通話が見つかりませんでした。" }]);
        continue;
      }
      const retryAt = new Date(Date.now() + 15 * 60 * 1000);
      const cronJobId = await scheduleCronJobAt(call.id, retryAt);
      await updateCall(call.id, {
        status: "pending_retry",
        result: JSON.stringify({ ...JSON.parse(call.result ?? "{}"), retryAt: retryAt.toISOString(), cronJobId }),
      });
      await replyToLine(replyToken, [{
        type: "text",
        text: "🔄 15分後に自動でかけ直します。\n結果はLINEでお知らせします📲\n\nキャンセルしたい場合は「予約アラームキャンセル」と送ってください。",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "🗑️ キャンセル", text: "予約アラームキャンセル" } },
          ],
        },
      }]);
      continue;
    }

    if (userMessage === "__retry_cancel" && user) {
      const { data: rows } = await supabase
        .from("calls").select("*").eq("user_id", user.line_user_id)
        .eq("status", "awaiting_retry").order("created_at", { ascending: false }).limit(1);
      const call = rows?.[0];
      if (call) await updateCall(call.id, { status: "cancelled" });
      await replyToLine(replyToken, [{ type: "text", text: "わかりました。再発信はしません。" }]);
      continue;
    }

    // 別時間での再予約確認
    if (userMessage === "__rebook_confirm" && user) {
      const { data: rows } = await supabase
        .from("calls").select("*").eq("user_id", user.line_user_id)
        .eq("status", "awaiting_rebook").order("created_at", { ascending: false }).limit(1);
      const call = rows?.[0];
      if (!call) {
        await replyToLine(replyToken, [{ type: "text", text: "再予約対象の通話が見つかりませんでした。" }]);
        continue;
      }
      const stored = JSON.parse(call.result ?? "{}");
      const callData = stored.callData ?? {};
      const alternativeTimeEn = stored.alternativeTimeEn ?? "";
      const alternativeTimeJa = stored.alternativeTimeJa ?? "";

      // 時間だけ上書きしてかけ直す
      const { makeReservationCall } = await import("@/lib/bland-caller");
      const { callId: newBlandId } = await makeReservationCall({
        restaurantName: callData.restaurantName,
        phoneNumber: callData.phoneNumber,
        date: callData.date,
        time: alternativeTimeEn,
        timeDisplay: alternativeTimeJa,
        partySize: callData.partySize,
        guestName: callData.guestName,
        specialRequest: callData.specialRequest,
        userId: user.line_user_id,
        isRetry: false,
      } as Parameters<typeof makeReservationCall>[0]);

      await updateCall(call.id, {
        call_id: newBlandId,
        status: "calling",
        result: JSON.stringify({ ...callData, time: alternativeTimeEn, timeDisplay: alternativeTimeJa }),
      });
      await replyToLine(replyToken, [{ type: "text", text: `📞 ${stored.restaurantName ?? callData.restaurantName} に${alternativeTimeJa}で再予約の電話をかけています…\n結果はLINEでお知らせします📲` }]);
      continue;
    }

    if (userMessage === "__rebook_cancel" && user) {
      const { data: rows } = await supabase
        .from("calls").select("*").eq("user_id", user.line_user_id)
        .eq("status", "awaiting_rebook").order("created_at", { ascending: false }).limit(1);
      const call = rows?.[0];
      if (call) await updateCall(call.id, { status: "cancelled" });
      await replyToLine(replyToken, [{ type: "text", text: "わかりました。予約はキャンセルしました。" }]);
      continue;
    }

    // 時間指定モードへ
    if (userMessage === "__call_schedule" && user) {
      const pending = await getPendingCall(user.line_user_id);
      if (!pending) { continue; }
      await updateCall(pending.id, { status: "scheduling" });
      await replyToLine(replyToken, [{
        type: "text",
        text: "⏰ 何時にかけますか？\n\n西海岸時間（LA時間）で入力してください。\n例：5月10日 午前11時、5月15日 14:00",
      }]);
      continue;
    }

    // 時間指定の入力を受け付け
    if (user) {
      const pending = await getPendingCall(user.line_user_id);
      if (pending?.status === "scheduling") {
        if (/キャンセル|やめ|やっぱり/.test(userMessage)) {
          await updateCall(pending.id, { status: "cancelled" });
          await replyToLine(replyToken, [{ type: "text", text: "キャンセルしました。" }]);
          continue;
        }
        const parsed = await parseScheduledTime(userMessage);
        if (!parsed) {
          await replyToLine(replyToken, [{
            type: "text",
            text: "時間を読み取れませんでした。\n例：5月10日 午前11時、5月15日 14:00\nもう一度入力してください。",
          }]);
          continue;
        }
        const callData = JSON.parse(pending.result ?? "{}");
        // cron-job.org に指定時刻の発火を登録
        let cronJobId: number;
        try {
          cronJobId = await scheduleCronJobAt(pending.id, new Date(parsed.utc));
        } catch (e) {
          console.error("スケジュール登録失敗:", e);
          await replyToLine(replyToken, [{ type: "text", text: "⚠️ スケジュールの登録に失敗しました。もう一度お試しください。" }]);
          continue;
        }
        await updateCall(pending.id, {
          status: "scheduled",
          result: JSON.stringify({ scheduledAt: parsed.utc, displayPT: parsed.displayPT, displayJST: parsed.displayJST, cronJobId, callData }),
        });
        await replyToLine(replyToken, [{
          type: "text",
          text: `⏰ 予約電話をスケジュールしました！\n\n🇺🇸 LA時間：${parsed.displayPT}\n🇯🇵 日本時間：${parsed.displayJST}\n\n指定の時間に自動でお電話します。\n結果はLINEでお知らせします📲`,
          quickReply: {
            items: [
              { type: "action", action: { type: "message", label: "🗑️ キャンセル", text: "予約アラームキャンセル" } },
            ],
          },
        }]);
        continue;
      }
    }

    // 確認OK → 電話をかける
    if (userMessage === "__call_confirm" && user) {
      const pending = await getPendingCall(user.line_user_id);
      if (!pending || !pending.result) {
        await replyToLine(replyToken, [{ type: "text", text: "予約情報が見つかりませんでした。もう一度「電話代行」と送ってください。" }]);
        continue;
      }

      const info: Partial<ReservationRequest> = JSON.parse(pending.result);
      const missing = [
        !info.phoneNumber && "電話番号",
        !info.date && "日時",
        !info.partySize && "人数",
        !info.guestName && "予約名",
      ].filter(Boolean);

      if (missing.length > 0) {
        await replyToLine(replyToken, [{ type: "text", text: `${missing.join("・")}が不足しています。もう一度教えてください。` }]);
        await updateCall(pending.id, { status: "collecting" });
        continue;
      }

      // 電話中メッセージを即reply
      await replyToLine(replyToken, [{
        type: "text",
        text: `📞 電話をかけています...\n\n${info.restaurantName ?? "お店"} に英語で連絡中です。\n数分後に結果をお届けします🔔`,
      }]);

      // Bland.ai API コール（バックグラウンド）
      try {
        const { callId } = await makeReservationCall({ ...(info as ReservationRequest), userId: user.line_user_id });
        await updateCall(pending.id, { call_id: callId, status: "calling" });

        // 最大3分ポーリング（Vercel maxDuration=60秒なのでwebhook方式がベター）
        // ここではとりあえずステータスを更新するだけ
        // 結果は /api/bland/webhook から push で届く
      } catch (err) {
        console.error("Bland.ai エラー:", err);
        await updateCall(pending.id, { status: "failed" });
        await pushToUser(user.line_user_id, `❌ 電話に失敗しました。\n\n${String(err)}\n\nお手数ですが直接お電話ください：${info.phoneNumber}`);
      }
      continue;
    }

    // キャンセル
    if (userMessage === "__call_cancel" && user) {
      const pending = await getPendingCall(user.line_user_id);
      if (pending) await updateCall(pending.id, { status: "cancelled" });
      await replyToLine(replyToken, [{ type: "text", text: "電話代行をキャンセルしました。" }]);
      continue;
    }

    // 情報収集中（ステップ方式）
    if (user) {
      const pending = await getPendingCall(user.line_user_id);
      if (pending?.status === "collecting") {
        const data: CallData = pending.result ? JSON.parse(pending.result) : { step: 0 };
        const step = data.step ?? 0;

        // キャンセルワード
        if (/キャンセル|やめ|やっぱり/.test(userMessage)) {
          await updateCall(pending.id, { status: "cancelled" });
          await replyToLine(replyToken, [{ type: "text", text: "電話代行をキャンセルしました。" }]);
          continue;
        }

        // ステップ2以降：明らかに話題が違う → キャンセルして通常会話へ
        if (step >= 2) {
          const offTopic = await isOffTopicForCallStep(userMessage, step);
          if (offTopic) {
            await updateCall(pending.id, { status: "cancelled" });
            // continueしない → 通常会話フローへ落ちる
          } else {
            // ステップ処理
            if (step === 2) {
              const { date, time, timeDisplay } = await convertDateTimeToEnglish(userMessage);
              data.date = date; data.time = time; data.timeDisplay = timeDisplay;
            } else if (step === 3) {
              const n = parseInt(userMessage.replace(/\D/g, ''));
              data.partySize = isNaN(n) ? 2 : n;
            } else if (step === 4) {
              data.guestName = userMessage;
            } else if (step === 5) {
              if (!/なし|スキップ|skip|no/i.test(userMessage)) data.specialRequest = userMessage;
            }
            data.step = step + 1;
            if (data.step >= CALL_STEPS.length) {
              const confirmMsg = buildConfirmMessage(data as Partial<ReservationRequest>);
              await updateCall(pending.id, { status: "confirming", restaurant: data.restaurantName ?? null, phone: data.phoneNumber ?? null, result: JSON.stringify(data) });
              await replyToLine(replyToken, [{ type: "text", text: confirmMsg, quickReply: { items: [{ type: "action", action: { type: "message", label: "📞 今すぐ電話", text: "__call_confirm" } }, { type: "action", action: { type: "message", label: "⏰ 時間指定", text: "__call_schedule" } }, { type: "action", action: { type: "message", label: "❌ やめる", text: "__call_cancel" } }] } }]);
            } else {
              await updateCall(pending.id, { result: JSON.stringify(data) });
              await replyToLine(replyToken, [{ type: "text", text: CALL_STEPS[data.step].question }]);
            }
            continue;
          }
        } else {
          // ステップ0・1は必ず受け付ける
          if (step === 0) {
            data.restaurantName = userMessage;
          } else if (step === 1) {
            const digits = userMessage.replace(/\D/g, '');
            data.phoneNumber = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
          }
          data.step = step + 1;
          await updateCall(pending.id, { result: JSON.stringify(data) });
          await replyToLine(replyToken, [{ type: "text", text: CALL_STEPS[data.step].question }]);
          continue;
        }
      }
    }

    // __notify_ コマンド処理（オンボーディング外で届いた場合）
    if (userMessage.startsWith("__notify_") && user) {
      const r = userMessage === "__notify_recommend";
      await updateUser(user.line_user_id, { notify_weather: false, notify_news: false, notify_recommend: r });
      await replyToLine(replyToken, [{
        type: "text",
        text: r
          ? "おすすめ情報の通知をONにしました✅\n不要になったらいつでも「配信停止」と送ってください。"
          : "通知をすべてオフにしました。\nまた必要なときはメニューの「おすすめ情報」から変更できます。",
      }]);
      continue;
    }

    // 「スタッフ・緊急」キーワード → 緊急連絡先 + 24時間以内返信案内
    if (/スタッフに相談|スタッフ|担当者|人と話|人間に|直接相談|緊急/.test(userMessage) && user) {
      // まず緊急連絡先を案内
      await replyToLine(replyToken, [{
        type: "text",
        text: [
          "🆘 緊急の場合はこちら",
          "",
          "🚨 警察・救急：911",
          "🇯🇵 在ロサンゼルス日本国総領事館",
          "　+1-213-617-6700",
          "",
          "🗣️ 日本語で相談できる可能性のある支援窓口",
          "　Little Tokyo Service Center（LTSC）",
          "　+1-213-473-3035",
          "　※医療機関ではありません",
          "　※生活・福祉相談などの支援団体です",
          "　※日本語対応可否は事前確認をおすすめします",
        ].join("\n"),
      }]);

      // Square決済リンクを生成して送信
      const paymentLink = await createSquareConsultationLink(user.line_user_id);
      if (paymentLink) {
        await pushToUser(user.line_user_id,
          `💬 スタッフへの相談は $9 / 1回です。\n\n以下のリンクからお支払いください👇\n${paymentLink}\n\nお支払い確認後、24時間以内にスタッフが返信します。`
        );
      } else {
        await pushToUser(user.line_user_id,
          `💬 スタッフへの相談は $9 / 1回です。\n\n以下のメッセージにご相談内容を送ってください📩\n24時間以内にスタッフが返信します。`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // 「配信停止」→ どれを止めるか選ばせる
    if (/配信停止|通知停止|通知をやめ|通知オフ/.test(userMessage) && user) {
      const current = [
        user.notify_weather   && "天気",
        user.notify_news      && "ニュース",
        user.notify_recommend && "おすすめ情報",
      ].filter(Boolean);

      if (current.length === 0) {
        await replyToLine(replyToken, [{ type: "text", text: "現在、通知はすべてオフになっています。" }]);
      } else {
        await replyToLine(replyToken, [{
          type: "text",
          text: `現在「${current.join("・")}」の通知をお届けしています。\nどれを停止しますか？`,
          quickReply: {
            items: [
              ...(user.notify_weather   ? [{ type: "action", action: { type: "message", label: "天気を停止",        text: "__stop_weather" } }] : []),
              ...(user.notify_news      ? [{ type: "action", action: { type: "message", label: "ニュースを停止",    text: "__stop_news" } }] : []),
              ...(user.notify_recommend ? [{ type: "action", action: { type: "message", label: "おすすめを停止",    text: "__stop_recommend" } }] : []),
              { type: "action", action: { type: "message", label: "すべて停止", text: "__stop_all" } },
            ],
          },
        }]);
      }
      continue;
    }

    // 配信停止の個別処理
    if (userMessage.startsWith("__stop_") && user) {
      const updates: Record<string, boolean> = {};
      if (userMessage === "__stop_all")       { updates.notify_weather = false; updates.notify_news = false; updates.notify_recommend = false; }
      if (userMessage === "__stop_weather")   updates.notify_weather   = false;
      if (userMessage === "__stop_news")      updates.notify_news      = false;
      if (userMessage === "__stop_recommend") updates.notify_recommend = false;
      await updateUser(user.line_user_id, updates);
      const stopped = userMessage === "__stop_all" ? "すべて"
        : userMessage === "__stop_weather" ? "天気" : userMessage === "__stop_news" ? "ニュース" : "おすすめ情報";
      await replyToLine(replyToken, [{ type: "text", text: `「${stopped}」の通知を停止しました。\n再開したい場合はメニューの「おすすめ情報」から変更できます。` }]);
      continue;
    }

    // クレジット残数確認
    if (/予約代行クレジット/.test(userMessage) && user) {
      const credits = user.call_credits ?? 0;
      const msg = `📞 電話代行クレジット残数：${credits}回\n\n${credits === 0 ? "クレジットがありません。「電話代行」と送ると購入できます。" : "「電話代行」と送ってご利用ください。"}`;
      await replyToLine(replyToken, [{ type: "text", text: msg }]);
      continue;
    }

    // 予約アラームキャンセル
    if (/予約アラームキャンセル|アラームキャンセル|スケジュールキャンセル/.test(userMessage) && user) {
      const { data: rows } = await supabase
        .from("calls")
        .select("*")
        .eq("user_id", user.line_user_id)
        .in("status", ["scheduled", "pending_retry"])
        .order("created_at", { ascending: false })
        .limit(1);
      const scheduled = rows?.[0];
      if (!scheduled) {
        await replyToLine(replyToken, [{ type: "text", text: "キャンセルできる予約アラームはありません。" }]);
      } else {
        const { cronJobId, displayPT } = JSON.parse(scheduled.result ?? "{}");
        if (cronJobId) await deleteCronJob(cronJobId);
        await updateCall(scheduled.id, { status: "cancelled" });
        const label = displayPT ? `${displayPT}（LA時間）の` : "";
        await replyToLine(replyToken, [{ type: "text", text: `🗑️ ${label}予約アラームをキャンセルしました。` }]);
      }
      continue;
    }

    // 「食事・チップ」ボタン → チップ情報 + 近くのレストラン案内
    if (userMessage === "食事・チップ") {
      if (user) await updateUser(user.line_user_id, { pending_action: null });
      await replyToLine(replyToken, [
        {
          type: "text",
          text: [
            "💰 アメリカのチップ相場",
            "",
            "🍽️ レストラン（座って食べる）：15〜20%",
            "🍔 カジュアル・カウンター：10〜15%",
            "🚕 Uber/Lyft：10〜15%（任意）",
            "✂️ ヘアサロン・マッサージ：15〜20%",
            "🏨 ホテルのベッドメイク：$1〜2/泊",
            "",
            "📱 計算の目安：税金（約10%）の2倍 = 約20%",
            "",
            "※ クレジットカード払いの場合、レシートに",
            "　Tip欄があるので金額か%を記入してください。",
          ].join("\n"),
        },
        {
          type: "text",
          text: "近くのレストランを探しますか？📍",
          quickReply: {
            items: [
              { type: "action", action: { type: "message", label: "📍 近くのレストランを探す", text: "__restaurant_search" } },
              { type: "action", action: { type: "message", label: "🍽️ おすすめを聞く",         text: "LAのおすすめレストランを教えて" } },
            ],
          },
        },
      ]);
      continue;
    }

    // 「__restaurant_search」→ 位置情報を求める
    if (userMessage === "__restaurant_search") {
      if (user) await updateUser(user.line_user_id, { pending_action: "restaurant_search" });
      await replyToLine(replyToken, [{
        type: "text",
        text: "📍 現在地を送ってください。周辺のレストランを探します！",
        quickReply: {
          items: [{ type: "action", action: { type: "location", label: "📍 現在地を送る" } }],
        },
      }]);
      continue;
    }

    // 食事の追加要望（位置情報保存済みの場合は周辺検索）
    if (
      user?.last_lat && user?.last_lng &&
      /中華|メキシカン|イタリアン|ラーメン|寿司|すし|焼肉|タコス|ピザ|バーガー|カフェ|子連れ|ファミリー|ベジタリアン|シーフード|海鮮|ステーキ|韓国|タイ|インド|フレンチ|スペイン|地中海|ビーガン|グルテン/.test(userMessage) &&
      !/教えて|どこ|おすすめ|探して/.test(userMessage) === false || (
        user?.last_lat && user?.last_lng &&
        /中華|メキシカン|イタリアン|ラーメン|寿司|すし|焼肉|タコス|ピザ|バーガー|カフェ|子連れ|ファミリー|ベジタリアン|シーフード|海鮮|ステーキ|韓国料理|タイ料理|インド料理|フレンチ|ビーガン/.test(userMessage)
      )
    ) {
      const cuisineKeyword = userMessage.replace(/がいい|が食べたい|系|料理|にいいとこ|向け|で探して|教えて|おすすめ/g, "").trim();
      const searchQuery = `${cuisineKeyword} restaurant`;
      const restaurants = await searchNearbyRestaurants(user.last_lat, user.last_lng, 5, searchQuery);

      if (restaurants.length > 0) {
        const list = restaurants.map((r, i) => {
          const parts = [`${i + 1}. ${r.name}`];
          if (r.rating) parts.push(`⭐ ${r.rating}（${r.totalRatings?.toLocaleString()}件）`);
          if (r.priceLevel) parts.push(`💰 ${r.priceLevel}`);
          if (r.isOpenNow !== undefined) parts.push(r.isOpenNow ? "🟢 営業中" : "🔴 営業時間外");
          if (r.todayHours) parts.push(`🕐 ${r.todayHours}`);
          if (r.phone) parts.push(`📞 ${r.phone}`);
          return parts.join("\n");
        }).join("\n\n");

        await replyToLine(replyToken, [{
          type: "text",
          text: `📍 現在地周辺（${cuisineKeyword}）\n\n${list}`,
          quickReply: {
            items: [
              { type: "action", action: { type: "message", label: "🍱 日系を探す",      text: "__restaurant_japanese" } },
              { type: "action", action: { type: "message", label: "📍 全部見る",        text: "__restaurant_search" } },
              { type: "action", action: { type: "message", label: "📞 予約を頼む",      text: "予約代行" } },
            ],
          },
        }]);
        continue;
      }
      // 見つからなかったらClaudeへ流す（fallthrough）
    }

    // 「__restaurant_japanese」→ 保存済み座標があればすぐ検索、なければ位置情報を求める
    if (userMessage === "__restaurant_japanese") {
      if (user?.last_lat && user?.last_lng) {
        // 保存済み座標で即検索
        const restaurants = await searchNearbyRestaurants(user.last_lat, user.last_lng, 5, "Japanese restaurant");
        if (restaurants.length === 0) {
          await replyToLine(replyToken, [{ type: "text", text: "📍 近くに日系レストランが見つかりませんでした。" }]);
        } else {
          const list = restaurants.map((r, i) => {
            const parts = [`${i + 1}. ${r.name}`];
            if (r.rating) parts.push(`⭐ ${r.rating}（${r.totalRatings?.toLocaleString()}件）`);
            if (r.priceLevel) parts.push(`💰 ${r.priceLevel}`);
            if (r.isOpenNow !== undefined) parts.push(r.isOpenNow ? "🟢 営業中" : "🔴 営業時間外");
            if (r.todayHours) parts.push(`🕐 ${r.todayHours}`);
            if (r.phone) parts.push(`📞 ${r.phone}`);
            return parts.join("\n");
          }).join("\n\n");
          await replyToLine(replyToken, [{
            type: "text",
            text: `🍱 現在地周辺の日系レストラン\n\n${list}`,
            quickReply: {
              items: [
                { type: "action", action: { type: "message", label: "📍 全レストランを見る", text: "__restaurant_search" } },
                { type: "action", action: { type: "message", label: "📞 予約を頼む",         text: "予約代行" } },
              ],
            },
          }]);
        }
      } else {
        // 座標未保存 → 位置情報を求める
        if (user) await updateUser(user.line_user_id, { pending_action: "restaurant_japanese" });
        await replyToLine(replyToken, [{
          type: "text",
          text: "📍 現在地を送ってください。近くの日系レストランを探します🍱",
          quickReply: {
            items: [{ type: "action", action: { type: "location", label: "📍 現在地を送る" } }],
          },
        }]);
      }
      continue;
    }

    // 「トイレ」キーワード → 位置情報を求めてGoogle Places検索
    if (/トイレ|お手洗い|化粧室|restroom|bathroom|toilet/i.test(userMessage)) {
      if (user) await updateUser(user.line_user_id, { pending_action: "toilet_search" });
      await replyToLine(replyToken, [{
        type: "text",
        text: "🚻 現在地を送ってください。近くのトイレを探します！",
        quickReply: { items: [{ type: "action", action: { type: "location", label: "📍 現在地を送る" } }] },
      }]);
      continue;
    }

    // 「移動・行き方」ボタン → サブメニューを表示
    if (userMessage === "移動・行き方") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🚗 どの移動について知りたいですか？",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "✈️ LAXから市内へ",          text: "LAXから市内への行き方を教えて" } },
            { type: "action", action: { type: "message", label: "🏨 ホテルからLAXへ",         text: "ホテルからLAXへの行き方を教えて" } },
            { type: "action", action: { type: "message", label: "🏰 市内からディズニーへ",    text: "LA市内からディズニーランドへの行き方を教えて" } },
            { type: "action", action: { type: "message", label: "⚾ 市内からドジャースへ",    text: "LA市内からドジャースタジアムへの行き方を教えて" } },
            { type: "action", action: { type: "message", label: "🚘 Uber/Lyftの使い方",      text: "UberとLyftの使い方を教えて" } },
            { type: "action", action: { type: "message", label: "🚗 レンタカー・駐車場",      text: "LAのレンタカーと駐車場について教えて" } },
          ],
        },
      }]);
      continue;
    }

    // 「ホテル」「__hotel_menu」「ホテルを探す」ボタン → ホテルサブメニュー
    if (userMessage === "ホテル" || userMessage === "__hotel_menu" || userMessage === "ホテルを探す") {
      await replyToLine(replyToken, [{
        type: "text",
        text: [
          "🏨 ホテルについて、番号を選んでください",
          "",
          "1. どのエリアに泊まるべきか",
          "2. LAXからホテルまでの行き方",
          "3. Disney・ドジャース・観光に便利なエリア",
          "4. 予約前のホテル選び注意点",
          "5. 予約済みホテル周辺の注意点",
          "6. おすすめ予約サイト",
          "7. スタッフに相談",
        ].join("\n"),
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "1", text: "__hotel_1" } },
            { type: "action", action: { type: "message", label: "2", text: "__hotel_2" } },
            { type: "action", action: { type: "message", label: "3", text: "__hotel_3" } },
            { type: "action", action: { type: "message", label: "4", text: "__hotel_4" } },
            { type: "action", action: { type: "message", label: "5", text: "__hotel_5" } },
            { type: "action", action: { type: "message", label: "6", text: "__hotel_6" } },
            { type: "action", action: { type: "message", label: "7", text: "__hotel_7" } },
          ],
        },
      }]);
      continue;
    }

    // ── ホテルサブメニュー ─────────────────────────────────

    // 番号 → 内部コードに変換
    const hotelNumMap: Record<string, string> = {
      "__hotel_1": "__hotel_area",
      "__hotel_2": "__hotel_lax",
      "__hotel_3": "__hotel_spots",
      "__hotel_4": "__hotel_tips_before",
      "__hotel_5": "__hotel_tips_around",
      "__hotel_6": "__hotel_booking",
      "__hotel_7": "__hotel_staff",
    };
    const hMsg = hotelNumMap[userMessage] ?? userMessage;

    // 7番 → スタッフ相談フローへ
    if (hMsg === "__hotel_staff") {
      const paymentLink = user ? await createSquareConsultationLink(user.line_user_id) : null;
      if (paymentLink) {
        await replyToLine(replyToken, [{ type: "text", text: `💬 スタッフへの相談は $9 / 1回です。\n\n以下のリンクからお支払いください👇\n${paymentLink}\n\nお支払い確認後、24時間以内にスタッフが返信します。` }]);
      } else {
        await replyToLine(replyToken, [{ type: "text", text: "💬 スタッフへの相談は $9 / 1回です。\n\nご相談内容をこのままメッセージで送ってください📩\n24時間以内にスタッフが返信します。" }]);
      }
      continue;
    }

    if (hMsg === "__hotel_area") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🏨 どのエリアに泊まるべき？\n\n【目的別おすすめ】\n\n🏰 ディズニー・アナハイム目的\n→ アナハイム（ホテルから徒歩圏も！）\n\n⚾ ドジャース・ダウンタウン観光\n→ ダウンタウンLA（交通の便◎）\n\n🌊 海・サンタモニカ・ベニス\n→ サンタモニカ / ウェストLA（おしゃれエリア）\n\n✈️ LAXに近くて楽\n→ エル・セグンドやHawthorne（空港徒歩圏）\n\n👨‍👩‍👧 ファミリー・安心重視\n→ アナハイム / バーバンク（治安◎・広め）\n\n💡 迷ったらアナハイム（ディズニー）かサンタモニカが人気！",
      }]);
      continue;
    }

    if (hMsg === "__hotel_lax") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "✈️ LAXからホテルへの行き方\n\n🚗 Uber/Lyft（おすすめ）\n・乗り場：LAX-it（専用ロット）\n・空港を出てシャトル「G」に乗り約5〜10分\n・料金目安：ダウンタウン $30〜50 / アナハイム $60〜80\n\n🚌 無料シャトル（ホテル直行）\n・空港送迎付きホテルも多数\n・到着ロビーで「Hotel Shuttle」の表示を探す\n・事前にホテルに確認しておくとスムーズ\n\n🚇 メトロ（格安・$1.75）\n・Cラインで乗り換えが必要。荷物多いと大変\n\n💡 大きな荷物があるならUber一択！",
      }]);
      continue;
    }

    if (hMsg === "__hotel_spots") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🗺️ 観光目的別・便利なホテルエリア\n\n🏰 ディズニーランド\n→ アナハイム（Disneyland Hotel周辺）\n　 パーク徒歩圏もあり！\n\n⚾ ドジャースタジアム\n→ ダウンタウンLA / シルバーレイク\n　 試合後のUberが楽\n\n🎬 ユニバーサル・スタジオ\n→ バーバンク / ハリウッド\n　 Metro RedLineが使える\n\n⭐ ハリウッド・ビバリーヒルズ\n→ ハリウッド / ウェストハリウッド\n　 観光地が徒歩圏内\n\n🌊 海・サンタモニカ・ベニス\n→ サンタモニカ（ちょっとお高め）\n\n🛍️ アウトレット（Citadel）\n→ ダウンタウンLA から15分",
      }]);
      continue;
    }

    if (hMsg === "__hotel_tips_before") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "💡 ホテル予約前の注意点\n\n📍 エリアの治安を確認\nダウンタウンLA南部・スキッドロウ周辺は避ける\n\n🅿️ 駐車場代に注意\n市内ホテルは駐車場が$30〜50/日かかることも。車なしならUber活用\n\n🏊 プール・朝食付きか確認\n旅程に合わせてアメニティを確認しておくと◎\n\n🔔 リゾートフィー（隠れ費用）\n高級ホテルは毎日$20〜50のリゾートフィーが別途かかることあり\n\n📅 キャンセルポリシーを確認\n無料キャンセル期間内かどうかは必ずチェック\n\n💳 クレジットカードでデポジット\nチェックイン時にカードの事前承認（$100〜200）が必要な場合あり",
      }]);
      continue;
    }

    if (hMsg === "__hotel_tips_around") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🗺️ 予約済みホテル周辺の注意点\n\n治安チェックツールを使ってみてください👇\n\n📍 メニューの「治安チェック」からホテル周辺の位置情報を送ると、LAPDのリアルデータをもとに安全度を評価します！\n\n【一般的な注意点】\n🌙 夜の一人歩きは避ける（特にダウンタウン南部）\n🚗 車内に荷物を置かない（窃盗多発）\n💼 ホテルロビーでもスマホの置き忘れに注意\n🏨 ルームキーの紛失対策：デジタルキー設定推奨\n\n📞 緊急時は911 / ホテルのフロントへ",
      }]);
      continue;
    }

    if (hMsg === "__hotel_booking") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🌐 おすすめホテル予約サイト\n\n📌 Booking.com\nhttps://www.booking.com\n日本語対応◎、無料キャンセル多数\n\n📌 Expedia（楽天トラベル経由も可）\nhttps://www.expedia.co.jp\n\n📌 Hotels.com\nhttps://www.hotels.com\n10泊で1泊無料のスタンプ制度あり\n\n📌 Airbnb（長期滞在・ファミリーに◎）\nhttps://www.airbnb.jp\n\n💡 比較のコツ\n・Google Hotelsで相場を調べてから予約\n・直前割引は金〜土の出発便に多い\n・無料キャンセルプランを選ぶと安心！",
      }]);
      continue;
    }

    // アフィリリンク定数
    const VIATOR_LA   = "https://www.viator.com/Los-Angeles/d645-ttd?pid=P00299768&mcid=42383&medium=link";
    const KLOOK_LA    = "https://www.klook.com/ja/city/124-los-angeles-things-to-do/?aid=120508";
    const KLOOK_DISNEY    = "https://www.klook.com/ja/activity/4100-disneyland-park-disney-california-adventure-park-los-angeles/?aid=120508";
    const KLOOK_UNIVERSAL = "https://www.klook.com/ja/activity/1342-universal-studios-hollywood-los-angeles/?aid=120508";
    const VIATOR_DODGERS  = "https://www.viator.com/Los-Angeles/d645-ttd?pid=P00299768&mcid=42383&medium=link";

    // 「人気スポット」ボタン → スポット選択
    if (userMessage === "人気スポット") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🎡 どのスポットに行きますか？",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "🏰 ディズニーランド",        text: "__spot_disney" } },
            { type: "action", action: { type: "message", label: "⚾ ドジャース",              text: "__spot_dodgers" } },
            { type: "action", action: { type: "message", label: "🎬 ユニバーサル",            text: "__spot_universal" } },
            { type: "action", action: { type: "message", label: "⭐ ハリウッド",              text: "__spot_hollywood" } },
            { type: "action", action: { type: "message", label: "🌊 サンタモニカ",            text: "__spot_santa_monica" } },
            { type: "action", action: { type: "message", label: "🛍️ アウトレット",           text: "__spot_outlet" } },
          ],
        },
      }]);
      continue;
    }

    // ── スポット別サブメニュー ──────────────────────────────

    // ディズニーランド
    if (userMessage === "__spot_disney") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🏰 ディズニーランド、何を知りたいですか？",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "🎟️ チケット",    text: "__disney_ticket" } },
            { type: "action", action: { type: "message", label: "🚗 行き方",      text: "__disney_access" } },
            { type: "action", action: { type: "message", label: "💡 攻略Tips",    text: "__disney_tips" } },
          ],
        },
      }]);
      continue;
    }
    if (userMessage === "__disney_ticket") {
      await replyToLine(replyToken, [{
        type: "text",
        text: `🎟️ ディズニーランド チケット\n\nKlook（日本語）で事前購入がおすすめ！当日より安い場合があります👇\n${KLOOK_DISNEY}`,
      }]);
      continue;
    }
    if (userMessage === "__disney_access") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🚗 ディズニーランドへの行き方\n\n📍 住所：1313 Disneyland Dr, Anaheim, CA 92802\n\n🚗 Uber/Lyft\nLAダウンタウンから約40〜50分、$40〜60程度\n\n🚌 公共交通\nLA Union駅 → Metrolink（Orange County線）→ Anaheim駅 → 無料シャトル\n約1時間〜1時間半\n\n💡 駐車場は$35/日。Uberの方が楽です！",
      }]);
      continue;
    }
    if (userMessage === "__disney_tips") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "💡 ディズニーランド 攻略Tips\n\n⏰ 開園30分前に到着がベスト\n📱 Disneyland appでLightning Laneを予約\n🎢 人気アトラクションは朝一番に\n🌞 夏・春休みは激混み。平日狙いで\n💦 水・スナックは持参でOK\n🎆 花火は20〜21時ごろ。場所取りを早めに\n👟 歩き回るので動きやすい靴必須！",
      }]);
      continue;
    }

    // ドジャース
    if (userMessage === "__spot_dodgers") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "⚾ ドジャース、何を知りたいですか？",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "🎟️ チケット",    text: "__dodgers_ticket" } },
            { type: "action", action: { type: "message", label: "🚗 行き方",      text: "__dodgers_access" } },
            { type: "action", action: { type: "message", label: "🍺 楽しみ方",    text: "__dodgers_enjoy" } },
          ],
        },
      }]);
      continue;
    }
    if (userMessage === "__dodgers_ticket") {
      await replyToLine(replyToken, [{
        type: "text",
        text: `🎟️ ドジャース チケット\n\n公式サイト：https://www.mlb.com/dodgers/tickets\n\nViatorでもツアー付きチケットあり👇\n${VIATOR_DODGERS}\n\n💡 人気試合は早めに！試合2〜3週前が狙い目です。`,
      }]);
      continue;
    }
    if (userMessage === "__dodgers_access") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🚗 ドジャースタジアムへの行き方\n\n📍 住所：1000 Vin Scully Ave, Los Angeles, CA 90012\n\n🚗 Uber/Lyft（おすすめ）\nダウンタウンから約10〜15分、$10〜20程度\n試合後は激混みなので帰りは早めに呼ぶ！\n\n🅿️ 駐車場\n$35〜45。試合2時間前に開場\n\n⚠️ 電車・バスはやや不便。Uberが断然楽です！",
      }]);
      continue;
    }
    if (userMessage === "__dodgers_enjoy") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🍺 ドジャース観戦 楽しみ方\n\n🌭 名物フード\n・ドジャードッグ（必食！）\n・ガーリックフライ\n・クラフトビール各種\n\n📸 フォトスポット\n・外野スタンド（緑の芝生×山が絶景）\n・バッティングプラクティス（1.5時間前から）\n\n👕 ユニフォームは現地でも買えます\n\n🌙 ナイトゲームは涼しくなるので上着を！",
      }]);
      continue;
    }

    // ユニバーサル
    if (userMessage === "__spot_universal") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🎬 ユニバーサル・スタジオ、何を知りたいですか？",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "🎟️ チケット",    text: "__universal_ticket" } },
            { type: "action", action: { type: "message", label: "🚗 行き方",      text: "__universal_access" } },
            { type: "action", action: { type: "message", label: "💡 攻略Tips",    text: "__universal_tips" } },
          ],
        },
      }]);
      continue;
    }
    if (userMessage === "__universal_ticket") {
      await replyToLine(replyToken, [{
        type: "text",
        text: `🎟️ ユニバーサル・スタジオ チケット\n\nKlook（日本語）で事前購入がおすすめ！\n${KLOOK_UNIVERSAL}\n\n💡 Express Passを買うと待ち時間を大幅短縮できます。混雑期は特におすすめ！`,
      }]);
      continue;
    }
    if (userMessage === "__universal_access") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🚗 ユニバーサル・スタジオへの行き方\n\n📍 住所：100 Universal City Plaza, Universal City, CA 91608\n\n🚇 Metro（おすすめ）\nRedLine「Universal City/Studio City」駅から徒歩5分\nダウンタウンから約25分、$1.75\n\n🚗 Uber/Lyft\nダウンタウンから約20〜30分、$20〜35\n\n🅿️ 駐車場は$45〜。Metroの方がお得！",
      }]);
      continue;
    }
    if (userMessage === "__universal_tips") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "💡 ユニバーサル 攻略Tips\n\n🧙 ハリー・ポッターエリアは朝一番に\n⚡ Express Pass購入で待ち時間を大幅短縮\n📱 Universal appで混雑状況をリアルタイム確認\n🌞 夏・春休みは激混み。開園1時間前に到着を\n🎢 身長制限があるアトラクションあり（子連れ注意）\n🍺 Three Broomstickでバタービールを！",
      }]);
      continue;
    }

    // ハリウッド
    if (userMessage === "__spot_hollywood") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "⭐ ハリウッド、何を知りたいですか？",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "🚗 行き方",       text: "__hollywood_access" } },
            { type: "action", action: { type: "message", label: "📍 観光スポット", text: "__hollywood_spots" } },
            { type: "action", action: { type: "message", label: "⚠️ 注意点",       text: "__hollywood_caution" } },
          ],
        },
      }]);
      continue;
    }
    if (userMessage === "__hollywood_access") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🚗 ハリウッドへの行き方\n\n📍 メインエリア：Hollywood Blvd & Highland Ave\n\n🚇 Metro（おすすめ）\nRedLine「Hollywood/Highland」駅が便利\nダウンタウンから約20分、$1.75\n\n🚗 Uber/Lyft\nダウンタウンから約20〜30分、$15〜25\n\n🅿️ 駐車場はHighland周辺に複数あり（$5〜15）",
      }]);
      continue;
    }
    if (userMessage === "__hollywood_spots") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "📍 ハリウッド 観光スポット\n\n⭐ ハリウッド・ウォーク・オブ・フェーム\n🎬 TCLチャイニーズ・シアター（手形・足形）\n🔤 ハリウッドサイン（Griffith Parkから眺める）\n🎭 ドルビー・シアター（アカデミー賞会場）\n🛍️ Hollywood & Highland（ショッピングモール）\n\n💡 サインへの徒歩ルートは約2時間。体力に余裕がある日に！",
      }]);
      continue;
    }
    if (userMessage === "__hollywood_caution") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "⚠️ ハリウッド 注意点\n\n🚶 ウォーク・オブ・フェームは観光客が多く、スリや物乞いが多め。バッグは前に抱える\n\n💰 コスプレした人との写真撮影は必ずチップを要求されます（$5〜10が相場）\n\n🌙 夜のHollywood Blvd周辺は治安が悪化するので早めに切り上げを\n\n🅿️ 路上駐車はチケットを切られやすい。駐車場利用が安心\n\n📵 スマホを出しっぱなしにしない！",
      }]);
      continue;
    }

    // サンタモニカ
    if (userMessage === "__spot_santa_monica") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🌊 サンタモニカ、何を知りたいですか？",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "🚗 行き方",    text: "__santa_monica_access" } },
            { type: "action", action: { type: "message", label: "🍽️ グルメ",    text: "__santa_monica_food" } },
            { type: "action", action: { type: "message", label: "🏄 楽しみ方",  text: "__santa_monica_enjoy" } },
          ],
        },
      }]);
      continue;
    }
    if (userMessage === "__santa_monica_access") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🚗 サンタモニカへの行き方\n\n📍 メインエリア：Santa Monica Pier / 3rd Street Promenade\n\n🚇 Metro E Line（Expo Line）\nダウンタウンから「Downtown Santa Monica」駅まで約50分、$1.75\n\n🚗 Uber/Lyft\nダウンタウンから約30〜45分（渋滞次第）、$25〜40\n\n🚲 レンタル自転車・電動キックボード（Lime/Bird）もおすすめ！",
      }]);
      continue;
    }
    if (userMessage === "__santa_monica_food") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🍽️ サンタモニカ グルメ\n\n🦞 Lobster（ピア横、シーフードの名店）\n🌮 Border Grill（メキシカン）\n☕ Blue Bottle Coffee（海を見ながら）\n🥗 Erewhon（高級オーガニックスーパー、スムージーが有名）\n🍕 Pizzana（本格ナポリピザ）\n\n💡 3rd Street Promenadeはカジュアルな飲食店が充実。ランチにぴったり！",
      }]);
      continue;
    }
    if (userMessage === "__santa_monica_enjoy") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🏄 サンタモニカ 楽しみ方\n\n🎡 サンタモニカ・ピア\n観覧車や遊園地、釣りスポット。夕日が絶景！\n\n🛍️ 3rd Street Promenade\n歩行者天国のショッピングストリート\n\n🏖️ ビーチ\n泳ぐより散歩・日光浴がメイン。夏は混雑\n\n🚴 マリナ・デル・レイまでのサイクリングコース\n海沿いを気持ちよく走れる約10kmのルート\n\n🌅 夕日スポットとしても最高！17〜19時がゴールデンタイム",
      }]);
      continue;
    }

    // アウトレット
    if (userMessage === "__spot_outlet") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🛍️ アウトレット、何を知りたいですか？",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "🚗 行き方",       text: "__outlet_access" } },
            { type: "action", action: { type: "message", label: "💰 お得情報",     text: "__outlet_deals" } },
            { type: "action", action: { type: "message", label: "🛍️ おすすめ店",  text: "__outlet_shops" } },
          ],
        },
      }]);
      continue;
    }
    if (userMessage === "__outlet_access") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🚗 LAエリア アウトレット 行き方\n\n🏬 Citadel Outlets（おすすめ）\n📍 100 Citadel Dr, Los Angeles\nダウンタウンから車で約15分。アクセス最良！\nUber $15〜20程度\n\n🏬 Desert Hills Premium Outlets\n📍 48400 Seminole Dr, Cabazon（Palm Springs方面）\nダウンタウンから車で約90分。ブランド品充実\nUber $100〜 or レンタカー推奨\n\n💡 Desert Hillsはハイブランドを狙うなら断然おすすめ！",
      }]);
      continue;
    }
    if (userMessage === "__outlet_deals") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "💰 アウトレット お得情報\n\n📋 VIPクーポン\nCitadel OutletsはインフォメーションセンターでVIPクーポンブックを無料でもらえる（追加10〜20%OFF）\n\n🗓️ セール時期\n・年末年始（12月26日〜1月）\n・レイバーデー（9月第1月曜）\n・ブラックフライデー（11月）\n\n💳 海外カードでの購入は為替レートも確認を\n\n🧾 TAX REFUND：残念ながらカリフォルニアは免税制度なし",
      }]);
      continue;
    }
    if (userMessage === "__outlet_shops") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🛍️ アウトレット おすすめ店\n\n【Citadel Outlets】\n・Nike / Adidas\n・Coach / Kate Spade\n・GAP / Banana Republic\n・Levi's\n\n【Desert Hills Premium Outlets】\n・Gucci / Prada / Burberry\n・Saint Laurent / Bottega Veneta\n・Tory Burch / Michael Kors\n・Polo Ralph Lauren\n\n💡 日本より30〜50%安い場合も！事前に日本での定価をチェックしてから行くと◎",
      }]);
      continue;
    }

    // 「お土産代行」ボタン → OMIYAGEメインメニュー
    if (userMessage === "お土産代行") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🛍️ OMIYAGE / お土産\n\nアメリカ旅行中のお土産関連サービスです。\nご希望のサービスを選んでください。\n\n1. お土産パック\n2. 発送代行サービス",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "1 お土産パック",      text: "__omiyage_pack" } },
            { type: "action", action: { type: "message", label: "2 発送代行サービス",  text: "__omiyage_shipping" } },
          ],
        },
      }]);
      continue;
    }

    // お土産パック → COMING SOON
    if (userMessage === "__omiyage_pack") {
      await replyToLine(replyToken, [{
        type: "text",
        text: "🎁 お土産パック\n\nCOMING SOON\n\nアメリカ定番のお土産を用途別に選べるパックサービスを準備中です。",
        quickReply: {
          items: [{ type: "action", action: { type: "message", label: "← OMIYAGEメニューへ", text: "お土産代行" } }],
        },
      }]);
      continue;
    }

    // 発送代行サービス → 詳細案内
    if (userMessage === "__omiyage_shipping") {
      await replyToLine(replyToken, [{
        type: "text",
        text: [
          "📦 買ったもの日本発送サポート",
          "",
          "アメリカで買ったお土産を、ホテルでお預かりし、こちらで梱包して日本へ発送します。",
          "スーツケースに入りきらない商品、職場用のお土産、帰国前に増えた荷物を日本へ送りたい方におすすめです。",
          "",
          "【料金】",
          "・指定日OC集荷：$99 + 国際送料",
          "・指定日LA集荷：$120 + 国際送料",
          "・OC 日時指定：$149〜 + 国際送料",
          "・LA 日時指定：$180〜 + 国際送料",
          "",
          "【集荷曜日】OC：月・水・金 / LA：火・木",
          "【集荷時間】8:00〜12:00（1時間枠・最大2件/枠）",
          "",
          "【追加料金】",
          "・追加箱：+$39/箱（2箱目〜）",
          "・商品20点以上：+$20〜",
          "・大型・特殊梱包：要見積もり",
          "",
          "※国際送料・関税・消費税はお客様負担",
          "※発送不可商品は確認後ご案内します",
        ].join("\n"),
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "📝 申し込みフォームへ",  text: "__omiyage_form_info" } },
            { type: "action", action: { type: "message", label: "📋 発送できる商品",      text: "__omiyage_items" } },
            { type: "action", action: { type: "message", label: "← OMIYAGEメニューへ",   text: "お土産代行" } },
          ],
        },
      }]);
      continue;
    }

    // 申し込みフォームへ進む
    if (userMessage === "__omiyage_form_info") {
      await replyToLine(replyToken, [{
        type: "text",
        text: [
          "📝 発送代行サービスのお申し込みフォームへ進みます。",
          "",
          "フォームでは以下の内容をご入力ください。",
          "・お名前 / メール / 電話番号",
          "・ホテル名・住所",
          "・希望集荷日・時間帯",
          "・商品点数・箱数予定",
          "・商品写真（必須）",
          "・日本の送り先",
          "・食品・液体・壊れ物の有無",
          "",
          "入力内容を確認後、発送可否と料金をご案内します。",
        ].join("\n"),
        quickReply: {
          items: [
            { type: "action", action: { type: "uri", label: "🔗 フォームを開く", uri: `https://lasocalconcierge.vercel.app/shipping?uid=${lineUserId}` } },
            { type: "action", action: { type: "message", label: "← 戻る", text: "__omiyage_shipping" } },
          ],
        },
      }]);
      continue;
    }

    // 発送できる商品を確認する
    if (userMessage === "__omiyage_items") {
      await replyToLine(replyToken, [{
        type: "text",
        text: [
          "📋 発送できる商品について",
          "",
          "✅ 発送しやすい商品",
          "お菓子・コーヒー・紅茶・軽い雑貨・エコバッグ・ステーショナリー・Tシャツ・キッチン小物・職場用ばらまき土産・子ども向けお土産",
          "",
          "❌ 発送できない可能性が高い商品",
          "アルコール・香水・エアゾール・医薬品・サプリ・肉製品・生鮮食品・冷蔵冷凍品・液体類・電池入り商品・高額ブランド品・現金・貴重品・壊れ物・大型商品",
          "",
          "商品写真を確認後、発送可否をご案内します。",
        ].join("\n"),
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "📝 申し込みフォームへ", text: "__omiyage_form_info" } },
            { type: "action", action: { type: "message", label: "← OMIYAGEメニューへ",  text: "お土産代行" } },
          ],
        },
      }]);
      continue;
    }

    // 「試合・お得情報」ボタン → おすすめ情報と同じ処理
    if (userMessage === "試合・お得情報") {
      // おすすめ情報ハンドラーへ流す（下記で処理）
    }

    // 「おすすめ情報」「試合・お得情報」ボタン → 今日のイベント検索＋Claude生成→通知設定を聞く
    if (/おすすめ情報|試合・お得情報|通知設定|通知追加|通知を追加|通知を受け取/.test(userMessage)) {
      if (!user) {
        await replyToLine(replyToken, [{ type: "text", text: "まずは友だち登録をしてください😊" }]);
        continue;
      }

      // 通常のClaude応答でLA今週のイベント・試合情報を生成（web_searchは通常会話フローで使用済み）
      const AnthropicRec = (await import("@anthropic-ai/sdk")).default;
      const anthropicRec = new AnthropicRec({ apiKey: process.env.ANTHROPIC_API_KEY });
      const purpose = user.travel_purpose ?? "観光";
      const today = new Date().toLocaleDateString("ja-JP", { timeZone: "America/Los_Angeles", year: "numeric", month: "long", day: "numeric" });

      // web検索なしでClaude sonnetに直接生成させる（web_searchのloop問題を回避）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recRes: any = await anthropicRec.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `今日は${today}（ロサンゼルス時間）です。

南カリフォルニア旅行中の日本人（旅の目的：${purpose}）向けに、今週のLA最新情報を以下のフォーマットで日本語でまとめてください。

⚾ ドジャース今週の試合
・（日時・対戦相手・開始時間を知っている分だけ書く）
・チケット: https://www.mlb.com/dodgers/tickets

🏀 レイカーズ今週の試合
・（日時・対戦相手・開始時間を知っている分だけ書く）
・チケット: https://www.nba.com/lakers/tickets

🎵 LA今週の注目イベント・コンサート
・（知っているイベントを書く）

💡 今週のおすすめ
・（旅行者向けのLA今週のおすすめ情報1〜2個）

※知らない情報は「要確認」と書いてください。絶対に日程や対戦相手を作り上げないこと。`
        }],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textBlock = recRes.content.find((b: any) => b.type === "text");
      const todayInfo = textBlock ? textBlock.text.trim() : "今日もSoCalを楽しんでください！";

      const isOn = user.notify_recommend ?? false;

      // 今日の情報をreply
      const VIATOR_LA = "https://www.viator.com/Los-Angeles/d645-ttd?pid=P00299768&mcid=42383&medium=link";
      const KLOOK_LA = "https://www.klook.com/ja/city/124-los-angeles-things-to-do/?aid=120508";
      await replyToLine(replyToken, [
        {
          type: "text",
          text: `📍 今日のSoCal おすすめ情報\n\n${todayInfo}`,
        },
        {
          type: "text",
          text: `🎟️ チケット・ツアーの予約はこちら👇\n\n📌 Viator（英語）\n${VIATOR_LA}\n\n📌 Klook（日本語対応）\n${KLOOK_LA}`,
        },
      ]);

      // 通知設定をpushで確認
      await pushToUser(
        user.line_user_id,
        `毎朝7時（カリフォルニア時間）にこのような情報をお届けできます📲\n\n現在：${isOn ? "✅ 通知ON" : "オフ"}`,
        isOn
          ? [{ label: "🔕 通知を止める", text: "__notify_none" }]
          : [
              { label: "✅ 毎日受け取る", text: "__notify_recommend" },
              { label: "❌ いらない",     text: "__notify_none" },
            ]
      );
      continue;
    }

    // オンボーディング完了後 → 通常の返答
    try {
      const isOmiyage  = /お土産|おみやげ/i.test(userMessage) && !/自分用|会社|友達|家族|ローカル|穴場/.test(userMessage);
      const isHotel    = isHotelQuery(userMessage);
      const isEsim     = isEsimQuery(userMessage) && !isHotel;
      const isCallProxy = isCallProxyQuery(userMessage);

      // エリア検出（ホテルアフィリ用）
      const detectedAreas = detectArea(userMessage);
      const hotelArea = detectedAreas.find(a => ["LA","Anaheim","SanDiego","SoCal"].includes(a)) ?? "LA";

      // ホテル質問ならシステムプロンプトにゾーンTipsを追加
      const hotelContext = isHotel ? `\n\n${HOTEL_ZONE_TIPS[hotelArea] ?? HOTEL_ZONE_TIPS.LA}` : "";

      // 会話履歴取得
      const history = user ? await getRecentConversations(user.line_user_id) : [];

      if (isCallProxy && user) {
        const credits = user.call_credits ?? 0;

        if (credits <= 0) {
          // クレジットなし → 免責事項を表示して同意後に決済リンク
          try {
            const paymentUrl = await createPaymentLink(user.line_user_id);
            await replyToLine(replyToken, [{
              type: "text",
              text: `📞 レストラン予約代行サービス\n\n【ご利用前にご確認ください】\n\n・AIが英語でお電話し、レストランの予約をお取りします\n・予約の確定を保証するものではありません\n・繋がらなかった場合・予約が取れなかった場合はクレジットを消費しません\n・予約が確定した場合のみクレジット1回消費\n\n$12（税込）で3回分のクレジットが付与されます。\n\n※ 忘れ物の問い合わせなどその他の電話代行はスタッフ個別相談をご利用ください`,
              quickReply: {
                items: [
                  { type: "action", action: { type: "uri", label: "✅ 同意して購入", uri: paymentUrl } },
                  { type: "action", action: { type: "message", label: "❌ やめる", text: "やめる" } },
                ],
              },
            }]);
          } catch (err) {
            console.error("Square payment link error:", err);
            await replyToLine(replyToken, [{ type: "text", text: "決済リンクの生成に失敗しました。しばらく後にお試しください。" }]);
          }
          continue;
        }

        // クレジットあり → 電話代行スタート
        await savePendingCall(user.line_user_id, { status: "collecting", result: JSON.stringify({ step: 0 }) });
        const creditMsg = `\n残りクレジット：${credits}回`;
        await replyToLine(replyToken, [{
          type: "text",
          text: `📞 英語電話代行サービス${creditMsg}\n全部で6項目お聞きします。一つずつ答えてください。\nいつでも「キャンセル」で中止できます。\n\n${CALL_STEPS[0].question}`,
        }]);

      } else if (isOmiyage) {
        const reply = await generateReply(userMessage, user!, history);
        if (user) {
          await saveConversation(user.line_user_id, "user", userMessage);
          await saveConversation(user.line_user_id, "assistant", reply);
        }
        const quickReply = {
          items: [
            { type: "action", action: { type: "message", label: "自分用",       text: "自分へのこだわりのお土産が欲しい" } },
            { type: "action", action: { type: "message", label: "会社バラまき", text: "会社用のバラまきお土産をコスパよく買いたい" } },
            { type: "action", action: { type: "message", label: "友達・家族へ", text: "友達や家族へのちゃんとしたお土産が欲しい" } },
            { type: "action", action: { type: "message", label: "ローカル限定", text: "観光客が知らないローカルなお土産を教えて" } },
          ],
        };
        await replyToLine(replyToken, [{ type: "text", text: reply, quickReply }]);

      } else if (isEsim) {
        // eSIM質問 → Claude回答 ＋ Airalo/Holafly 比較カルーセル
        const reply = await generateReply(userMessage + ESIM_CONTEXT, user!, history);
        if (user) {
          await saveConversation(user.line_user_id, "user", userMessage);
          await saveConversation(user.line_user_id, "assistant", reply);
        }
        const esimCard = buildEsimFlexMessage();
        const quickReply = {
          items: [
            { type: "action", action: { type: "message", label: "設定方法は？",     text: "eSIMの設定方法を教えて" } },
            { type: "action", action: { type: "message", label: "古いiPhoneでも？", text: "古いiPhoneでもeSIMは使える？" } },
            { type: "action", action: { type: "message", label: "通話もできる？",   text: "eSIMで通話もできる？" } },
          ],
        };
        await replyToLine(replyToken, [
          { type: "text", text: reply, quickReply },
          esimCard,
        ]);

      } else if (isHotel) {
        // ホテル質問 → Claude回答 ＋ Booking.com アフィリFlexカード
        const reply = await generateReply(userMessage + hotelContext, user!, history);
        if (user) {
          await saveConversation(user.line_user_id, "user", userMessage);
          await saveConversation(user.line_user_id, "assistant", reply);
        }
        const hotelCard = buildHotelFlexMessage(hotelArea);
        const quickReply = {
          items: [
            { type: "action", action: { type: "message", label: "サンタモニカ周辺", text: "サンタモニカ周辺のホテルを教えて" } },
            { type: "action", action: { type: "message", label: "ハリウッド周辺",   text: "ハリウッド周辺のホテルを教えて" } },
            { type: "action", action: { type: "message", label: "予算$100以下",     text: "LAでコスパの良いホテルを教えて（予算$100以下）" } },
            { type: "action", action: { type: "message", label: "家族向け",         text: "子連れ家族に向いているホテルエリアは？" } },
          ],
        };
        await replyToLine(replyToken, [
          { type: "text", text: reply, quickReply },
          hotelCard,
        ]);

      } else {
        const reply = await generateReply(userMessage, user!, history);
        if (user) {
          await saveConversation(user.line_user_id, "user", userMessage);
          await saveConversation(user.line_user_id, "assistant", reply);
          // 記憶抽出（非同期・失敗しても無視）
          extractAndSaveMemory(user.line_user_id, userMessage, reply, user).catch(() => {});
        }
        const followUps = await generateFollowUps(userMessage, reply, user!);
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

// 日本語の時間入力をUTC / PT表示 / JST表示に変換
async function parseScheduledTime(input: string): Promise<{ utc: string; displayPT: string; displayJST: string } | null> {
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const now = new Date();
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 50,
      messages: [{
        role: "user",
        content: `今日は${now.toISOString()}（UTC）です。
ユーザーが「${input}」と入力しました。これは西海岸時間（PDT = UTC-7）での日時です。
UTC時刻をISO8601形式で返してください。他の文字は一切不要。
例：2024-05-10T18:00:00Z`,
      }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    const utc = new Date(text);
    if (isNaN(utc.getTime())) return null;

    // PT表示（UTC-7）
    const ptDate = new Date(utc.getTime() - 7 * 60 * 60 * 1000);
    const ptStr = `${ptDate.getUTCMonth() + 1}月${ptDate.getUTCDate()}日 ${ptDate.getUTCHours()}:${String(ptDate.getUTCMinutes()).padStart(2, "0")}`;

    // JST表示（UTC+9）
    const jstDate = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
    const jstStr = `${jstDate.getUTCMonth() + 1}月${jstDate.getUTCDate()}日 ${jstDate.getUTCHours()}:${String(jstDate.getUTCMinutes()).padStart(2, "0")}`;

    return { utc: utc.toISOString(), displayPT: ptStr, displayJST: jstStr };
  } catch {
    return null;
  }
}

// ステップごとの期待値ヒント
const STEP_HINTS: Record<number, string> = {
  2: "日付・日時・曜日・時間など（例：5月3日7時、来週土曜の夜など）",
  3: "人数を表す数字（例：2、3人、4名など）",
  4: "人名・名前（例：Naoki、Tanaka、たろうなど。ひとことでも名前として有効）",
  5: "なんでも有効（特別なお願い、なし、スキップも含む）",
};

// ステップ2・3のみ判定（名前・備考は何でも有効なので除外）
async function isOffTopicForCallStep(message: string, step: number): Promise<boolean> {
  // ステップ4（名前）・5（備考）は何でも有効 → 判定しない
  if (step >= 4) return false;

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const hint = STEP_HINTS[step] ?? "";
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 5,
      messages: [{
        role: "user",
        content: `電話予約の情報収集中。期待する回答：${hint}\nユーザーの返答：「${message}」\nこれは期待する回答？それとも全く関係ない話題への転換（例：「ホテル教えて」「やっぱいいや」）？\n回答ならYES、話題転換ならNO。YESかNOだけ答えて。`,
      }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim().toUpperCase() : "YES";
    return text.startsWith("NO");
  } catch {
    return false;
  }
}
