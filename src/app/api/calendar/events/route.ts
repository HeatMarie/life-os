import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  fetchCalendarEvents,
  refreshGoogleToken,
  convertGoogleEvent,
  listCalendars,
} from "@/lib/google/calendar";

// GET /api/calendar/events - Fetch calendar events from Google (all calendars)
export async function GET(request: NextRequest) {
  try {
    // Get user - in production, this would come from auth
    const user = await db.user.findFirst();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
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

    // Check if token is expired and refresh if needed
    if (
      calendarSync.tokenExpiresAt &&
      calendarSync.tokenExpiresAt < new Date() &&
      calendarSync.refreshToken
    ) {
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
        return NextResponse.json(
          { error: "Token expired. Please reconnect Google Calendar." },
          { status: 401 }
        );
      }
    }

    // Get timezone from request (defaults to UTC)
    const timeZone = searchParams.get("timeZone") || "UTC";

    // Parse dates - the frontend sends local ISO strings with timezone offset
    const timeMin = timeMinStr ? new Date(timeMinStr) : new Date();
    const timeMax = timeMaxStr
      ? new Date(timeMaxStr)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    // Get all calendars
    const calendars = await listCalendars(accessToken);
    
    // Fetch events from all calendars
    const allEvents: ReturnType<typeof convertGoogleEvent>[] = [];
    
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
        // Skip calendars we can't access (e.g., holiday calendars)
        console.log(`Skipping calendar ${calendar.id}:`, err);
      }
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
