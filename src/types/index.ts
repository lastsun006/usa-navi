// ユースケース定義
export interface Usecase {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  tags: string[];
  initialMessage: string;
  quickReplies: string[];
  guideSlug: string;
  subpromptId: string;
}

// チャットメッセージ
export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  phrases?: EnglishPhrase[];    // 英語フレーズが含まれる場合
  quickReplies?: string[];       // 次のクイックリプライ候補
}

// 英語フレーズ
export interface EnglishPhrase {
  situation: string;
  english: string;
  pronunciation: string;
  meaning: string;
}

// チャットセッション
export interface ChatSession {
  id: string;
  usecaseId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// API リクエスト/レスポンス
export interface ChatRequest {
  messages: { role: MessageRole; content: string }[];
  usecaseId: string;
  sessionId?: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
}

// ユーザーフィードバック
export type FeedbackType = "helpful" | "not_helpful";

export interface Feedback {
  messageId: string;
  sessionId: string;
  type: FeedbackType;
  usecaseId: string;
  timestamp: Date;
}
