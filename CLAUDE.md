@AGENTS.md

## SoCal Navi - 現在の状態（2026-04-22）

### 本番URL
https://usa-navi-app.vercel.app
LINE Webhook: https://usa-navi-app.vercel.app/api/line/webhook

### 完成済み機能
- LINE Bot本番稼働
- 9ボタンリッチメニュー（SoCal Navi）
  LAX・ドジャース・レストラン・家族旅行・ディズニー・治安チェック・お土産・ショッピング・チップ
- 治安チェック（位置情報→LAPD犯罪データ+Nominatim逆ジオコーディング+Claude評価）
- クイックリプライ（プロフィール×会話履歴で文脈に合ったフォローアップ生成）
- オンボーディング（年齢・旅の目的をクイックリプライで収集→Supabase保存）
- 会話履歴（直近5往復をSupabaseに保存→Claudeに渡してコンテキスト維持）
- パーソナライズ（家族旅行→子連れ視点、カップル→ロマンチック、一人旅→安全重視）
- 日系サービスRAG（ビビナビ・LALALA情報→キーワード検索→営業確認→Claudeへ注入）

### 重要ファイル
- LINE webhook: src/app/api/line/webhook/route.ts
- Supabase client: src/lib/supabase.ts
- リッチメニュー作成: scripts/create-richmenu.py
- 日系サービス知識ベース: src/lib/knowledge-base.ts
- URL営業確認モジュール: src/lib/verify.ts

### Supabaseテーブル
- users: line_user_id, age_group, travel_purpose, onboarding_done, onboarding_step
- conversations: line_user_id, role, content, created_at
- url_cache: url(PK), status(active/uncertain/unchecked), checked_at（7日間TTL）
- knowledge: （未使用・将来のpgvector RAG用）

### 日系サービスナレッジ（knowledge-base.ts）
情報源: ビビナビLA・LALALA USA・ライトハウスLA・ロサンゼルスタウン（2024〜2026年）
カテゴリ: レンタカー・送迎ツアー・レストラン・日系スーパー・美容院・鍼灸マッサージ・病院・弁護士・緊急連絡先
営業確認: ユーザーへ届ける前にURLへHEADリクエスト（3秒TO）→結果をurl_cacheに7日間保存

### 次にやること候補
- リッチメニューのデザイン改善（絵文字文字化け問題→PIL対応or画像差し替え）
- knowledge-base.ts にビジネスを追記（ビビナビで新情報が出たら随時）
- Vercel Cron Jobs（url_cacheの定期クリーンアップ・情報更新）
- ユーザー数が増えた時のコスト最適化（Haiku使い分け）
