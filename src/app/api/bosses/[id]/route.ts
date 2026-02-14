import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// GET /api/bosses/[id] - Get a single boss
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

    const boss = await db.boss.findFirst({
      where: { id, project: { userId: user.id } },
      include: {
        project: true,
      },
    });

    if (!boss) {
      return NextResponse.json({ error: "Boss not found" }, { status: 404 });
    }

    return NextResponse.json(boss);
  } catch (error) {
    console.error("Error fetching boss:", error);
    return NextResponse.json(
      { error: "Failed to fetch boss" },
      { status: 500 }
    );
  }
}

// PUT /api/bosses/[id] - Update a boss
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const boss = await db.boss.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
        icon: body.icon,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(boss);
  } catch (error) {
    console.error("Error updating boss:", error);
    return NextResponse.json(
      { error: "Failed to update boss" },
      { status: 500 }
    );
  }
}

// DELETE /api/bosses/[id] - Delete a boss
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete the boss
    await db.boss.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting boss:", error);
    return NextResponse.json(
      { error: "Failed to delete boss" },
      { status: 500 }
    );
  }
}
