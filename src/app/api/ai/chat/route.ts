import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { askAI, AI_PROMPTS, AIMessage } from "@/lib/ai/client";

// POST /api/ai/chat - Send a message to the AI
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo-user";
    const body = await request.json();

    const {
      message,
      conversationId,
      context,
      promptType,
    }: {
      message: string;
      conversationId?: string;
      context?: string;
      promptType?: keyof typeof AI_PROMPTS;
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get or create conversation
    let conversation;
    let messages: AIMessage[] = [];

    if (conversationId) {
      conversation = await db.aIConversation.findFirst({
        where: { id: conversationId, userId },
      });

      if (conversation) {
        messages = (conversation.messages as unknown as AIMessage[]) || [];
      }
    }

    // Add user message
    messages.push({ role: "user", content: message });

    // Determine system prompt
    let systemPrompt = AI_PROMPTS.dailyPlanning; // Default

    if (promptType && AI_PROMPTS[promptType]) {
      systemPrompt = AI_PROMPTS[promptType];
    }

    // Add context if provided
    if (context) {
      systemPrompt += `\n\nAdditional context: ${context}`;
    }

    // Get character info for personalization
    const character = await db.character.findUnique({
      where: { userId },
    });

    if (character) {
      systemPrompt += `\n\nUser's character info:
- Name: ${character.name}
- Class: ${character.class}
- Level: ${character.level}
- Current HP: ${character.hp}/${character.maxHp}
- Current Energy: ${character.energy}/${character.maxEnergy}
- Streak: ${character.currentStreak} days
- Total tasks completed: ${character.tasksCompleted}`;
    }

    // Call AI
    const aiResponse = await askAI(messages, {
      systemPrompt,
      preferredProvider: "huggingface",
      fallbackEnabled: true,
    });

    // Add assistant response to messages
    messages.push({ role: "assistant", content: aiResponse.content });

    // Save conversation
    if (conversation) {
      await db.aIConversation.update({
        where: { id: conversation.id },
        data: {
          messages: messages as object[],
          updatedAt: new Date(),
        },
      });
    } else {
      conversation = await db.aIConversation.create({
        data: {
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
          context: promptType || "general",
          messages: messages as object[],
        },
      });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      response: aiResponse.content,
      provider: aiResponse.provider,
      model: aiResponse.model,
      usage: aiResponse.usage,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}

// GET /api/ai/chat - Get conversation history
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo-user";
    const { searchParams } = new URL(request.url);
    
    const conversationId = searchParams.get("conversationId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (conversationId) {
      const conversation = await db.aIConversation.findFirst({
        where: { id: conversationId, userId },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(conversation);
    }

    // List recent conversations
    const conversations = await db.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        context: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
