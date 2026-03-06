import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// POST /api/equipment/unequip - Unequip an item to inventory
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slot } = body;

    if (!slot) {
      return NextResponse.json({ error: "slot is required" }, { status: 400 });
    }

    // Get character
    const character = await db.character.findUnique({
      where: { userId: user.id },
    });

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // Get equipped item
    const equippedItem = await db.equippedItem.findUnique({
      where: {
        characterId_slot: {
          characterId: character.id,
          slot: slot as never,
        },
      },
      include: {
        equipment: true,
      },
    });

    if (!equippedItem) {
      return NextResponse.json(
        { error: `No item equipped in ${slot} slot` },
        { status: 404 }
      );
    }

    // Check inventory capacity
    const inventoryCount = await db.equipmentInventoryItem.count({
      where: { characterId: character.id },
    });

    if (inventoryCount >= character.inventoryCapacity) {
      return NextResponse.json(
        {
          error: "Inventory is full. Expand capacity or sell items.",
          current: inventoryCount,
          max: character.inventoryCapacity,
        },
        { status: 400 }
      );
    }

    // Move to inventory
    const inventoryItem = await db.equipmentInventoryItem.create({
      data: {
        characterId: character.id,
        equipmentId: equippedItem.equipmentId,
        upgradeLevel: equippedItem.upgradeLevel,
      },
      include: {
        equipment: true,
      },
    });

    // Remove from equipped
    await db.equippedItem.delete({
      where: { id: equippedItem.id },
    });

    // TODO: Recalculate character stats after removing equipment

    return NextResponse.json({
      success: true,
      unequipped: {
        id: equippedItem.id,
        slot: equippedItem.slot,
        upgradeLevel: equippedItem.upgradeLevel,
        equipment: equippedItem.equipment,
      },
      inventoryItem: {
        id: inventoryItem.id,
        upgradeLevel: inventoryItem.upgradeLevel,
        equipment: inventoryItem.equipment,
      },
    });
  } catch (error) {
    console.error("Error unequipping item:", error);
    return NextResponse.json(
      { error: "Failed to unequip item" },
      { status: 500 }
    );
  }
}
