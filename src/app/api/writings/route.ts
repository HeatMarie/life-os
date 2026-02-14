import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const writings = await db.writingPiece.findMany({
      where: { userId: user.id },
      include: {
        area: true,
        project: true,
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(writings);
  } catch (error) {
    console.error("Error fetching writings:", error);
    return NextResponse.json(
      { error: "Failed to fetch writings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, areaId, projectId, targetWords } = body;

    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const writing = await db.writingPiece.create({
      data: {
        title,
        type,
        areaId,
        projectId,
        targetWords: targetWords || 0,
        userId: user.id,
      },
      include: {
        area: true,
        project: true,
      },
    });

    return NextResponse.json(writing);
  } catch (error) {
    console.error("Error creating writing:", error);
    return NextResponse.json(
      { error: "Failed to create writing" },
      { status: 500 }
    );
  }
}
