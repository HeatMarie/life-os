import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Health log types (from Prisma schema)
type HealthLogType = "WORKOUT" | "STEPS" | "SLEEP" | "WATER" | "CALORIES" | "ACTIVE_MINUTES" | "HEART_RATE" | "WEIGHT" | "MOOD";

// Type for aggregated stats
interface TodayStats {
  steps: number;
  activeMinutes: number;
  sleepHours: number;
  workouts: Array<{
    id: string;
    type: string;
    value: number | null;
    notes: string | null;
  }>;
  waterOz: number;
  calories: number;
}

// GET /api/health - Get health stats for the user
export async function GET(request: NextRequest) {
  try {
    const user = await db.user.findFirst();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const date = dateStr ? new Date(dateStr) : new Date();
    
    // Get start and end of day in local time
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get health sync record
    const healthSync = await db.healthSync.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    // Get health logs for the day
    // Using $queryRaw because the Prisma client may need a Next.js restart to pick up new models
    const logs = await db.$queryRaw<Array<{
      id: string;
      type: string;
      value: number | null;
      unit: string | null;
      notes: string | null;
      source: string;
      loggedAt: Date;
    }>>`
      SELECT id, type, value, unit, notes, source, "loggedAt"
      FROM health_logs
      WHERE "userId" = ${user.id}
        AND "loggedAt" >= ${startOfDay}
        AND "loggedAt" <= ${endOfDay}
      ORDER BY "loggedAt" DESC
    `;

    // Map to camelCase
    const mappedLogs = logs.map(log => ({
      id: log.id,
      type: log.type as HealthLogType,
      value: log.value,
      unit: log.unit,
      notes: log.notes,
      source: log.source,
      loggedAt: log.loggedAt,
    }));

    // Aggregate today's stats
    const todayStats = mappedLogs.reduce<TodayStats>(
      (acc, log) => {
        if (log.type === "STEPS") acc.steps += log.value || 0;
        if (log.type === "ACTIVE_MINUTES") acc.activeMinutes += log.value || 0;
        if (log.type === "SLEEP") acc.sleepHours += log.value || 0;
        if (log.type === "WORKOUT") acc.workouts.push(log);
        if (log.type === "WATER") acc.waterOz += log.value || 0;
        if (log.type === "CALORIES") acc.calories += log.value || 0;
        return acc;
      },
      {
        steps: 0,
        activeMinutes: 0,
        sleepHours: 0,
        workouts: [],
        waterOz: 0,
        calories: 0,
      }
    );

    return NextResponse.json({
      sync: healthSync,
      today: todayStats,
      logs: mappedLogs,
    });
  } catch (error) {
    console.error("Error fetching health data:", error);
    return NextResponse.json(
      { error: "Failed to fetch health data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/health - Log health data (manual entry or iOS Shortcuts)
export async function POST(request: NextRequest) {
  try {
    const user = await db.user.findFirst();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      type,
      value,
      unit,
      notes,
      source = "MANUAL",
      loggedAt,
      // For iOS Shortcuts bulk sync
      entries,
    } = body;

    // Handle bulk entries (from iOS Shortcuts)
    if (entries && Array.isArray(entries)) {
      let insertCount = 0;
      for (const entry of entries) {
        const entryType = entry.type as HealthLogType;
        const entryValue = entry.value || 0;
        const entryUnit = entry.unit || null;
        const entryNotes = entry.notes || null;
        const entryLoggedAt = entry.loggedAt ? new Date(entry.loggedAt) : new Date();
        
        await db.$executeRaw`
          INSERT INTO health_logs (id, "userId", type, value, unit, notes, source, "loggedAt", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${user.id}, ${entryType}::"HealthLogType", ${entryValue}, ${entryUnit}, ${entryNotes}, ${source}::"HealthSource", ${entryLoggedAt}, NOW(), NOW())
        `;
        insertCount++;
      }
      
      return NextResponse.json({ 
        success: true, 
        count: insertCount 
      }, { status: 201 });
    }

    // Single entry
    if (!type) {
      return NextResponse.json(
        { error: "Type is required" },
        { status: 400 }
      );
    }

    const loggedAtDate = loggedAt ? new Date(loggedAt) : new Date();
    const unitValue = unit || null;
    const notesValue = notes || null;
    const valueNum = value || 0;
    
    // Insert single entry using raw SQL
    const insertedLogs = await db.$queryRaw<Array<{id: string}>>`
      INSERT INTO health_logs (id, "userId", type, value, unit, notes, source, "loggedAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${user.id}, ${type}::"HealthLogType", ${valueNum}, ${unitValue}, ${notesValue}, ${source}::"HealthSource", ${loggedAtDate}, NOW(), NOW())
      RETURNING id
    `;
    
    const insertedId = insertedLogs[0]?.id;

    // Award XP for health activities
    let xpAwarded = 0;
    const xpRewards: Record<string, number> = {
      WORKOUT: 100,
      STEPS: 25,      // For hitting step goal
      SLEEP: 50,      // For 7+ hours
      WATER: 10,      // Per 8oz
      ACTIVE_MINUTES: 30,
    };

    if (type === "WORKOUT" || (type === "SLEEP" && value >= 7) || type === "ACTIVE_MINUTES") {
      xpAwarded = xpRewards[type] || 0;
      
      // Update character XP
      const character = await db.character.findUnique({
        where: { userId: user.id },
      });
      
      if (character) {
        await db.character.update({
          where: { id: character.id },
          data: { xp: { increment: xpAwarded } },
        });
      }
    }

    return NextResponse.json({ 
      id: insertedId,
      type,
      value: valueNum,
      xpAwarded,
      message: xpAwarded > 0 ? `+${xpAwarded} XP earned!` : undefined 
    }, { status: 201 });
  } catch (error) {
    console.error("Error logging health data:", error);
    return NextResponse.json(
      { error: "Failed to log health data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
