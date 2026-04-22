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
