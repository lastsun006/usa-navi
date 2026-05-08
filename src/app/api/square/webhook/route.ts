import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Square が決済完了後にここを叩く
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("Square webhook received:", JSON.stringify(data).slice(0, 500));

    const eventType: string = data.type ?? "";

    // 支払い完了イベント
    if (eventType === "payment.updated" || eventType === "payment.completed") {
      const payment = data.data?.object?.payment;
      const referenceId: string = payment?.reference_id ?? "";
      const note: string        = payment?.note ?? "";
      const status: string      = payment?.status ?? "";
      const amount: number      = payment?.amount_money?.amount ?? 0;

      console.log("Payment status:", status, "amount:", amount, "referenceId:", referenceId, "note:", note);

      if (status !== "COMPLETED") {
        return NextResponse.json({ ok: true });
      }

      // 重複処理防止：payment IDで確認
      const paymentId: string = payment?.id ?? "";
      if (paymentId) {
        const { data: existing } = await supabase
          .from("processed_payments")
          .select("id")
          .eq("payment_id", paymentId)
          .single();
        if (existing) {
          console.log("重複webhook: スキップ", paymentId);
          return NextResponse.json({ ok: true });
        }
        await supabase.from("processed_payments").insert({ payment_id: paymentId });
      }

      // ── スタッフ相談 $9（900セント）────────────────────────
      if (amount === 900) {
        // noteにLINEユーザーIDが入っている
        const lineUserId = note.startsWith("U") ? note : referenceId;
        if (!lineUserId || !lineUserId.startsWith("U")) {
          console.warn("相談支払い: LINE user IDが見つかりません");
          return NextResponse.json({ ok: true });
        }

        // ユーザーに受付完了を通知
        await pushToLine(lineUserId,
          `✅ お支払いを確認しました！\n\n💬 スタッフ相談を受け付けました。\n\n24時間以内に担当スタッフからこちらのLINEに返信します。\nそのままご相談内容を送っておいていただいても大丈夫です📩`
        );

        // オーナーに通知
        const ownerLineId = process.env.OWNER_LINE_USER_ID;
        if (ownerLineId) {
          // LINEの表示名を取得
          const displayName = await getLineDisplayName(lineUserId);
          await pushToLine(ownerLineId,
            `💰 スタッフ相談料 $9 受領\n\n👤 ${displayName}\n🆔 ${lineUserId}\n\n24時間以内に返信してください。\nLINE OA管理画面でユーザー名を検索して返信できます。`
          );
        }

        console.log(`相談支払い完了: ${lineUserId}`);
        return NextResponse.json({ ok: true });
      }

      // ── 電話代行クレジット購入 ────────────────────────────
      if (!referenceId || !referenceId.startsWith("U")) {
        console.warn("電話代行支払い: LINE user IDが見つかりません:", referenceId);
        return NextResponse.json({ ok: true });
      }

      const { data: user } = await supabase
        .from("users")
        .select("call_credits")
        .eq("line_user_id", referenceId)
        .single();

      const currentCredits = user?.call_credits ?? 0;
      await supabase
        .from("users")
        .update({ call_credits: currentCredits + 3 })
        .eq("line_user_id", referenceId);

      console.log(`クレジット付与: ${referenceId} → ${currentCredits + 3}回`);

      await pushToLine(referenceId,
        `✅ お支払いが確認できました！\n\n📞 電話代行クレジット 3回分を付与しました。\n\n「電話代行」と送ってさっそく使ってみてください🎉`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Square webhook error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

async function pushToLine(lineUserId: string, text: string) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text }] }),
  });
  if (!res.ok) console.error("LINE Push エラー:", res.status, await res.text());
}

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
