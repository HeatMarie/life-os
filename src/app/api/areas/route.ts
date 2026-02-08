import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/areas - List all areas (areas are system-level, not user-specific)
export async function GET() {
  try {
    const areas = await db.area.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(areas);
  } catch (error) {
    console.error("Error fetching areas:", error);
    return NextResponse.json(
      { error: "Failed to fetch areas" },
      { status: 500 }
    );
  }
}
