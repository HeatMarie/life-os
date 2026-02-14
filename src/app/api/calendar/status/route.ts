import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// GET /api/calendar/status - Check if Google Calendar is connected
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const calendarSync = await db.calendarSync.findFirst({
      where: {
        userId: user.id,
        provider: "GOOGLE",
        isActive: true,
      },
    });

    return NextResponse.json({
      connected: !!calendarSync,
      email: calendarSync?.email || null,
    });
  } catch (error) {
    console.error("Error checking calendar status:", error);
    return NextResponse.json({ connected: false });
  }
}
