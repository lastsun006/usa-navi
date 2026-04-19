import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getUsecase } from "@/lib/usecases";
import { buildSystemPrompt } from "@/lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, usecaseId } = await request.json();

    if (!messages || !usecaseId) {
      return NextResponse.json(
        { error: "messages と usecaseId は必須です" },
        { status: 400 }
      );
    }

    const usecase = getUsecase(usecaseId);
    if (!usecase) {
      return NextResponse.json(
        { error: "ユースケースが見つかりません" },
        { status: 404 }
      );
    }

    const systemPrompt = buildSystemPrompt(usecase);

    // 会話履歴を最大10ターンに制限（コスト管理）
    const recentMessages = messages.slice(-10);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: recentMessages.map(
        (msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })
      ),
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("予期しないレスポンス形式です");
    }

    return NextResponse.json({ message: content.text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "AIの応答中にエラーが発生しました。しばらくしてからもう一度お試しください。" },
      { status: 500 }
    );
  }
}
