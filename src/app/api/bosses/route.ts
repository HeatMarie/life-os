import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// GET /api/bosses - List all bosses
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status"); // ACTIVE, DEFEATED

    const where: Record<string, unknown> = {
      project: { userId: user.id }
    };
    if (status) where.status = status;

    const bosses = await db.boss.findMany({
      where,
      include: {
        project: true,
      },
      orderBy: [
        { status: "asc" }, // ACTIVE first
        { deadline: "asc" },
      ],
    });

    return NextResponse.json(bosses);
  } catch (error) {
    console.error("Error fetching bosses:", error);
    return NextResponse.json(
      { error: "Failed to fetch bosses" },
      { status: 500 }
    );
  }
}

// POST /api/bosses - Create a new boss (linked to a project)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();

    // Calculate boss HP based on difficulty
    const hpByDifficulty: Record<string, number> = {
      EASY: 100,
      MEDIUM: 250,
      HARD: 500,
      NIGHTMARE: 1000,
    };

    const xpByDifficulty: Record<string, number> = {
      EASY: 100,
      MEDIUM: 250,
      HARD: 500,
      NIGHTMARE: 1000,
    };

    const maxHp = hpByDifficulty[body.difficulty || "MEDIUM"] || 250;
    const xpReward = xpByDifficulty[body.difficulty || "MEDIUM"] || 250;

    const boss = await db.boss.create({
      data: {
        projectId: body.projectId,
        name: body.name,
        description: body.description,
        maxHp,
        hp: maxHp,
        xpReward,
        deadline: body.deadline ? new Date(body.deadline) : null,
        icon: body.icon || "👾",
        status: "ACTIVE",
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(boss, { status: 201 });
  } catch (error) {
    console.error("Error creating boss:", error);
    return NextResponse.json(
      { error: "Failed to create boss" },
      { status: 500 }
    );
  }
}
