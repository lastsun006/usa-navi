// ─────────────────────────────────────────────
// Square 決済リンク生成
// ─────────────────────────────────────────────

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_API_URL = "https://connect.squareup.com/v2";

// ユーザー専用の$12決済リンクを生成
export async function createPaymentLink(lineUserId: string): Promise<string> {
  const idempotencyKey = `${lineUserId}-${Date.now()}`;

  const body = {
    idempotency_key: idempotencyKey,
    order: {
      location_id: await getLocationId(),
      reference_id: lineUserId,  // LINE user IDを埋め込む
      line_items: [
        {
          name: "📞 英語電話代行 3回分",
          quantity: "1",
          base_price_money: {
            amount: 1200,  // $12.00
            currency: "USD",
          },
        },
      ],
    },
    checkout_options: {
      redirect_url: "https://line.me/R/",  // 支払い後にLINEに戻る
    },
    payment_note: `SoCal Navi 電話代行 3クレジット | LINE: ${lineUserId}`,
  };

  const res = await fetch(`${SQUARE_API_URL}/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "Square-Version": "2024-01-18",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Square API error: ${err}`);
  }

  const data = await res.json();
  return data.payment_link?.url ?? "";
}

// ロケーションIDを取得（Squareアカウントの店舗ID）
async function getLocationId(): Promise<string> {
  const cached = process.env.SQUARE_LOCATION_ID;
  if (cached) return cached;

  const res = await fetch(`${SQUARE_API_URL}/locations`, {
    headers: {
      "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
      "Square-Version": "2024-01-18",
    },
  });

  const data = await res.json();
  return data.locations?.[0]?.id ?? "";
}
