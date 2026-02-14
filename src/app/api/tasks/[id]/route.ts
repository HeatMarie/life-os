import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  calculateXPReward,
  getEnergyCost,
  getBossHPIncrease,
} from "@/lib/game/mechanics";

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const task = await db.task.findFirst({
      where: { id, userId },
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
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get current task to check for project changes
    const currentTask = await db.task.findUnique({
      where: { id },
      include: {
        project: { include: { boss: true } },
      },
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const priority = body.priority || currentTask.priority;

    // If priority changed, recalculate XP/energy
    let xpReward, energyCost;
    if (body.priority) {
      xpReward = calculateXPReward(body.priority, 1);
      energyCost = getEnergyCost(body.priority);
    }

    // Handle project change - adjust boss HP
    let bossHPChanged = 0;
    const newProjectId = body.projectId;
    const oldProjectId = currentTask.projectId;

    // If project is changing
    if (newProjectId !== undefined && newProjectId !== oldProjectId) {
      const hpAmount = getBossHPIncrease(priority);

      // Remove HP from old project's boss (if any)
      if (oldProjectId && currentTask.project?.boss?.status === "ACTIVE") {
        const oldBoss = currentTask.project.boss;
        await db.boss.update({
          where: { id: oldBoss.id },
          data: {
            hp: Math.max(0, oldBoss.hp - hpAmount),
            maxHp: Math.max(1, oldBoss.maxHp - hpAmount),
          },
        });
        bossHPChanged -= hpAmount;
      }

      // Add HP to new project's boss (if any)
      if (newProjectId) {
        const newProject = await db.project.findUnique({
          where: { id: newProjectId },
          include: { boss: true },
        });

        if (newProject?.boss?.status === "ACTIVE") {
          await db.boss.update({
            where: { id: newProject.boss.id },
            data: {
              hp: newProject.boss.hp + hpAmount,
              maxHp: newProject.boss.maxHp + hpAmount,
            },
          });
          bossHPChanged += hpAmount;
        }
      }
    }

    const task = await db.task.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.startsAt !== undefined && { 
          startsAt: body.startsAt ? new Date(body.startsAt) : null 
        }),
        ...(body.dueDate !== undefined && { 
          dueDate: body.dueDate ? new Date(body.dueDate) : null 
        }),
        ...(body.areaId !== undefined && { areaId: body.areaId }),
        ...(body.projectId !== undefined && { projectId: body.projectId }),
        ...(body.bucketId !== undefined && { bucketId: body.bucketId }),
        ...(xpReward && { xpReward }),
        ...(energyCost && { energyCost }),
      },
      include: {
        area: true,
        project: { include: { boss: true } },
        bucket: true,
      },
    });

    return NextResponse.json({
      ...task,
      bossHPChanged,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the task to check if it has a project with a boss
    const task = await db.task.findUnique({
      where: { id },
      include: {
        project: { include: { boss: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If task is linked to a project with an active boss, decrease boss HP
    let bossHPDecreased = 0;
    if (task.project?.boss?.status === "ACTIVE" && task.status !== "DONE") {
      const hpAmount = getBossHPIncrease(task.priority);
      const boss = task.project.boss;

      await db.boss.update({
        where: { id: boss.id },
        data: {
          hp: Math.max(0, boss.hp - hpAmount),
          maxHp: Math.max(1, boss.maxHp - hpAmount),
        },
      });
      bossHPDecreased = hpAmount;
    }

    await db.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, bossHPDecreased });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
