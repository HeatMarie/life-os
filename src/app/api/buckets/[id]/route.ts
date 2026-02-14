import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// GET /api/buckets/[id] - Get a single bucket
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

    const bucket = await db.taskBucket.findFirst({
      where: { id, userId: user.id },
      include: {
        tasks: {
          orderBy: [
            { priority: "desc" },
            { dueDate: "asc" },
          ],
          include: {
            area: true,
            project: { include: { boss: true } },
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!bucket) {
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
    }

    return NextResponse.json(bucket);
  } catch (error) {
    console.error("Error fetching bucket:", error);
    return NextResponse.json(
      { error: "Failed to fetch bucket" },
      { status: 500 }
    );
  }
}

// PUT /api/buckets/[id] - Update a bucket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const bucket = await db.taskBucket.update({
      where: { id },
      data: {
        name: body.name,
        color: body.color,
        sortOrder: body.sortOrder,
      },
    });

    return NextResponse.json(bucket);
  } catch (error) {
    console.error("Error updating bucket:", error);
    return NextResponse.json(
      { error: "Failed to update bucket" },
      { status: 500 }
    );
  }
}

// DELETE /api/buckets/[id] - Delete a bucket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if bucket exists and is not a default bucket
    const bucket = await db.taskBucket.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (!bucket) {
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
    }

    if (bucket.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default buckets" },
        { status: 400 }
      );
    }

    // Move tasks to the first default bucket (To Do)
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    const defaultBucket = await db.taskBucket.findFirst({
      where: { userId: user.id, isDefault: true },
      orderBy: { sortOrder: "asc" },
    });

    if (defaultBucket && bucket.tasks.length > 0) {
      await db.task.updateMany({
        where: { bucketId: id },
        data: { bucketId: defaultBucket.id },
      });
    }

    await db.taskBucket.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      tasksMoved: bucket.tasks.length,
      movedToBucketId: defaultBucket?.id,
    });
  } catch (error) {
    console.error("Error deleting bucket:", error);
    return NextResponse.json(
      { error: "Failed to delete bucket" },
      { status: 500 }
    );
  }
}
