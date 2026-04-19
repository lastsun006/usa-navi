# USA Navi — 初めてのアメリカ旅行者向け AIコンシェルジュ

> 「旅行中に助かる」を最優先にした、日本人向けアメリカ旅行サポートAI

## プロダクト概要

**ターゲット**: 初めてアメリカへ行く日本人旅行者（英語不安・子連れ・個人旅行）  
**価値提供**: 安心・失敗回避・時短・現地での判断補助  
**MVP形式**: スマホ特化のチャット型コンシェルジュ（LINE感覚で使える）

### MVPで対応する5ユースケース
1. LAX到着〜ホテル移動
2. ドジャース観戦
3. アメリカのレストラン利用
4. 子連れ旅行
5. ディズニー関連（ディズニーランド/DCA）

---

## ディレクトリ構成

```
usa-navi/
├── README.md
├── docs/
│   ├── PRD.md              # プロダクト要件定義
│   ├── IA.md               # 情報設計
│   └── AI_DESIGN.md        # AI応答設計
├── prompts/
│   └── system-prompt.md    # AIシステムプロンプト本文
├── data/
│   ├── usecases.json       # ユースケース定義
│   ├── knowledge-base.json # 静的知識ベース
│   └── english-phrases.json # 英語フレーズ集
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                    # トップ / ユースケース選択
    │   ├── chat/
    │   │   └── [usecaseId]/
    │   │       └── page.tsx            # チャット画面
    │   ├── guide/
    │   │   └── [usecaseId]/
    │   │       └── page.tsx            # 目的別ガイド（静的）
    │   └── api/
    │       └── chat/
    │           └── route.ts            # Claude API エンドポイント
    ├── components/
    │   ├── UsecaseSelector.tsx         # ユースケース選択UI
    │   ├── ChatInterface.tsx           # チャットUI本体
    │   ├── MessageBubble.tsx           # メッセージ表示
    │   ├── PhraseCard.tsx              # 英語フレーズカード
    │   ├── QuickReply.tsx              # クイックリプライボタン
    │   └── ui/                        # shadcn/ui コンポーネント
    ├── lib/
    │   ├── claude.ts                   # Claude API接続
    │   ├── prompts.ts                  # プロンプト生成
    │   ├── usecases.ts                 # ユースケースデータ
    │   └── knowledge.ts               # 知識ベース参照
    ├── hooks/
    │   └── useChat.ts                  # チャット状態管理
    └── types/
        └── index.ts                    # 型定義
```

---

## 技術スタック

| レイヤー | 採用技術 | 理由 |
|--------|---------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript | Vercel最速デプロイ、API Routesで一元管理 |
| スタイル | Tailwind CSS + shadcn/ui | 高速UI開発 |
| AI | Anthropic Claude API (claude-sonnet-4-6) | 高品質な日本語、安全性 |
| DB | Supabase (PostgreSQL) | 無料枠、Row Level Security |
| 認証 | Supabase Auth (Google/LINE OAuth) | MVP段階はアノニマスOK |
| デプロイ | Vercel | Next.jsとの相性最高、CDN標準搭載 |
| 分析 | Vercel Analytics + カスタムログ | 最初はシンプルに |

---

## ローカル開発

```bash
# 依存インストール
npm install

# 環境変数設定
cp .env.example .env.local
# ANTHROPIC_API_KEY=your_key
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# 開発サーバー起動
npm run dev
```

---

## MVP成功指標

- 週間アクティブユーザー: 100人（β版3ヶ月目）
- 1セッションあたり平均メッセージ数: 5以上
- 「役に立った」評価率: 70%以上
- ユースケース完走率: 60%以上

---

## フェーズロードマップ

| フェーズ | 内容 | 期間目安 |
|---------|------|---------|
| Phase 1 | 超最小MVP（チャット+5UC） | 2週間 |
| Phase 2 | 知識ベース強化+ガイド画面 | 1ヶ月 |
| Phase 3 | 認証+ログ+改善 | 1ヶ月 |
| Phase 4 | 課金+B2B提携導線 | 2ヶ月 |
