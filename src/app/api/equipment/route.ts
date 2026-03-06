import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { calculateTotalEquipmentStats, calculateEquipmentSetBonuses } from "@/lib/game/stats";

// GET /api/equipment - Get equipped items and inventory
export async function GET(request: NextRequest) {
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

    // Get equipped items with full equipment definitions
    const equippedItems = await db.equippedItem.findMany({
      where: { characterId: character.id },
      include: {
        equipment: true,
      },
    });

    // Get inventory items with full equipment definitions
    const inventoryItems = await db.equipmentInventoryItem.findMany({
      where: { characterId: character.id },
      include: {
        equipment: true,
      },
    });

    // Calculate total equipment stats
    const equipmentStats = calculateTotalEquipmentStats(
      equippedItems.map((item: any) => ({
        id: item.id,
        setName: item.equipment.setName,
        stats: {
          strength: item.equipment.strengthBonus,
          stamina: item.equipment.staminaBonus,
          focus: item.equipment.focusBonus,
          discipline: item.equipment.disciplineBonus,
          charisma: item.equipment.charismaBonus,
        },
      }))
    );

    // Calculate set bonuses
    const setBonuses = calculateEquipmentSetBonuses(
      equippedItems.map((item: any) => ({
        id: item.id,
        setName: item.equipment.setName,
      }))
    );

    // Count current inventory items
    const currentCount = inventoryItems.length;
    const maxCapacity = character.inventoryCapacity;

    return NextResponse.json({
      equippedItems: equippedItems.map((item: any) => ({
        id: item.id,
        slot: item.slot,
        upgradeLevel: item.upgradeLevel,
        equippedAt: item.equippedAt,
        equipment: {
          id: item.equipment.id,
          name: item.equipment.name,
          description: item.equipment.description,
          slot: item.equipment.slot,
          rarity: item.equipment.rarity,
          levelRequirement: item.equipment.levelRequirement,
          icon: item.equipment.icon,
          strengthBonus: item.equipment.strengthBonus,
          staminaBonus: item.equipment.staminaBonus,
          focusBonus: item.equipment.focusBonus,
          disciplineBonus: item.equipment.disciplineBonus,
          charismaBonus: item.equipment.charismaBonus,
          setName: item.equipment.setName,
          setClass: item.equipment.setClass,
          specialEffect: item.equipment.specialEffect,
          specialEffectId: item.equipment.specialEffectId,
        },
      })),
      inventoryItems: inventoryItems.map((item: any) => ({
        id: item.id,
        upgradeLevel: item.upgradeLevel,
        acquiredAt: item.acquiredAt,
        equipment: {
          id: item.equipment.id,
          name: item.equipment.name,
          description: item.equipment.description,
          slot: item.equipment.slot,
          rarity: item.equipment.rarity,
          levelRequirement: item.equipment.levelRequirement,
          icon: item.equipment.icon,
          strengthBonus: item.equipment.strengthBonus,
          staminaBonus: item.equipment.staminaBonus,
          focusBonus: item.equipment.focusBonus,
          disciplineBonus: item.equipment.disciplineBonus,
          charismaBonus: item.equipment.charismaBonus,
          setName: item.equipment.setName,
          setClass: item.equipment.setClass,
          specialEffect: item.equipment.specialEffect,
          specialEffectId: item.equipment.specialEffectId,
        },
      })),
      equipmentStats,
      setBonuses,
      inventoryCount: currentCount,
      inventoryCapacity: maxCapacity,
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}
