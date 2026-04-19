"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@/hooks/useChat";
import { MessageBubble, TypingIndicator } from "@/components/MessageBubble";
import { QuickReply } from "@/components/QuickReply";
import type { Usecase } from "@/types";

interface Props {
  usecase: Usecase;
}

export function ChatInterface({ usecase }: Props) {
  const { messages, isLoading, error, sendMessage } = useChat(usecase.id);
  const [input, setInput] = useState("");
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 初期メッセージを送信
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      // AIの初期メッセージをローカルで表示（APIコール不要）
    }
  }, [initialized]);

  // 新メッセージ時にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  // 最後のメッセージがAIからの場合、クイックリプライを非表示（会話が続いているため）
  const showInitialQuickReplies = messages.length === 0;
  const lastIsAssistant =
    messages.length > 0 && messages[messages.length - 1].role === "assistant";

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 safe-area-top">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="トップへ戻る"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-slate-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl">{usecase.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {usecase.title}
            </p>
            <p className="text-xs text-slate-500">USA Navi</p>
          </div>
        </div>
      </header>

      {/* メッセージエリア */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scroll">
        {/* AIの初期メッセージ（静的表示） */}
        <div className="flex justify-start animate-fade-in-up">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-2 mt-1">
            🗺️
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 bg-white shadow-sm border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {usecase.initialMessage}
          </div>
        </div>

        {/* クイックリプライ（初期状態のみ表示） */}
        {showInitialQuickReplies && (
          <QuickReply
            replies={usecase.quickReplies}
            onSelect={handleQuickReply}
            disabled={isLoading}
          />
        )}

        {/* 会話メッセージ */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* ローディング */}
        {isLoading && <TypingIndicator />}

        {/* エラー表示 */}
        {error && (
          <div className="mx-auto max-w-xs text-center bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* AIの後続クイックリプライ候補（オプション） */}
        {lastIsAssistant && !isLoading && (
          <div className="flex flex-wrap gap-2 pt-1">
            {["もっと詳しく教えて", "英語フレーズがほしい", "他に注意点は？"].map(
              (r) => (
                <button
                  key={r}
                  onClick={() => handleQuickReply(r)}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                >
                  {r}
                </button>
              )
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* 入力エリア */}
      <footer className="bg-white border-t border-slate-200 px-4 py-3 safe-area-bottom">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="送信"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19V5m-7 7l7-7 7 7"
              />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          AIの回答は参考情報です。最新情報は必ず公式サイトでご確認ください
        </p>
      </footer>
    </div>
  );
}
