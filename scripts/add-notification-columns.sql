-- users テーブルに通知設定カラムを追加
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_weather boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_news    boolean NOT NULL DEFAULT false;
