import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/calendar/status - Check if Google Calendar is connected
export async function GET() {
  try {
    // Get user - in production, this would come from auth
    const user = await db.user.findFirst();
    
    if (!user) {
      return NextResponse.json({ connected: false });
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
