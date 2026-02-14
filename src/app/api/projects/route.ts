import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// GET /api/projects - List all projects for the user
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await db.project.findMany({
      where: { userId: user.id },
      include: {
        area: true,
        boss: true,
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, areaId, targetDate, createBoss, bossName } = body;

    if (!name || !areaId) {
      return NextResponse.json(
        { error: "Name and area are required" },
        { status: 400 }
      );
    }

    // Create project
    const project = await db.project.create({
      data: {
        userId: user.id,
        areaId,
        name,
        description: description || null,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: "active",
      },
      include: {
        area: true,
      },
    });

    // Optionally create a boss for this project
    if (createBoss) {
      await db.boss.create({
        data: {
          projectId: project.id,
          name: bossName || `THE ${name.toUpperCase()}`,
          hp: 100, // Base HP, will grow as tasks are added
          maxHp: 100,
          status: "ACTIVE",
          deadline: targetDate ? new Date(targetDate) : null,
          xpReward: 500,
        },
      });
    }

    // Refetch with boss
    const projectWithBoss = await db.project.findUnique({
      where: { id: project.id },
      include: {
        area: true,
        boss: true,
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(projectWithBoss, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
