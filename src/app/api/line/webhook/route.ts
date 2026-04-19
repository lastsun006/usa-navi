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

// LINEに返信する
async function replyMessage(replyToken: string, text: string) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
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

  // 署名検証（開発中はログのみ、本番では厳格に検証すること）
  if (!verifySignature(body, signature)) {
    console.warn("署名検証失敗 - 開発モードのため続行");
  }

  const data = JSON.parse(body);
  const debugResults: Record<string, unknown>[] = [];

  for (const event of data.events ?? []) {
    if (event.type === "message" && event.message.type === "text") {
      const userMessage = event.message.text;
      const replyToken = event.replyToken;

      try {
        const tokenExists = !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const tokenLength = process.env.LINE_CHANNEL_ACCESS_TOKEN?.length ?? 0;

        const testReply = `[テスト] メッセージ受信: ${userMessage}`;
        const lineRes = await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({ replyToken, messages: [{ type: "text", text: testReply }] }),
        });
        const lineResText = await lineRes.text();
        debugResults.push({
          tokenExists,
          tokenLength,
          lineStatus: lineRes.status,
          lineResponse: lineResText,
          replyTokenPrefix: replyToken?.substring(0, 10),
        });
      } catch (error) {
        debugResults.push({ error: String(error) });
      }
    }
  }

  return NextResponse.json({ status: "ok", debug: debugResults });
}
