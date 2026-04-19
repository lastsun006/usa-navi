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

// Claudeで回答を生成する
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

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  // 署名検証
  if (!verifySignature(body, signature)) {
    console.warn("署名検証失敗");
    // 本番では return NextResponse.json({ status: "forbidden" }, { status: 403 });
  }

  const data = JSON.parse(body);

  for (const event of data.events ?? []) {
    if (event.type === "message" && event.message.type === "text") {
      const userMessage = event.message.text;
      const replyToken = event.replyToken;

      try {
        const reply = await generateReply(userMessage);

        const lineRes = await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({ replyToken, messages: [{ type: "text", text: reply }] }),
        });

        if (!lineRes.ok) {
          const errText = await lineRes.text();
          console.error("LINE返信エラー:", lineRes.status, errText);
        }
      } catch (error) {
        console.error("エラー:", error);
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
