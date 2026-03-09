import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { INVENTORY_EXPANSION } from "@/lib/game/constants";

// POST /api/equipment/expand-inventory - Expand inventory capacity
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get character
    const character = await db.character.findUnique({
      where: { userId: user.id },
    });

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // Check if already at max capacity
    if (character.inventoryCapacity >= INVENTORY_EXPANSION.MAX_SLOTS) {
      return NextResponse.json(
        { error: "Inventory is already at maximum capacity" },
        { status: 400 }
      );
    }

    // Calculate cost based on current capacity
    const purchasesMade = Math.floor(
      (character.inventoryCapacity - 20) / INVENTORY_EXPANSION.SLOTS_PER_PURCHASE
    );
    const cost = Math.floor(
      INVENTORY_EXPANSION.BASE_COST *
        Math.pow(INVENTORY_EXPANSION.COST_SCALING, purchasesMade)
    );

    // Check if character has enough gold
    if (character.gold < cost) {
      return NextResponse.json(
        { error: "Insufficient gold", required: cost, current: character.gold },
        { status: 400 }
      );
    }

    // Calculate new capacity
    const newCapacity = Math.min(
      character.inventoryCapacity + INVENTORY_EXPANSION.SLOTS_PER_PURCHASE,
      INVENTORY_EXPANSION.MAX_SLOTS
    );

    // Update character
    const updatedCharacter = await db.character.update({
      where: { userId: user.id },
      data: {
        gold: character.gold - cost,
        inventoryCapacity: newCapacity,
      },
    });

    return NextResponse.json({
      success: true,
      goldSpent: cost,
      newCapacity: updatedCharacter.inventoryCapacity,
      goldRemaining: updatedCharacter.gold,
    });
  } catch (error) {
    console.error("Error expanding inventory:", error);
    return NextResponse.json(
      { error: "Failed to expand inventory" },
      { status: 500 }
    );
  }
}
