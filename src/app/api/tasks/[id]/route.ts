import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  calculateXPReward,
  getEnergyCost,
} from "@/lib/game/mechanics";

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id") || "demo-user";

    const task = await db.task.findFirst({
      where: { id, userId },
      include: {
        area: true,
        project: {
          include: { boss: true }
        },
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

    // If priority changed, recalculate XP/energy
    let xpReward, energyCost;
    if (body.priority) {
      xpReward = calculateXPReward(body.priority, 1);
      energyCost = getEnergyCost(body.priority);
    }

    const task = await db.task.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        priority: body.priority,
        status: body.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        areaId: body.areaId,
        projectId: body.projectId,
        ...(xpReward && { xpReward }),
        ...(energyCost && { energyCost }),
      },
      include: {
        area: true,
        project: true,
      },
    });

    return NextResponse.json(task);
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

    await db.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
