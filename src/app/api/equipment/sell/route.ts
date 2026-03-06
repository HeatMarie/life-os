import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getEquipmentSellPrice } from "@/lib/game/equipment";

// POST /api/equipment/sell - Sell equipment from inventory
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

    // Calculate sell price
    const sellPrice = getEquipmentSellPrice(
      inventoryItem.equipment.rarity as never,
      inventoryItem.upgradeLevel
    );

    // Add gold to character
    await db.character.update({
      where: { id: character.id },
      data: {
        gold: character.gold + sellPrice,
      },
    });

    // Remove item from inventory
    await db.equipmentInventoryItem.delete({
      where: { id: inventoryItemId },
    });

    return NextResponse.json({
      success: true,
      soldItem: {
        id: inventoryItem.id,
        equipment: {
          name: inventoryItem.equipment.name,
          rarity: inventoryItem.equipment.rarity,
          icon: inventoryItem.equipment.icon,
        },
        upgradeLevel: inventoryItem.upgradeLevel,
      },
      goldEarned: sellPrice,
      goldTotal: character.gold + sellPrice,
    });
  } catch (error) {
    console.error("Error selling equipment:", error);
    return NextResponse.json(
      { error: "Failed to sell equipment" },
      { status: 500 }
    );
  }
}
