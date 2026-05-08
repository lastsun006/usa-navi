// ─────────────────────────────────────────────
// Bland.ai 電話代行
// ─────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";

const BLAND_API_KEY = process.env.BLAND_API_KEY!;
const BLAND_API_URL = "https://api.bland.ai/v1/calls";

// 日本語の備考を英語に翻訳
async function translateSpecialRequest(japanese: string): Promise<string> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: `Translate this Japanese restaurant special request into natural English (one concise sentence, no quotes):\n${japanese}`
      }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : japanese;
    return text;
  } catch {
    return japanese; // 失敗時はそのまま
  }
}

export interface ReservationRequest {
  restaurantName: string;
  phoneNumber: string;      // +1-xxx-xxx-xxxx 形式（レストランの番号）
  date: string;             // "Saturday, May 10"
  time: string;             // "8:00 PM"
  partySize: number;
  guestName: string;        // ローマ字
  callbackPhone?: string;   // 折り返し用電話番号（任意）
  specialRequest?: string;
}

// Bland.ai に電話をかける
export async function makeReservationCall(req: ReservationRequest & { userId: string; isRetry?: boolean }): Promise<{
  callId: string;
  status: string;
}> {
  // 備考を英語に翻訳（日本語が含まれている場合）
  if (req.specialRequest && /[　-鿿＀-￯]/.test(req.specialRequest)) {
    req.specialRequest = await translateSpecialRequest(req.specialRequest);
  }

  // 折り返し番号（固定）
  const callbackFormatted = "6 1 9 ... 7 5 7 ... 5 0 9 5";

  const task = buildEnglishScript(req, callbackFormatted);

  // Bland.ai APIは+1xxxxxxxxxxxの形式が必要
  const phoneForApi = req.phoneNumber.startsWith('+') ? req.phoneNumber : `+1${req.phoneNumber}`;

  const body = {
    phone_number: phoneForApi,
    task,
    model: "turbo",
    language: "en",
    voice: "nat",
    max_duration: 8,
    wait_for_greeting: true,
    first_sentence: "Hi there! I'd like to make a reservation please.",
    record: true,
    answered_by_enabled: true,
    voicemail_action: "hangup",
    interruption_threshold: 200,
    noise_cancellation: true,
    webhook: `https://usa-navi-app.vercel.app/api/bland/webhook`,
    metadata: {
      restaurantName: req.restaurantName,
      guestName: req.guestName,
      userId: req.userId,
      callRecordId: "",
      isRetry: req.isRetry ?? false,
    },
  };

  const res = await fetch(BLAND_API_URL, {
    method: "POST",
    headers: {
      authorization: BLAND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bland.ai API error: ${err}`);
  }

  const data = await res.json();
  return {
    callId: data.call_id,
    status: data.status,
  };
}

// 通話結果を取得
export async function getCallResult(callId: string): Promise<{
  status: string;
  transcripts?: string;
  summary?: string;
  completed: boolean;
}> {
  const res = await fetch(`${BLAND_API_URL}/${callId}`, {
    headers: {
      authorization: BLAND_API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to get call result");
  }

  const data = await res.json();
  const completed = data.status === "completed" || data.status === "failed";

  return {
    status: data.status,
    transcripts: data.transcripts?.map((t: { text: string }) => t.text).join(" "),
    summary: data.summary,
    completed,
  };
}

// 英語スクリプト生成
function buildEnglishScript(req: ReservationRequest, callbackPhone: string): string {
  return `
You are making a restaurant reservation on behalf of a guest. Sound like a real, friendly person — natural and relaxed, not robotic.

RESERVATION INFO:
- Guest name: ${req.guestName}
- Party size: ${req.partySize}
- Date: ${req.date}
- Time: ${req.time}
${req.specialRequest ? `- Special request: ${req.specialRequest}` : ""}

HOW TO HANDLE THE CONVERSATION:
- Be warm and conversational. Use natural phrases like "Sure!", "Of course!", "Sounds great!"
- Give one piece of info at a time. Don't dump everything at once.
- Always wait for them to finish speaking before you respond.
- When they ask for your name or party size, give the party size and IMMEDIATELY follow up with the special request if there is one. Example: "Party of ${req.partySize}. Oh, and we'd also need ${req.specialRequest} — is that possible?"
${req.specialRequest ? `- DO NOT forget to mention the special request right after the party size. Always.` : ""}

IF THEY ASK FOR A CALLBACK NUMBER:
Say the number slowly and clearly, one group at a time: "Sure! It's 6-1-9 (pause) 7-5-7 (pause) 5-0-9-5."
The callback number is: 619-757-5095. Always provide this number. Never say you don't have one.

IF THEY ASK FOR AN EMAIL:
Say "I don't have one handy, sorry about that!"

WHEN THE RESERVATION IS CONFIRMED:
Before hanging up, say: "Just so you know, I'm an AI assistant calling on behalf of the guest. Thanks so much, have a great day!" Then say goodbye and hang up immediately.

IF FULLY BOOKED:
Ask if there's availability 30 minutes earlier or later. If nothing works, thank them warmly and hang up.

IF VOICEMAIL:
Hang up immediately. Do not leave a message.

IF SILENCE FOR MORE THAN 5 SECONDS after you finish speaking:
Say "Thank you, goodbye!" and hang up.

IMPORTANT: Never claim the reservation is confirmed. Only the restaurant can confirm it — wait for them to say so.

CRITICAL — TIME AND DATE ARE FIXED:
The requested time is ${req.time} on ${req.date}. This is NOT flexible.
If the restaurant says that time is unavailable and offers a different time, say: "I'm sorry, I need to check with the guest before changing the time. Could I call back?" Then say the AI disclosure and hang up. Do NOT accept a different time on your own.
`.trim();
}

// メッセージから予約情報をパース（Claude APIで処理済みの構造化データを受け取る想定）
export function parseReservationInfo(text: string): Partial<ReservationRequest> {
  const result: Partial<ReservationRequest> = {};

  // 電話番号
  const phoneMatch = text.match(/\+1[-\s]?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
  if (phoneMatch) result.phoneNumber = phoneMatch[0].replace(/\s/g, "");

  // 人数
  const sizeMatch = text.match(/(\d+)\s*(名|人|名様)/);
  if (sizeMatch) result.partySize = parseInt(sizeMatch[1]);

  return result;
}

// 電話代行関連キーワード判定
export function isCallProxyQuery(message: string): boolean {
  return /電話|予約代行|代わりに|英語で予約|レストラン予約|restaurant|call|電話して|予約して/i.test(message);
}
