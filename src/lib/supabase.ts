import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// サーバーサイド用（書き込み権限あり）
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ユーザー型
export interface UserProfile {
  id?: number;
  line_user_id: string;
  age_group: string | null;
  travel_purpose: string | null;
  onboarding_done: boolean;
  onboarding_step: number;
  notify_weather: boolean;
  notify_news: boolean;
  notify_recommend: boolean;
  call_credits: number;
  pending_action: string | null;
  last_lat: number | null;
  last_lng: number | null;
  memory_spots: string | null;
  memory_food: string | null;
  memory_companions: string | null;
}

// ユーザー取得（なければ作成）
export async function getOrCreateUser(lineUserId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("line_user_id", lineUserId)
    .single();

  if (data) return data;

  // 新規ユーザー作成
  const { data: newUser, error: createError } = await supabase
    .from("users")
    .insert({ line_user_id: lineUserId, onboarding_done: false, onboarding_step: 0 })
    .select()
    .single();

  if (createError) throw createError;
  return newUser;
}

// ユーザー更新
export async function updateUser(lineUserId: string, updates: Partial<UserProfile>) {
  const { error } = await supabase
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("line_user_id", lineUserId);

  if (error) throw error;
}

// 通知をONにしているユーザー全員取得
export async function getUsersWithNotification(type: "weather" | "news" | "recommend"): Promise<UserProfile[]> {
  const col = type === "weather" ? "notify_weather" : type === "news" ? "notify_news" : "notify_recommend";
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq(col, true);
  return data ?? [];
}

// 会話履歴の型
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// 会話を保存
export async function saveConversation(lineUserId: string, role: "user" | "assistant", content: string) {
  await supabase.from("conversations").insert({ line_user_id: lineUserId, role, content });
}

// 直近5往復（10件）取得
export async function getRecentConversations(lineUserId: string): Promise<ConversationMessage[]> {
  const { data } = await supabase
    .from("conversations")
    .select("role, content")
    .eq("line_user_id", lineUserId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!data) return [];
  // 古い順に並び替えてから返す
  return data.reverse().map(d => ({ role: d.role, content: d.content }));
}

// ──────────────────────────────────────
// 電話代行（calls テーブル）
// ──────────────────────────────────────

export interface CallRecord {
  id: string;
  user_id: string;
  call_id: string | null;
  restaurant: string | null;
  phone: string | null;
  status: "collecting" | "confirming" | "calling" | "completed" | "failed" | "cancelled" | "admin_combo" | "admin_credits" | "pending_retry" | "awaiting_retry" | "scheduling" | "scheduled" | "awaiting_rebook";
  result: string | null;
  created_at: string;
}

// 保留中の通話を保存
export async function savePendingCall(userId: string, data: Partial<CallRecord>): Promise<string> {
  const { data: row, error } = await supabase
    .from("calls")
    .insert({ user_id: userId, ...data })
    .select()
    .single();
  if (error) throw error;
  return row.id;
}

// ユーザーの保留中通話を取得（最新1件）
export async function getPendingCall(userId: string): Promise<CallRecord | null> {
  const { data } = await supabase
    .from("calls")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["collecting", "confirming", "scheduling", "admin_combo", "admin_credits"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}

// 通話レコードをIDで取得
export async function getCallById(id: string): Promise<CallRecord | null> {
  const { data } = await supabase
    .from("calls")
    .select("*")
    .eq("id", id)
    .single();
  return data ?? null;
}

// call_idで通話レコードを取得（Bland.aiからのwebhook用）
export async function getCallByBlandId(blandCallId: string): Promise<CallRecord | null> {
  const { data } = await supabase
    .from("calls")
    .select("*")
    .eq("call_id", blandCallId)
    .single();
  return data ?? null;
}

// リトライ待ちの通話を全件取得
export async function getPendingRetries(): Promise<CallRecord[]> {
  const { data } = await supabase
    .from("calls")
    .select("*")
    .eq("status", "pending_retry");
  return data ?? [];
}

// スケジュール済みの通話を全件取得
export async function getScheduledCalls(): Promise<CallRecord[]> {
  const { data } = await supabase
    .from("calls")
    .select("*")
    .eq("status", "scheduled");
  return data ?? [];
}

// 通話レコードを更新
export async function updateCall(id: string, updates: Partial<CallRecord>) {
  const { error } = await supabase
    .from("calls")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}
