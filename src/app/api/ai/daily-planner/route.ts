import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { executeSkill } from "@/lib/ai/skills";
import type { DailyPlannerInput } from "@/lib/ai/types";

/**
 * POST /api/ai/daily-planner
 *
 * Analyzes user's daily workload and creates optimized schedule
 * with energy management and burnout detection.
 *
 * Body: { date?: string }
 * Returns: { energyAnalysis, burnoutRisk, schedule, warnings, recommendations }
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
    const targetDate = body.date ? new Date(body.date) : new Date();

    // Start and end of the target day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch user's character data
    const character = await db.character.findUnique({
      where: { userId: user.id },
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found. Please complete character creation." },
        { status: 404 }
      );
    }

    // Fetch tasks for the day (TODO and IN_PROGRESS)
    const tasks = await db.task.findMany({
      where: {
        userId: user.id,
        status: {
          in: ["TODO", "IN_PROGRESS"],
        },
        OR: [
          {
            startsAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          {
            dueDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          {
            // Also include tasks with no date (backlog)
            AND: [
              { startsAt: null },
              { dueDate: null },
            ],
          },
        ],
      },
      include: {
        area: true,
        project: true,
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
      ],
      take: 50, // Limit to first 50 tasks
    });

    // Fetch calendar events for the day
    const events = await db.event.findMany({
      where: {
        userId: user.id,
        startsAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });

    // Fetch recent health logs (last 7 days)
    const sevenDaysAgo = new Date(targetDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const healthLogs = await db.healthLog.findMany({
      where: {
        userId: user.id,
        loggedAt: {
          gte: sevenDaysAgo,
          lte: targetDate,
        },
      },
      orderBy: {
        loggedAt: "desc",
      },
      take: 20,
    });

    // Prepare input for daily planner skill
    const plannerInput: DailyPlannerInput = {
      userId: user.id,
      date: targetDate,
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        energyCost: t.energyCost,
        dueDate: t.dueDate,
        area: t.area?.displayName,
      })),
      events: events.map((e) => ({
        title: e.title,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        allDay: e.allDay,
      })),
      character: {
        name: character.name,
        class: character.class,
        level: character.level,
        xp: character.xp,
        hp: character.hp,
        maxHp: character.maxHp,
        energy: character.energy,
        maxEnergy: character.maxEnergy,
        currentStreak: character.currentStreak,
      },
      healthData: healthLogs.map((h) => ({
        type: h.type,
        value: h.value,
        unit: h.unit,
        loggedAt: h.loggedAt,
      })),
    };

    // Execute daily planner skill
    const result = await executeSkill("daily-planner", plannerInput, {
      userId: user.id,
      skillName: "daily-planner",
      cacheEnabled: true,
      cacheDuration: 3600, // 1 hour cache
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Failed to generate daily plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...result.data,
      meta: {
        taskCount: tasks.length,
        eventCount: events.length,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in daily planner API:", error);
    return NextResponse.json(
      { error: "Failed to generate daily plan" },
      { status: 500 }
    );
  }
}
