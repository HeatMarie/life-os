import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// POST /api/equipment/equip - Equip an item from inventory
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inventoryItemId } = body;

    if (!inventoryItemId) {
      return NextResponse.json(
        { error: "inventoryItemId is required" },
        { status: 400 }
      );
    }

    // Get character
    const character = await db.character.findUnique({
      where: { userId: user.id },
    });

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // Get the inventory item
    const inventoryItem = await db.equipmentInventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        characterId: character.id,
      },
      include: {
        equipment: true,
      },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Check level requirement
    if (character.level < inventoryItem.equipment.levelRequirement) {
      return NextResponse.json(
        {
          error: `Level ${inventoryItem.equipment.levelRequirement} required to equip this item`,
          required: inventoryItem.equipment.levelRequirement,
          current: character.level,
        },
        { status: 400 }
      );
    }

    const slot = inventoryItem.equipment.slot;

    // Check if slot is already occupied
    const existingEquipped = await db.equippedItem.findUnique({
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

    // If slot is occupied, move old item to inventory
    if (existingEquipped) {
      await db.equipmentInventoryItem.create({
        data: {
          characterId: character.id,
          equipmentId: existingEquipped.equipmentId,
          upgradeLevel: existingEquipped.upgradeLevel,
        },
      });

      await db.equippedItem.delete({
        where: { id: existingEquipped.id },
      });
    }

    // Equip the new item
    const equipped = await db.equippedItem.create({
      data: {
        characterId: character.id,
        equipmentId: inventoryItem.equipmentId,
        slot: slot as never,
        upgradeLevel: inventoryItem.upgradeLevel,
      },
      include: {
        equipment: true,
      },
    });

    // Remove from inventory
    await db.equipmentInventoryItem.delete({
      where: { id: inventoryItemId },
    });

    // TODO: Recalculate character stats based on new equipment
    // This would involve summing all equipment bonuses and updating character stats

    return NextResponse.json({
      success: true,
      equipped: {
        id: equipped.id,
        slot: equipped.slot,
        upgradeLevel: equipped.upgradeLevel,
        equipment: equipped.equipment,
      },
      unequipped: existingEquipped ? {
        id: existingEquipped.id,
        slot: existingEquipped.slot,
        upgradeLevel: existingEquipped.upgradeLevel,
        equipment: existingEquipped.equipment,
      } : null,
    });
  } catch (error) {
    console.error("Error equipping item:", error);
    return NextResponse.json(
      { error: "Failed to equip item" },
      { status: 500 }
    );
  }
}
