-- ─────────────────────────────────────────────
-- url_cache テーブル
-- ビジネスURLの営業確認結果を1週間キャッシュする
-- ─────────────────────────────────────────────

create table if not exists url_cache (
  url        text primary key,
  status     text not null check (status in ('active', 'uncertain', 'unchecked')),
  checked_at timestamptz not null default now()
);

-- インデックス（checked_at で古いキャッシュをクリーンアップ用）
create index if not exists url_cache_checked_at_idx on url_cache (checked_at);

-- RLS は不要（サーバーサイド専用）
alter table url_cache enable row level security;

-- サービスロールのみアクセス可（anon は不可）
create policy "service_role_only" on url_cache
  using (auth.role() = 'service_role');
