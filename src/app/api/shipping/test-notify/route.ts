import { NextResponse } from "next/server";

export async function GET() {
  const adminUserId = process.env.LINE_ADMIN_USER_ID;
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!adminUserId || !token) {
    return NextResponse.json({ ok: false, error: "env missing", adminUserId: !!adminUserId, token: !!token });
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to: adminUserId, messages: [{ type: "text", text: "📦 LINE通知テスト（本番サーバーから）" }] }),
  });

  const body = await res.text();
  return NextResponse.json({ ok: res.ok, status: res.status, body });
}
