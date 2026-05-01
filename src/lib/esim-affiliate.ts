// ─────────────────────────────────────────────
// eSIMアフィリエイト（Airalo + Holafly）
// ─────────────────────────────────────────────

// アフィリリンク（環境変数で上書き可能）
function getAiraloUrl(): string {
  const code = process.env.AIRALO_REF_CODE;
  return code
    ? `https://ref.airalo.com/${code}`
    : "https://www.airalo.com/united-states-esim";
}

function getHolaflyUrl(): string {
  const code = process.env.HOLAFLY_AFFILIATE_CODE;
  return code
    ? `https://esim.holafly.com/referral/${code}`
    : "https://esim.holafly.com/esim-usa/";
}

// eSIM関連キーワード判定
export function isEsimQuery(message: string): boolean {
  return /esim|eSIM|イーシム|SIM|シム|sim|wifi|WiFi|ワイファイ|通信|データ通信|インターネット|ローミング|スマホ|携帯|スマートフォン|電話/i.test(message);
}

// eSIM Flexメッセージ生成（2択カルーセル）
export function buildEsimFlexMessage() {
  return {
    type: "flex",
    altText: "📶 アメリカのeSIM比較 | Airalo vs Holafly",
    contents: {
      type: "carousel",
      contents: [
        // ── Airalo ──────────────────────────────
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            backgroundColor: "#1A1A2E",
            paddingAll: "16px",
            contents: [
              {
                type: "text",
                text: "📶 Airalo",
                color: "#FFFFFF",
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text: "データ量で選ぶ・従量課金",
                color: "#AAAAAA",
                size: "xs",
                margin: "xs",
              },
            ],
          },
          body: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            paddingAll: "14px",
            contents: [
              { type: "text", text: "💰 1GB〜 $4.50〜", size: "sm", weight: "bold", color: "#111111" },
              { type: "text", text: "✅ 出発前に日本で設定OK", size: "xs", color: "#555555" },
              { type: "text", text: "✅ LAX着陸後すぐ使える", size: "xs", color: "#555555" },
              { type: "text", text: "✅ iPhone・Android対応", size: "xs", color: "#555555" },
              { type: "text", text: "✅ 日本語アプリあり", size: "xs", color: "#555555" },
              {
                type: "text",
                text: "短期滞在や使う量が少ない方向け",
                size: "xs",
                color: "#888888",
                margin: "md",
                wrap: true,
              },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            paddingAll: "12px",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#1A1A2E",
                height: "sm",
                action: {
                  type: "uri",
                  label: "Airaloで購入する →",
                  uri: getAiraloUrl(),
                },
              },
            ],
          },
        },

        // ── Holafly ─────────────────────────────
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            backgroundColor: "#E8372C",
            paddingAll: "16px",
            contents: [
              {
                type: "text",
                text: "🔥 Holafly",
                color: "#FFFFFF",
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text: "無制限プラン・使い放題",
                color: "#FFCCCC",
                size: "xs",
                margin: "xs",
              },
            ],
          },
          body: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            paddingAll: "14px",
            contents: [
              { type: "text", text: "💰 無制限 $27〜（5日間〜）", size: "sm", weight: "bold", color: "#111111" },
              { type: "text", text: "✅ データ上限なし・使い放題", size: "xs", color: "#555555" },
              { type: "text", text: "✅ 出発前に日本で設定OK", size: "xs", color: "#555555" },
              { type: "text", text: "✅ LAX着陸後すぐ使える", size: "xs", color: "#555555" },
              { type: "text", text: "✅ iPhone・Android対応", size: "xs", color: "#555555" },
              {
                type: "text",
                text: "地図・動画・SNSを頻繁に使う方向け",
                size: "xs",
                color: "#888888",
                margin: "md",
                wrap: true,
              },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            paddingAll: "12px",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#E8372C",
                height: "sm",
                action: {
                  type: "uri",
                  label: "Holaflyで購入する →",
                  uri: getHolaflyUrl(),
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// Claude に渡すeSIMアドバイス用コンテキスト
export const ESIM_CONTEXT = `
【アメリカeSIM情報（ユーザーに案内する際の参考）】
■ 選び方の基準
- データ使用量が少ない・短期滞在 → Airalo（1GB $4.50〜、従量課金）
- 地図・動画・SNSをガンガン使う → Holafly（無制限 $27〜、使い放題）
- どちらも出発前に日本でダウンロード・設定可能
- LAX着陸後、機内モードをオフにするだけで即使える

■ 設定方法（ユーザーが聞いた場合）
1. 購入後メールでQRコードが届く
2. iPhoneの場合：設定 → モバイル通信 → eSIMを追加 → QRコードを読み込む
3. 出発前に設定だけしておき、渡航後に「データローミング」をONにする
4. 日本のSIMも残せる（デュアルSIM）

■ 注意点
- iPhone XS以降・最近のAndroid対応（古い機種は要確認）
- 通話には別途設定が必要な場合あり（データのみプランが多い）
`;
