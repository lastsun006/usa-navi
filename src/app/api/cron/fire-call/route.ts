import { NextRequest, NextResponse } from "next/server";
import { getCallById, updateCall } from "@/lib/supabase";
import { makeReservationCall, ReservationRequest } from "@/lib/bland-caller";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callId = request.nextUrl.searchParams.get("id");
  if (!callId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const call = await getCallById(callId);
  if (!call) {
    return NextResponse.json({ error: "call not found" }, { status: 404 });
  }

  try {
    const { callData, scheduledAt, retryAt } = JSON.parse(call.result ?? "{}");
    const req = (callData ?? {}) as Partial<ReservationRequest>;

    if (!req.restaurantName || !req.phoneNumber || !req.date || !req.time || !req.partySize || !req.guestName) {
      await updateCall(call.id, { status: "failed", result: "発信データ不足のため失敗しました。" });
      return NextResponse.json({ ok: false, error: "missing call data" });
    }

    const isRetry = !!retryAt; // retryAtがあればリトライ、scheduledAtならスケジュール発信

    const { callId: blandCallId } = await makeReservationCall({
      restaurantName: req.restaurantName,
      phoneNumber: req.phoneNumber,
      date: req.date,
      time: req.time,
      partySize: req.partySize,
      guestName: req.guestName,
      specialRequest: req.specialRequest,
      userId: call.user_id,
      isRetry,
    });

    await updateCall(call.id, { call_id: blandCallId, status: "calling" });
    console.log(`発信成功: callRecordId=${call.id} scheduledAt=${scheduledAt ?? retryAt} → blandCallId=${blandCallId}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("fire-call エラー:", err);
    await updateCall(call.id, { status: "failed", result: "発信中にエラーが発生しました。" });
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
