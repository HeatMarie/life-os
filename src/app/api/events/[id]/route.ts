import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  updateCalendarEvent,
  deleteCalendarEvent,
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

// GET /api/events/[id] - Get a single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const event = await db.event.findFirst({
      where: { id, userId: user.id },
      include: { 
        area: true,
        project: true,
        storyEntries: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if event exists
    const existing = await db.event.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = await db.event.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
        allDay: body.allDay,
        areaId: body.areaId,
        eventType: body.eventType,
        status: body.status,
        projectId: body.projectId,
      },
      include: { 
        area: true,
        project: true,
      },
    });

    // Sync update to Google Calendar if event has googleEventId
    if (existing.googleEventId) {
      const accessToken = await getGoogleAccessToken(existing.userId);
      if (accessToken) {
        try {
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          await updateCalendarEvent(
            accessToken,
            existing.googleCalendarId || "primary",
            existing.googleEventId,
            {
              summary: body.title || event.title,
              description: body.description || event.description || undefined,
              start: body.startsAt 
                ? (body.allDay || event.allDay
                    ? { date: new Date(body.startsAt).toISOString().split("T")[0] } as any
                    : { dateTime: new Date(body.startsAt).toISOString(), timeZone })
                : undefined,
              end: body.endsAt
                ? (body.allDay || event.allDay
                    ? { date: new Date(body.endsAt).toISOString().split("T")[0] } as any
                    : { dateTime: new Date(body.endsAt).toISOString(), timeZone })
                : undefined,
            }
          );

          await db.event.update({
            where: { id },
            data: { lastSyncedAt: new Date() },
          });
        } catch (syncError) {
          console.error("Failed to sync update to Google Calendar:", syncError);
          // Don't fail - local update succeeded
        }
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if event exists
    const existing = await db.event.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Delete from Google Calendar first if synced
    if (existing.googleEventId) {
      const accessToken = await getGoogleAccessToken(existing.userId);
      if (accessToken) {
        try {
          await deleteCalendarEvent(
            accessToken,
            existing.googleCalendarId || "primary",
            existing.googleEventId
          );
        } catch (syncError) {
          console.error("Failed to delete from Google Calendar:", syncError);
          // Continue with local delete
        }
      }
    }

    await db.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
