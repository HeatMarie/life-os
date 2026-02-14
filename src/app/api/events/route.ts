import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classifyEvent } from "@/lib/game/event-classifier";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  createCalendarEvent,
  refreshGoogleToken,
} from "@/lib/google/calendar";

// Helper to get valid Google access token
async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const calendarSync = await db.calendarSync.findFirst({
    where: {
      userId,
      provider: "GOOGLE",
      isActive: true,
    },
  });

  if (!calendarSync) return null;

  let accessToken = calendarSync.accessToken;

  // Check if token needs refresh
  if (
    calendarSync.tokenExpiresAt &&
    calendarSync.tokenExpiresAt < new Date() &&
    calendarSync.refreshToken
  ) {
    try {
      const newTokens = await refreshGoogleToken(calendarSync.refreshToken);
      accessToken = newTokens.access_token!;

      await db.calendarSync.update({
        where: { id: calendarSync.id },
        data: {
          accessToken: newTokens.access_token!,
          tokenExpiresAt: newTokens.expiry_date
            ? new Date(newTokens.expiry_date)
            : null,
        },
      });
    } catch {
      return null;
    }
  }

  return accessToken;
}

// GET /api/events - List all events
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId: user.id };
    
    // Filter by status if provided
    if (status) {
      where.status = status;
    }
    
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
        project: true,
        storyEntries: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
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

// POST /api/events - Create a new event (and optionally sync to Google)
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
    const { 
      createTask, 
      xpReward, 
      syncToGoogle = true,
      eventType: overrideEventType,
      projectId,
      ...eventData 
    } = body;

    // Auto-classify event type if not overridden
    const classification = classifyEvent(eventData.title, eventData.description);
    const eventType = overrideEventType || classification.eventType;

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
        eventType,
        status: "SCHEDULED",
        projectId: projectId || null,
      },
      include: {
        area: true,
        project: true,
      },
    });

    // Sync to Google Calendar if enabled
    let googleEventId: string | null = null;
    if (syncToGoogle) {
      const accessToken = await getGoogleAccessToken(user.id);
      if (accessToken) {
        try {
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const startDate = new Date(eventData.startsAt).toISOString().split("T")[0];
          const endDate = new Date(eventData.endsAt).toISOString().split("T")[0];
          const googleEvent = await createCalendarEvent(accessToken, "primary", {
            summary: eventData.title,
            description: eventData.description || undefined,
            start: eventData.allDay 
              ? { date: startDate }
              : { dateTime: new Date(eventData.startsAt).toISOString(), timeZone },
            end: eventData.allDay
              ? { date: endDate }
              : { dateTime: new Date(eventData.endsAt).toISOString(), timeZone },
          });

          googleEventId = googleEvent.id || null;

          // Update event with Google ID
          if (googleEventId) {
            await db.event.update({
              where: { id: event.id },
              data: {
                googleEventId,
                googleCalendarId: "primary",
                lastSyncedAt: new Date(),
              },
            });
          }
        } catch (syncError) {
          console.error("Failed to sync event to Google Calendar:", syncError);
          // Don't fail the request - event is still created locally
        }
      }
    }

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
          projectId: projectId || null,
        },
      });
    }

    return NextResponse.json({ 
      event: { ...event, googleEventId },
      task,
      classification,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
