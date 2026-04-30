// ─────────────────────────────────────────────
// ビジネスURL 営業確認モジュール
// ・Supabase url_cache テーブルで結果を1週間キャッシュ
// ・200〜399 → active / それ以外 or タイムアウト → uncertain
// ─────────────────────────────────────────────

import { supabase } from "@/lib/supabase";
import { Business } from "@/lib/knowledge-base";

const CACHE_TTL_DAYS = 7; // キャッシュ有効期間

export type VerifyStatus = "active" | "uncertain" | "unchecked";

interface CacheRow {
  url: string;
  status: VerifyStatus;
  checked_at: string;
}

// ─────────────────────────────────────────────
// キャッシュ読み書き
// ─────────────────────────────────────────────

async function getCachedStatus(url: string): Promise<VerifyStatus | null> {
  try {
    const { data } = await supabase
      .from("url_cache")
      .select("status, checked_at")
      .eq("url", url)
      .single();

    if (!data) return null;

    // TTL チェック
    const checkedAt = new Date(data.checked_at).getTime();
    const now = Date.now();
    const ttlMs = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
    if (now - checkedAt > ttlMs) return null; // 期限切れ

    return data.status as VerifyStatus;
  } catch {
    return null;
  }
}

async function setCachedStatus(url: string, status: VerifyStatus): Promise<void> {
  try {
    await supabase.from("url_cache").upsert(
      { url, status, checked_at: new Date().toISOString() },
      { onConflict: "url" }
    );
  } catch {
    // キャッシュ保存失敗は無視（メイン処理に影響させない）
  }
}

// ─────────────────────────────────────────────
// URL の疎通確認（HEADリクエスト、3秒タイムアウト）
// ─────────────────────────────────────────────

async function checkUrl(url: string): Promise<VerifyStatus> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "SoCalNavi-Bot/1.0" },
    });

    clearTimeout(timer);

    // 2xx〜3xx → 正常
    if (res.status >= 200 && res.status < 400) return "active";

    // 404 / 410 → 閉業の可能性
    if (res.status === 404 || res.status === 410) return "uncertain";

    // その他（503 など）→ 不明
    return "uncertain";
  } catch {
    // タイムアウト or ネットワークエラー → 不明扱い
    return "uncertain";
  }
}

// ─────────────────────────────────────────────
// 公開API：1件確認
// ─────────────────────────────────────────────

export async function verifyUrl(url: string): Promise<VerifyStatus> {
  // キャッシュ確認
  const cached = await getCachedStatus(url);
  if (cached !== null) return cached;

  // 実際に確認
  const status = await checkUrl(url);
  await setCachedStatus(url, status);
  return status;
}

// ─────────────────────────────────────────────
// 公開API：ビジネスリストを並列確認して active のみ返す
// ─────────────────────────────────────────────

export async function filterVerifiedBusinesses(
  businesses: Business[]
): Promise<{ business: Business; status: VerifyStatus }[]> {
  const results = await Promise.all(
    businesses.map(async (biz) => {
      if (!biz.url) return { business: biz, status: "unchecked" as VerifyStatus };
      const status = await verifyUrl(biz.url);
      return { business: biz, status };
    })
  );
  return results;
}

// ─────────────────────────────────────────────
// ビジネス情報をClaudeに渡すテキストへ変換
// status が uncertain でも除外せず「要確認」注記を付ける
// ─────────────────────────────────────────────

export function formatBusinessForPrompt(
  biz: Business,
  status: VerifyStatus
): string {
  const statusNote =
    status === "uncertain"
      ? "（※ 最新情報は公式サイト・電話でご確認ください）"
      : "";

  const lines = [
    `【${biz.name}】${statusNote}`,
    biz.description,
  ];

  if (biz.phone) lines.push(`📞 ${biz.phone}`);
  if (biz.address) lines.push(`📍 ${biz.address}`);
  if (biz.hours) lines.push(`🕐 ${biz.hours}`);
  if (biz.url) lines.push(`🔗 ${biz.url}`);
  if (biz.features.length > 0) lines.push(`✅ ${biz.features.join(" / ")}`);

  return lines.join("\n");
}
