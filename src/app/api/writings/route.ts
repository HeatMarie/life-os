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

    // Get user - in production, this would come from auth
    const user = await db.user.findFirst();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
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
