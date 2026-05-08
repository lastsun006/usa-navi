import { NextRequest, NextResponse } from "next/server";
import { getCallByBlandId, updateCall, supabase } from "@/lib/supabase";
import { scheduleCronJobAt } from "@/lib/cron-scheduler";
import Anthropic from "@anthropic-ai/sdk";

// Bland.ai が通話完了後にここを叩いてくれる
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("Bland.ai webhook received:", JSON.stringify(data).slice(0, 1000));

    const blandCallId: string = data.call_id;
    const status: string = data.status ?? "unknown";
    const summary: string = data.summary ?? "";

    // metadata から取得
    const metaUserId: string | undefined = data.variables?.userId ?? data.metadata?.userId;
    const restaurantName: string = data.variables?.restaurantName ?? data.metadata?.restaurantName ?? "お店";
    const phone: string = data.variables?.phone ?? data.metadata?.phone ?? "";
    const isRetry: boolean = data.metadata?.isRetry === true;

    if (!blandCallId) {
      return NextResponse.json({ ok: false, error: "no call_id" });
    }

    // DB から対応するレコードを探す
    let lineUserId = metaUserId;
    let callRecordId: string | undefined;
    let originalCallData: Record<string, unknown> = {};

    try {
      const callRecord = await getCallByBlandId(blandCallId);
      if (callRecord) {
        lineUserId = callRecord.user_id;
        callRecordId = callRecord.id;
        // result に CallData JSON が残っていれば保存（pending_retry 設定用）
        try {
          const parsed = JSON.parse(callRecord.result ?? "{}");
          if (parsed.restaurantName || parsed.phoneNumber) {
            originalCallData = parsed;
          }
        } catch { /* ignore */ }
      }
    } catch (dbErr) {
      console.error("DB lookup error:", dbErr);
    }

    if (!lineUserId) {
      console.error("Cannot find lineUserId for call:", blandCallId);
      return NextResponse.json({ ok: false, error: "user not found" });
    }

    // 繋がらなかった判定：no-answer / voicemail / summaryが空のcompleted
    const noConnection = status === "no-answer" || status === "voicemail" || (status === "completed" && !summary.trim());

    if (noConnection && !isRetry) {
      // 繋がらなかった → ユーザーに再発信するか確認
      if (callRecordId) {
        await updateCall(callRecordId, {
          status: "awaiting_retry",
          result: JSON.stringify({ callData: originalCallData, phone, restaurantName }),
        });
      }
      await pushToLine(lineUserId,
        `📵 ${restaurantName} に繋がりませんでした。\n\n15分後に再発信しますか？`,
        [
          { label: "🔄 15分タイマーセット", text: "__retry_confirm" },
          { label: "❌ やめる", text: "__retry_cancel" },
        ]
      );
      return NextResponse.json({ ok: true });
    }

    // 通常の結果処理
    let resultMessage = "";
    if (status === "completed" && summary.trim()) {
      const result = await summarizeInJapanese(summary, restaurantName, originalCallData);

      if (result.type === "alternative") {
        // レストランが別の時間を提案 → ユーザーに確認
        if (callRecordId) {
          await updateCall(callRecordId, {
            status: "awaiting_rebook",
            result: JSON.stringify({ callData: originalCallData, phone, restaurantName, alternativeTimeEn: result.timeEn, alternativeTimeJa: result.timeJa }),
          });
        }
        await pushToLine(lineUserId,
          `🕗 ${restaurantName} から「${result.timeJa}なら予約できます」とのことでした。\n\n${result.timeJa}（同じ条件）で予約を取り直しますか？`,
          [
            { label: `✅ ${result.timeJa}で予約する`, text: "__rebook_confirm" },
            { label: "❌ やめる", text: "__rebook_cancel" },
          ]
        );
        return NextResponse.json({ ok: true });
      }

      if (result.type === "unavailable") {
        // レストランが明確に予約不可と回答
        resultMessage = `❌ ${restaurantName} への予約はできませんでした。\n\n${result.reason}`;
        if (callRecordId) {
          await updateCall(callRecordId, { status: "failed", result: resultMessage });
        }
        await pushToLine(lineUserId, resultMessage);
        return NextResponse.json({ ok: true });
      }

      if (result.type === "not_confirmed") {
        // summaryはあるが予約未確定 → 繋がらなかった扱い
        if (!isRetry) {
          if (callRecordId) {
            await updateCall(callRecordId, {
              status: "awaiting_retry",
              result: JSON.stringify({ callData: originalCallData, phone, restaurantName }),
            });
          }
          await pushToLine(lineUserId,
            `📵 ${restaurantName} に繋がりませんでした。\n\n15分後に再発信しますか？`,
            [
              { label: "🔄 15分タイマーセット", text: "__retry_confirm" },
              { label: "❌ やめる", text: "__retry_cancel" },
            ]
          );
          return NextResponse.json({ ok: true });
        }
        resultMessage = `📵 ${restaurantName} に再度かけ直しましたが、繋がりませんでした。\n\n営業時間をご確認のうえ、別の日にお電話されることをお勧めします。\n📞 ${phone}`;
      } else {
        // confirmed
        resultMessage = result.message;
      }
    } else if (noConnection) {
      resultMessage = isRetry
        ? `📵 ${restaurantName} に再度かけ直しましたが、繋がりませんでした。\n\n営業時間をご確認のうえ、別の日にお電話されることをお勧めします。\n📞 ${phone}`
        : "";

      if (!isRetry && callRecordId) {
        await updateCall(callRecordId, {
          status: "awaiting_retry",
          result: JSON.stringify({ callData: originalCallData, phone, restaurantName }),
        });
        await pushToLine(lineUserId,
          `📵 ${restaurantName} に繋がりませんでした。\n\n15分後に再発信しますか？`,
          [
            { label: "🔄 15分タイマーセット", text: "__retry_confirm" },
            { label: "❌ やめる", text: "__retry_cancel" },
          ]
        );
        return NextResponse.json({ ok: true });
      }
    } else {
      resultMessage = `📵 ${restaurantName} に繋がりませんでした。\n\n営業時間をご確認のうえ、別の日にお電話されることをお勧めします。\n📞 ${phone}`;
    }

    // DB 更新
    if (callRecordId) {
      await updateCall(callRecordId, {
        status: status === "completed" ? "completed" : "failed",
        result: resultMessage,
      });
    }

    // クレジット処理（リトライは消費しない）
    if (!isRetry) {
      const reservationMade = status === "completed" && summary &&
        /confirmed|reservation|booked|set up|all set/i.test(summary);

      if (reservationMade) {
        const { data: userData } = await supabase
          .from("users").select("call_credits").eq("line_user_id", lineUserId).single();
        const current = userData?.call_credits ?? 0;
        if (current > 0) {
          await supabase.from("users").update({ call_credits: current - 1 }).eq("line_user_id", lineUserId);
        }
      }
    }

    // LINE にプッシュ通知
    await pushToLine(lineUserId, resultMessage);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bland webhook error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

