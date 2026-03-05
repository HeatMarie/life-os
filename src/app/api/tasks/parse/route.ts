import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { executeSkill } from "@/lib/ai/skills";
import type { TaskParseInput } from "@/lib/ai/types";

/**
 * POST /api/tasks/parse
 *
 * Parses natural language task input into structured suggestions.
 * Returns AI-powered suggestions for: title, description, priority, area, energy cost, due date.
 *
 * Body: { userInput: string }
 * Returns: { title, description, priority, areaId, suggestedEnergyCost, suggestedDueDate, confidence }
 *
 * Example inputs:
 * - "Schedule dentist appointment next Tuesday at 2pm high priority"
 * - "Write blog post about AI by end of week"
 * - "Call mom tomorrow morning"
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userInput = body.userInput;

    if (!userInput || typeof userInput !== "string" || userInput.trim().length === 0) {
      return NextResponse.json(
        { error: "userInput is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Fetch user's character data for context
    const character = await db.character.findUnique({
      where: { userId: user.id },
    });

    // Fetch recent tasks for context (last 10 tasks)
    const recentTasks = await db.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { area: true },
    });

    // Prepare input for task parser skill
    const parserInput: TaskParseInput = {
      userInput: userInput.trim(),
      context: {
        recentTasks: recentTasks.map((t) => ({
          title: t.title,
          priority: t.priority,
          areaId: t.areaId,
        })),
        currentEnergy: character?.energy || 0,
        currentDate: new Date(),
      },
    };

    // Execute task parser skill
    const result = await executeSkill("task-parser", parserInput, {
      userId: user.id,
      skillName: "task-parser",
      cacheEnabled: true,
      cacheDuration: 3600, // 1 hour cache
      maxTokens: 1000, // Conservative estimate for task parsing
    });

    if (!result.success) {
      // If AI fails, return a basic fallback response
      if (result.error?.includes("AI quota exceeded")) {
        return NextResponse.json(
          {
            error: result.error,
            rateLimitExceeded: true,
            resetAt: result.metadata?.resetAt,
          },
          { status: 429 }
        );
      }

      // Generic error fallback
      return NextResponse.json(
        { error: result.error || "Failed to parse task input" },
        { status: 500 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "No data returned from task parser" },
        { status: 500 }
      );
    }

    // Return structured suggestions
    return NextResponse.json({
      ...result.data,
      meta: {
        tokensUsed: result.metadata?.tokensUsed,
        cost: result.metadata?.cost,
        cached: result.metadata?.cached,
        provider: result.metadata?.provider,
      },
    });
  } catch (error) {
    console.error("Error in task parser API:", error);
    return NextResponse.json(
      { error: "Failed to parse task input" },
      { status: 500 }
    );
  }
}
