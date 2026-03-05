import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  fetchCalendarEvents,
  refreshGoogleToken,
  convertGoogleEvent,
  listCalendars,
} from "@/lib/google/calendar";
import { classifyEvent, calculateEventXP } from "@/lib/game/event-classifier";

// GET /api/calendar/events - Fetch calendar events from Google (all calendars)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const timeMinStr = searchParams.get("timeMin");
    const timeMaxStr = searchParams.get("timeMax");

    // Get calendar sync record
    const calendarSync = await db.calendarSync.findFirst({
      where: {
        userId: user.id,
        provider: "GOOGLE",
        isActive: true,
      },
    });

    if (!calendarSync) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 401 }
      );
    }

    let accessToken = calendarSync.accessToken;

    // Always refresh the token if we have a refresh token — access tokens
    // can be invalidated by Google even before the stored expiry (e.g. after
    // the Supabase project was paused/restored).
    if (calendarSync.refreshToken) {
      try {
        const newTokens = await refreshGoogleToken(calendarSync.refreshToken);

        accessToken = newTokens.access_token!;

        // Update stored tokens
        await db.calendarSync.update({
          where: { id: calendarSync.id },
          data: {
            accessToken: newTokens.access_token!,
            tokenExpiresAt: newTokens.expiry_date
              ? new Date(newTokens.expiry_date)
              : null,
          },
        });
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        // Token refresh failed — mark sync as inactive so status shows disconnected
        await db.calendarSync.update({
          where: { id: calendarSync.id },
          data: { isActive: false },
        });
        return NextResponse.json(
          { error: "Google token expired. Please reconnect Google Calendar." },
          { status: 401 }
        );
      }
    } else if (
      calendarSync.tokenExpiresAt &&
      calendarSync.tokenExpiresAt < new Date()
    ) {
      // No refresh token and the access token is expired — nothing we can do
      await db.calendarSync.update({
        where: { id: calendarSync.id },
        data: { isActive: false },
      });
      return NextResponse.json(
        { error: "Token expired and no refresh token available. Please reconnect Google Calendar." },
        { status: 401 }
      );
    }

    // Get timezone from request (defaults to UTC)
    const timeZone = searchParams.get("timeZone") || "UTC";

    // Parse dates - the frontend sends local ISO strings with timezone offset
    const timeMin = timeMinStr ? new Date(timeMinStr) : new Date();
    const timeMax = timeMaxStr
      ? new Date(timeMaxStr)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    // Get all calendars
    let calendars;
    try {
      calendars = await listCalendars(accessToken);
    } catch (listError) {
      console.error("Failed to list calendars:", listError);
      return NextResponse.json(
        { error: "Failed to list Google calendars. Your token may be invalid — try reconnecting." },
        { status: 502 }
      );
    }
    
    // Fetch events from all calendars
    const allEvents: ReturnType<typeof convertGoogleEvent>[] = [];
    const calendarErrors: string[] = [];
    
    for (const calendar of calendars) {
      if (!calendar.id) continue;
      
      try {
        const events = await fetchCalendarEvents(
          accessToken,
          calendar.id,
          timeMin,
          timeMax,
          timeZone
        );
        
        // Add calendar info to each event
        const formattedEvents = events.map((event) => ({
          ...convertGoogleEvent(event),
          calendarId: calendar.id,
          calendarName: calendar.summary || "Unknown Calendar",
          calendarColor: calendar.backgroundColor,
        }));
        
        allEvents.push(...formattedEvents);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`Skipping calendar ${calendar.id}:`, errMsg);
        calendarErrors.push(`${calendar.summary || calendar.id}: ${errMsg}`);
      }
    }

    // If ALL calendars failed, surface the error
    if (allEvents.length === 0 && calendarErrors.length > 0) {
      console.error("All calendar fetches failed:", calendarErrors);
      return NextResponse.json(
        { 
          error: "Failed to fetch events from any calendar. Try reconnecting Google Calendar.",
          details: calendarErrors,
        },
        { status: 502 }
      );
    }

    // Sort by start time
    allEvents.sort((a, b) => {
      const aStart = new Date(a.start).getTime();
      const bStart = new Date(b.start).getTime();
      return aStart - bStart;
    });

    return NextResponse.json({
      events: allEvents,
      calendars: calendars.map((c) => ({
        id: c.id,
        name: c.summary,
        color: c.backgroundColor,
        primary: c.primary,
      })),
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}

// Helper to get valid access token (with refresh if needed)
async function getValidAccessToken(calendarSync: {
  id: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
}) {
  let accessToken = calendarSync.accessToken;

  if (
    calendarSync.tokenExpiresAt &&
    calendarSync.tokenExpiresAt < new Date() &&
    calendarSync.refreshToken
  ) {
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
  }

  return accessToken;
}

// POST /api/calendar/events - Sync Google Calendar events to local DB and create tasks
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      timeMin, 
      timeMax, 
      calendarIds, // Optional: specific calendars to sync
      createTasks = true, // Whether to create tasks for ACTION_ITEM events
    } = body;

    // Get calendar sync record
    const calendarSync = await db.calendarSync.findFirst({
      where: {
        userId: user.id,
        provider: "GOOGLE",
        isActive: true,
      },
    });

    if (!calendarSync || !calendarSync.refreshToken) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 401 }
      );
    }

    const accessToken = await getValidAccessToken(calendarSync);

    // Get default area for events (WORK by default)
    const defaultArea = await db.area.findFirst({
      where: { type: "WORK" },
    });

    if (!defaultArea) {
      return NextResponse.json(
        { error: "No areas configured. Please run database seed." },
        { status: 500 }
      );
    }

    // Get all calendars or use specified ones
    const calendars = await listCalendars(accessToken);
    const syncCalendars = calendarIds 
      ? calendars.filter(c => calendarIds.includes(c.id))
      : calendars;

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const syncTimeMin = timeMin ? new Date(timeMin) : new Date();
    const syncTimeMax = timeMax 
      ? new Date(timeMax) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    const results = {
      eventsImported: 0,
      eventsUpdated: 0,
      eventsSkipped: 0,
      tasksCreated: 0,
      errors: [] as string[],
    };

    // Process each calendar
    for (const calendar of syncCalendars) {
      if (!calendar.id) continue;

      try {
        const googleEvents = await fetchCalendarEvents(
          accessToken,
          calendar.id,
          syncTimeMin,
          syncTimeMax,
          timeZone
        );

        for (const gEvent of googleEvents) {
          try {
            const converted = convertGoogleEvent(gEvent);
            
            // Skip events without a valid ID or title
            if (!converted.googleEventId || !converted.title) {
              results.eventsSkipped++;
              continue;
            }

            // Check if event already exists in our database
            const existingEvent = await db.event.findFirst({
              where: { googleEventId: converted.googleEventId },
              include: { project: true },
            });

            if (existingEvent) {
              // Update existing event if it has changed
              const needsUpdate = 
                existingEvent.title !== converted.title ||
                existingEvent.description !== converted.description ||
                existingEvent.startsAt.toISOString() !== new Date(converted.start).toISOString() ||
                existingEvent.endsAt.toISOString() !== new Date(converted.end).toISOString();

              if (needsUpdate) {
                await db.event.update({
                  where: { id: existingEvent.id },
                  data: {
                    title: converted.title,
                    description: converted.description || null,
                    startsAt: new Date(converted.start),
                    endsAt: new Date(converted.end),
                    allDay: converted.allDay,
                    location: converted.location || null,
                    lastSyncedAt: new Date(),
                  },
                });
                results.eventsUpdated++;
              } else {
                results.eventsSkipped++;
              }
              continue;
            }

            // Classify the event
            const classification = classifyEvent(
              converted.title,
              converted.description || undefined
            );

            // Calculate event duration and XP for action items
            const startTime = new Date(converted.start).getTime();
            const endTime = new Date(converted.end).getTime();
            const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
            
            const xpReward = calculateEventXP(durationMinutes, classification.eventType);

            // Create the event in our database
            const newEvent = await db.event.create({
              data: {
                userId: user.id,
                areaId: defaultArea.id,
                title: converted.title,
                description: converted.description || null,
                location: converted.location || null,
                startsAt: new Date(converted.start),
                endsAt: new Date(converted.end),
                allDay: converted.allDay,
                eventType: classification.eventType,
                status: "SCHEDULED",
                googleEventId: converted.googleEventId,
                googleCalendarId: calendar.id,
                lastSyncedAt: new Date(),
              },
            });

            results.eventsImported++;

            // Create a linked task for ACTION_ITEM events
            if (createTasks && classification.eventType === "ACTION_ITEM") {
              // Check if a task with this googleEventId already exists
              const existingTask = await db.task.findUnique({
                where: { googleEventId: converted.googleEventId },
              });

              if (!existingTask) {
                // Get the default bucket (To Do)
                const defaultBucket = await db.taskBucket.findFirst({
                  where: { userId: user.id, name: "To Do" },
                });

                await db.task.create({
                  data: {
                    userId: user.id,
                    areaId: defaultArea.id,
                    bucketId: defaultBucket?.id,
                    title: converted.title,
                    description: `Calendar event: ${converted.title}${converted.description ? `\n\n${converted.description}` : ""}`,
                    status: "TODO",
                    priority: "MEDIUM",
                    xpReward: xpReward,
                    energyCost: 15,
                    startsAt: new Date(converted.start),
                    dueDate: new Date(converted.end),
                    googleEventId: converted.googleEventId,
                  },
                });
                results.tasksCreated++;
              }
            }
          } catch (eventError) {
            console.error(`Error processing event:`, eventError);
            results.errors.push(`Failed to process event: ${gEvent.summary || "Unknown"}`);
          }
        }
      } catch (calendarError) {
        console.error(`Error syncing calendar ${calendar.id}:`, calendarError);
        results.errors.push(`Failed to sync calendar: ${calendar.summary || calendar.id}`);
      }
    }

    // Update last sync time
    await db.calendarSync.update({
      where: { id: calendarSync.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      ...results,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error syncing calendar events:", error);
    return NextResponse.json(
      { error: "Failed to sync calendar events" },
      { status: 500 }
    );
  }
}
