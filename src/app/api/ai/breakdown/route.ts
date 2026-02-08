import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { askAI, AI_PROMPTS } from "@/lib/ai/client";

// POST /api/ai/breakdown - Break down a task into subtasks
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo-user";
    const body = await request.json();

    const { taskId, taskTitle, taskDescription } = body;

    if (!taskTitle && !taskId) {
      return NextResponse.json(
        { error: "Task title or ID is required" },
        { status: 400 }
      );
    }

    let title = taskTitle;
    let description = taskDescription;

    // If taskId provided, fetch the task
    if (taskId) {
      const task = await db.task.findFirst({
        where: { id: taskId, userId },
      });

      if (!task) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      title = task.title;
      description = task.description;
    }

    const prompt = `Please break down this task into smaller, actionable subtasks:

Task: ${title}
${description ? `Description: ${description}` : ""}

Requirements:
1. Each subtask should be completable in 15-60 minutes
2. Subtasks should be specific and actionable
3. Order them logically
4. Aim for 3-7 subtasks depending on complexity

Format your response as a numbered list.`;

    const response = await askAI(
      [{ role: "user", content: prompt }],
      {
        systemPrompt: AI_PROMPTS.taskBreakdown,
        preferredProvider: "huggingface",
        fallbackEnabled: true,
      }
    );

    // Parse subtasks from response
    const lines = response.content.split("\n");
    const subtasks = lines
      .filter((line) => /^\d+[\.\)]\s/.test(line.trim()))
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line) => line.length > 0);

    return NextResponse.json({
      subtasks,
      rawResponse: response.content,
      provider: response.provider,
      model: response.model,
    });
  } catch (error) {
    console.error("Error breaking down task:", error);
    return NextResponse.json(
      { error: "Failed to break down task" },
      { status: 500 }
    );
  }
}
