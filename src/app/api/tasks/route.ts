import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  calculateXPReward,
  getEnergyCost,
  getBossHPIncrease,
} from "@/lib/game/mechanics";

// GET /api/tasks - List all tasks
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status");
    const areaId = searchParams.get("areaId");
    const priority = searchParams.get("priority");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = { userId: user.id };
    
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
        bucket: true,
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
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();

    // Calculate XP and energy based on priority
    const priority = body.priority || "MEDIUM";
    const xpReward = calculateXPReward(priority, 1);
    const energyCost = getEnergyCost(priority);

    // If projectId is provided, check if project has a boss and increase HP
    let bossHPIncreased = 0;
    if (body.projectId) {
      const project = await db.project.findUnique({
        where: { id: body.projectId },
        include: { boss: true },
      });

      if (project?.boss && project.boss.status === "ACTIVE") {
        bossHPIncreased = getBossHPIncrease(priority);
        await db.boss.update({
          where: { id: project.boss.id },
          data: {
            hp: project.boss.hp + bossHPIncreased,
            maxHp: project.boss.maxHp + bossHPIncreased,
          },
        });
      }
    }

    const task = await db.task.create({
      data: {
        userId: user.id,
        title: body.title,
        description: body.description,
        priority,
        type: body.type || "OTHER",
        status: "TODO",
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        areaId: body.areaId,
        projectId: body.projectId,
        bucketId: body.bucketId,
        googleEventId: body.googleEventId,
        xpReward,
        energyCost,
      },
      include: {
        area: true,
        project: {
          include: { boss: true },
        },
        bucket: true,
      },
    });

    return NextResponse.json({
      ...task,
      bossHPIncreased,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
