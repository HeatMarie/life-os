import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userAchievements = await db.userAchievement.findMany({
      where: { userId: user.id },
      include: {
        achievement: true,
      },
    });

    // Return just the achievement codes that are unlocked
    const unlockedCodes = userAchievements.map(ua => ua.achievement.code);

    return NextResponse.json(unlockedCodes);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}
