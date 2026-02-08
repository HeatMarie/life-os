import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get user - in production, this would come from auth
    const user = await db.user.findFirst();
    
    if (!user) {
      // Return empty array if no user
      return NextResponse.json([]);
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
