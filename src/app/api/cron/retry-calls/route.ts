import { NextRequest, NextResponse } from "next/server";
import { getPendingRetries, getScheduledCalls, updateCall } from "@/lib/supabase";
import { makeReservationCall, ReservationRequest } from "@/lib/bland-caller";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Vercel Cron のセキュリティヘッダー確認
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  let processed = 0;

  // ① リトライ待ち
  const retries = await getPendingRetries();
  for (const call of retries) {
    try {
      const { retryAt, callData } = JSON.parse(call.result ?? "{}");
      if (!retryAt || new Date(retryAt).getTime() > now) continue;

      const req = callData as Partial<ReservationRequest>;
      if (!req.restaurantName || !req.phoneNumber || !req.date || !req.time || !req.partySize || !req.guestName) {
        await updateCall(call.id, { status: "failed", result: "リトライデータ不足のため失敗しました。" });
        continue;
      }

      const { callId } = await makeReservationCall({
        restaurantName: req.restaurantName,
        phoneNumber: req.phoneNumber,
        date: req.date,
        time: req.time,
        partySize: req.partySize,
        guestName: req.guestName,
        specialRequest: req.specialRequest,
        userId: call.user_id,
        isRetry: true,
      });

      await updateCall(call.id, { call_id: callId, status: "calling" });
      console.log(`リトライ発信: ${call.id} → ${callId}`);
      processed++;
    } catch (err) {
      console.error("リトライエラー:", call.id, err);
      await updateCall(call.id, { status: "failed", result: "リトライ中にエラーが発生しました。" });
    }
  }

  // ② スケジュール済み通話
  const scheduled = await getScheduledCalls();
  for (const call of scheduled) {
    try {
      const { scheduledAt, callData } = JSON.parse(call.result ?? "{}");
      if (!scheduledAt || new Date(scheduledAt).getTime() > now) continue;

      const req = callData as Partial<ReservationRequest>;
      if (!req.restaurantName || !req.phoneNumber || !req.date || !req.time || !req.partySize || !req.guestName) {
        await updateCall(call.id, { status: "failed", result: "スケジュールデータ不足のため失敗しました。" });
        continue;
      }

      const { callId } = await makeReservationCall({
        restaurantName: req.restaurantName,
        phoneNumber: req.phoneNumber,
        date: req.date,
        time: req.time,
        partySize: req.partySize,
        guestName: req.guestName,
        specialRequest: req.specialRequest,
        userId: call.user_id,
      });

      await updateCall(call.id, { call_id: callId, status: "calling" });
      console.log(`スケジュール発信: ${call.id} → ${callId}`);
      processed++;
    } catch (err) {
      console.error("スケジュールエラー:", call.id, err);
      await updateCall(call.id, { status: "failed", result: "スケジュール発信中にエラーが発生しました。" });
    }
  }

  return NextResponse.json({ ok: true, processed });
}
