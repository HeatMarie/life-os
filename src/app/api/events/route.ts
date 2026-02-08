import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/events - List all events
export async function GET(request: NextRequest) {
  try {
    // Get user - in production, this would come from auth
    const user = await db.user.findFirst();
    
    if (!user) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const where: Record<string, unknown> = { userId: user.id };
    
    // If start/end range is provided
    if (start && end) {
      where.startsAt = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }
    // If a specific date is provided, filter events for that day
    else if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.startsAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const events = await db.event.findMany({
      where,
      include: {
        area: true,
      },
      orderBy: { startsAt: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event (and optionally a linked task)
export async function POST(request: NextRequest) {
  try {
    // Get user - in production, this would come from auth
    const user = await db.user.findFirst();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { createTask, xpReward, ...eventData } = body;

    // Create the event
    const event = await db.event.create({
      data: {
        userId: user.id,
        areaId: eventData.areaId,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        startsAt: new Date(eventData.startsAt),
        endsAt: new Date(eventData.endsAt),
        allDay: eventData.allDay || false,
      },
      include: {
        area: true,
      },
    });

    // If createTask is true, also create a linked task
    let task = null;
    if (createTask) {
      task = await db.task.create({
        data: {
          userId: user.id,
          areaId: eventData.areaId,
          title: eventData.title,
          description: eventData.description || `Event: ${eventData.title}`,
          status: "TODO",
          priority: "MEDIUM",
          xpReward: xpReward || 50,
          energyCost: 15,
          dueDate: new Date(eventData.startsAt),
        },
      });
    }

    return NextResponse.json({ event, task }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
