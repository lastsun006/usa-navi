"use client";

import { useState } from "react";
import type { Message } from "@/types";

interface Props {
  message: Message;
}

// 英語フレーズブロックを解析して視覚的に整形する
function renderContent(content: string) {
  const parts = content.split(/(---[\s\S]*?---)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("---") && part.endsWith("---")) {
      return <PhraseBlock key={idx} raw={part} />;
    }
    // 通常テキスト：改行・太字を処理
    return (
      <span key={idx} className="whitespace-pre-wrap">
        {formatText(part)}
      </span>
    );
  });
}

function formatText(text: string) {
  // **太字** を <strong> に変換
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function PhraseBlock({ raw }: { raw: string }) {
  const [copied, setCopied] = useState(false);

  // "英語": "..." の部分を取り出す
  const englishMatch = raw.match(/\*\*英語\*\*:\s*"([^"]+)"/);
  const englishText = englishMatch?.[1] ?? "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(englishText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック
    }
  };

  // raw から --- を除去して整形
  const cleaned = raw.replace(/^---\n?|\n?---$/g, "").trim();

  return (
    <div className="my-2 rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm">
      <div className="text-blue-800 whitespace-pre-wrap">
        {formatText(cleaned)}
      </div>
      {englishText && (
        <button
          onClick={handleCopy}
          className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
          aria-label="英語フレーズをコピー"
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>コピーしました</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>英語フレーズをコピー</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex animate-fade-in-up ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-2 mt-1">
          🗺️
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-white text-slate-800 rounded-bl-sm shadow-sm border border-slate-100"
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          renderContent(message.content)
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-2">
        🗺️
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100">
        <div className="flex gap-1.5 items-center h-4">
          <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 inline-block" />
        </div>
      </div>
    </div>
  );
}
