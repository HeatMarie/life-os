import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateEventStory } from "@/lib/ai/client";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// GET /api/story - Get story entries (Life Chronicle)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const entryType = searchParams.get("entryType");

    const where: Record<string, unknown> = { userId: user.id };

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // Filter by entry type
    if (entryType) {
      where.entryType = entryType;
    }

    const [entries, total] = await Promise.all([
      db.storyEntry.findMany({
        where,
        include: {
          event: {
            include: {
              area: true,
              project: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.storyEntry.count({ where }),
    ]);

    return NextResponse.json({
      entries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + entries.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching story entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch story entries" },
      { status: 500 }
    );
  }
}

// POST /api/story - Generate and save AI story entry for an event
export async function POST(request: NextRequest) {
  try {
    const user = await db.user.findFirst();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { eventId, entryType, forceRegenerate = false } = body;

    // Get event if eventId provided
    let event = null;
    if (eventId) {
      event = await db.event.findUnique({
        where: { id: eventId },
        include: {
          project: {
            include: { boss: true },
          },
        },
      });

      if (!event) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      // Check if story already exists (unless forcing regeneration)
      if (!forceRegenerate) {
        const existingStory = await db.storyEntry.findFirst({
          where: { eventId },
          orderBy: { createdAt: "desc" },
        });

        if (existingStory) {
          return NextResponse.json({
            entry: existingStory,
            regenerated: false,
          });
        }
      }
    }

    // Get character for context
    const character = await db.character.findUnique({
      where: { userId: user.id },
    });

    // Determine story type
    const storyType = entryType || 
      (event?.status === "COMPLETED" ? "completed" :
       event?.status === "MISSED" ? "missed" :
       event?.status === "CANCELED_BY_SELF" ? "canceled" :
       event?.status === "CANCELED_BY_OTHER" || event?.status === "RESCHEDULED" ? "rescheduled" :
       "completed");

    // Generate AI story
    const narrative = await generateEventStory(
      event?.title || body.title || "Unknown Event",
      storyType,
      {
        xpEarned: event?.xpEarned || body.xpEarned,
        hpChange: event?.hpPenalty ? -event.hpPenalty : body.hpChange,
        bossDamage: event?.bossDamage || body.bossDamage,
        bossName: event?.project?.boss?.name || body.bossName,
        characterName: character?.name,
      }
    );

    // Determine entry type enum value
    const entryTypeEnum = storyType === "completed" ? "EVENT_COMPLETED" :
                          storyType === "missed" ? "EVENT_MISSED" :
                          storyType === "canceled" ? "EVENT_CANCELED" :
                          storyType === "rescheduled" ? "EVENT_RESCHEDULED" :
                          storyType === "bossDefeated" ? "BOSS_DEFEATED" :
                          storyType === "levelUp" ? "LEVEL_UP" :
                          "EVENT_COMPLETED";

    // Create story entry
    const storyEntry = await db.storyEntry.create({
      data: {
        userId: user.id,
        entryType: entryTypeEnum as any,
        title: body.title || event?.title || "Chronicle Entry",
        narrative,
        eventId: event?.id,
        xpEarned: event?.xpEarned || body.xpEarned,
        hpChange: event?.hpPenalty ? -event.hpPenalty : body.hpChange,
        bossDamage: event?.bossDamage || body.bossDamage,
        aiGenerated: true,
      },
      include: {
        event: true,
      },
    });

    return NextResponse.json({
      entry: storyEntry,
      regenerated: forceRegenerate,
    }, { status: 201 });
  } catch (error) {
    console.error("Error generating story entry:", error);
    return NextResponse.json(
      { error: "Failed to generate story entry" },
      { status: 500 }
    );
  }
}
