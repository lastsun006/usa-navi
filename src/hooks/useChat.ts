"use client";

import { useState, useCallback } from "react";
import type { Message } from "@/types";

export function useChat(usecaseId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const allMessages = [
          ...messages,
          { role: "user" as const, content: userMessage.content },
        ];

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            usecaseId,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "エラーが発生しました");
        }

        const data = await res.json();
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "エラーが発生しました";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, usecaseId, isLoading]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, reset };
}