type SummaryResult =
  | { type: "confirmed"; message: string }
  | { type: "alternative"; timeEn: string; timeJa: string }
  | { type: "unavailable"; reason: string }
  | { type: "not_confirmed" };

// Claude で英語のsummaryを解析
async function summarizeInJapanese(
  summary: string,
  restaurantName: string,
  callData: Record<string, unknown> = {}
): Promise<SummaryResult> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const timeDisplay = (callData.timeDisplay ?? callData.time ?? "") as string;
    const date = (callData.date ?? "") as string;
    const partySize = callData.partySize ?? "";
    const guestName = (callData.guestName ?? "") as string;
    const knownInfo = `【ユーザーが入力した予約情報】
日時：${date} ${timeDisplay}
人数：${partySize}名
予約名：${guestName}`;

    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: `レストランへの電話代行の通話サマリーを分析してください。

ケース1：予約が確定した（レストランが明確に承諾）
→ 以下の形式で返す：
CONFIRMED
✅ ${restaurantName} への予約が完了しました！
日時：〇月〇日（〇）〇時（時間がない場合は入力情報を使う。絶対に「時間未定」と書かない）
人数：〇名
予約名：〇〇
（確認番号・注意事項があれば追記）

ケース2：レストランが別の時間を提案した（requested time unavailable, offered different time）
→ 以下の形式で返す（提案された時間を英語と日本語で）：
ALTERNATIVE
EN: [提案された時間（例: 8:00 PM）]
JA: [日本語（例: 20時）]

ケース3：レストランが明確に予約不可と断った（"we don't take reservations", "fully booked", "no reservations on weekends" など）
→ 以下の形式で返す（理由を日本語で簡潔に1文）：
UNAVAILABLE
理由：[日本語で理由（例：週末は予約を受け付けていないとのことです）]

ケース4：それ以外（繋がらなかった・確認中・不明など）
→ 以下のみ返す：
NOT_CONFIRMED`,
      messages: [{ role: "user", content: `${knownInfo}\n\n通話サマリー（英語）:\n${summary}` }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";

    if (text.startsWith("CONFIRMED")) {
      return { type: "confirmed", message: text.replace(/^CONFIRMED\n?/, "").trim() };
    }
    if (text.startsWith("ALTERNATIVE")) {
      const enMatch = text.match(/EN:\s*(.+)/);
      const jaMatch = text.match(/JA:\s*(.+)/);
      if (enMatch && jaMatch) {
        return { type: "alternative", timeEn: enMatch[1].trim(), timeJa: jaMatch[1].trim() };
      }
    }
    if (text.startsWith("UNAVAILABLE")) {
      const reasonMatch = text.match(/理由：(.+)/);
      const reason = reasonMatch ? reasonMatch[1].trim() : "予約をお断りされました";
      return { type: "unavailable", reason };
    }
    return { type: "not_confirmed" };
  } catch {
    return { type: "not_confirmed" };
  }
}

async function pushToLine(
  lineUserId: string,
  text: string,
  quickReplyItems?: { label: string; text: string }[]
) {
  const message: Record<string, unknown> = { type: "text", text };
  if (quickReplyItems && quickReplyItems.length > 0) {
    message.quickReply = {
      items: quickReplyItems.map(item => ({
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
  if (!res.ok) {
    const errText = await res.text();
    console.error("LINE Push エラー:", res.status, errText);
  } else {
    console.log("LINE Push 送信成功:", lineUserId);
  }
}
