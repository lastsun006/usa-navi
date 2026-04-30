ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_recommend boolean NOT NULL DEFAULT false;
