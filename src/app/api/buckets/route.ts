import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// GET /api/buckets - List all task buckets for the user
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const buckets = await db.taskBucket.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(buckets);
  } catch (error) {
    console.error("Error fetching buckets:", error);
    return NextResponse.json(
      { error: "Failed to fetch buckets" },
      { status: 500 }
    );
  }
}

// POST /api/buckets - Create a new bucket
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get the highest sort order
    const lastBucket = await db.taskBucket.findFirst({
      where: { userId: user.id },
      orderBy: { sortOrder: "desc" },
    });

    const sortOrder = (lastBucket?.sortOrder ?? -1) + 1;

    const bucket = await db.taskBucket.create({
      data: {
        userId: user.id,
        name: body.name,
        color: body.color || null,
        sortOrder,
        isDefault: false, // User-created buckets are not default
      },
    });

    return NextResponse.json(bucket, { status: 201 });
  } catch (error) {
    console.error("Error creating bucket:", error);
    return NextResponse.json(
      { error: "Failed to create bucket" },
      { status: 500 }
    );
  }
}
