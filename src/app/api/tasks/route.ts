import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  calculateXPReward,
  getEnergyCost,
} from "@/lib/game/mechanics";

// GET /api/tasks - List all tasks
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo-user";
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status");
    const areaId = searchParams.get("areaId");
    const priority = searchParams.get("priority");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = { userId };
    
    if (status) where.status = status;
    if (areaId) where.areaId = areaId;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;

    const tasks = await db.task.findMany({
      where,
      include: {
        area: true,
        project: {
          include: { boss: true }
        },
        tags: {
          include: { tag: true }
        },
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo-user";
    const body = await request.json();

    // Calculate XP and energy based on priority
    const xpReward = calculateXPReward(body.priority || "MEDIUM", 1);
    const energyCost = getEnergyCost(body.priority || "MEDIUM");

    const task = await db.task.create({
      data: {
        userId,
        title: body.title,
        description: body.description,
        priority: body.priority || "MEDIUM",
        status: "TODO",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        areaId: body.areaId,
        projectId: body.projectId,
        xpReward,
        energyCost,
      },
      include: {
        area: true,
        project: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
