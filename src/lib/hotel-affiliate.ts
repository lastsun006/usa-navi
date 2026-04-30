// ─────────────────────────────────────────────
// ホテルアフィリエイトリンク生成（Booking.com）
// ─────────────────────────────────────────────

// エリアごとのBooking.com 検索キーワード
const AREA_SEARCH: Record<string, { ss: string; label: string }> = {
  LA:        { ss: "Los+Angeles%2C+California%2C+United+States", label: "ロサンゼルス" },
  Anaheim:   { ss: "Anaheim%2C+California%2C+United+States",     label: "アナハイム" },
  SanDiego:  { ss: "San+Diego%2C+California%2C+United+States",   label: "サンディエゴ" },
  SoCal:     { ss: "Los+Angeles%2C+California%2C+United+States", label: "SoCal" },
};

// エリア別おすすめホテルゾーン（Claude回答補足用）
export const HOTEL_ZONE_TIPS: Record<string, string> = {
  LA: `【LAのホテル選びのコツ】
・サンタモニカ周辺：海が近く観光しやすい。やや高め$200〜
・ハリウッド：観光地の中心。中価格帯$150〜
・ダウンタウン：ビジネス向け、夜は注意エリアあり
・ビバリーヒルズ：高級感があるが$300〜`,
  Anaheim: `【アナハイムのホテル選びのコツ】
・ディズニーランド徒歩圏（Harbor Blvd沿い）が便利
・オフィシャルホテルは高いが特典あり（早期入場等）
・周辺モーテルは$80〜とコスパ良いが車が必要`,
  SanDiego: `【サンディエゴのホテル選びのコツ】
・ガスランプクォーター：夜も楽しめる繁華街直結
・ラホヤ：高級リゾート系、景色が最高
・ミッションベイ：ファミリー向け、ビーチ近接`,
  SoCal: `【エリア別のポイント】
・ LA（サンタモニカ）：観光◎ $200〜
・ アナハイム：ディズニー派 $120〜
・ サンディエゴ：ビーチリゾート派 $160〜`,
};

// Booking.comアフィリリンク生成
export function buildBookingLink(area: string = "LA"): string {
  const aid = process.env.BOOKING_AFFILIATE_ID ?? "";
  const dest = AREA_SEARCH[area] ?? AREA_SEARCH.LA;

  const params = new URLSearchParams({
    ss: dest.ss,
    lang: "ja",
    selected_currency: "USD",
    ...(aid ? { aid } : {}),
  });

  // URLSearchParamsがssを再エンコードするのを防ぐ
  return `https://www.booking.com/searchresults.html?aid=${aid}&ss=${dest.ss}&lang=ja&selected_currency=USD`;
}

// ホテルリンクFlexメッセージ生成
export function buildHotelFlexMessage(area: string = "LA") {
  const dest = AREA_SEARCH[area] ?? AREA_SEARCH.LA;
  const url  = buildBookingLink(area);

  return {
    type: "flex",
    altText: `🏨 ${dest.label}のホテルを予約する`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: "🏨 ホテルを予約する",
            weight: "bold",
            size: "md",
            color: "#1A73E8",
          },
          {
            type: "text",
            text: `${dest.label} ｜ Booking.com（日本語対応）`,
            size: "sm",
            color: "#555555",
            wrap: true,
          },
          {
            type: "text",
            text: "無料キャンセル・今すぐ予約可",
            size: "xs",
            color: "#27AE60",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#1A73E8",
            height: "sm",
            action: {
              type: "uri",
              label: `${dest.label}のホテルを探す`,
              uri: url,
            },
          },
        ],
      },
    },
  };
}

// メッセージ内にホテル関連キーワードが含まれるか判定
export function isHotelQuery(message: string): boolean {
  return /ホテル|宿泊|泊まる|泊まれ|宿|モーテル|リゾート|アコモ|accommodation|hotel/i.test(message);
}
