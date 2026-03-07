import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getUpgradeCost, calculateUpgradedStats } from "@/lib/game/equipment";

// POST /api/equipment/upgrade - Upgrade equipment
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inventoryItemId, equippedSlot } = body;

    if (!inventoryItemId && !equippedSlot) {
      return NextResponse.json(
        { error: "Either inventoryItemId or equippedSlot is required" },
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

    // Get the item to upgrade
    let item: any;
    let isEquipped = false;

    if (equippedSlot) {
      item = await db.equippedItem.findUnique({
        where: {
          characterId_slot: {
            characterId: character.id,
            slot: equippedSlot as never,
          },
        },
        include: {
          equipment: true,
        },
      });
      isEquipped = true;
    } else {
      item = await db.equipmentInventoryItem.findFirst({
        where: {
          id: inventoryItemId,
          characterId: character.id,
        },
        include: {
          equipment: true,
        },
      });
      isEquipped = false;
    }

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if max upgrade level reached
    if (item.upgradeLevel >= 3) {
      return NextResponse.json(
        { error: "Maximum upgrade level (3) reached" },
        { status: 400 }
      );
    }

    // Get upgrade cost
    const upgradeCost = getUpgradeCost(item.upgradeLevel);
    if (!upgradeCost) {
      return NextResponse.json(
        { error: "Cannot upgrade beyond level 3" },
        { status: 400 }
      );
    }

    // Check if user has enough gold
    if (character.gold < upgradeCost.gold) {
      return NextResponse.json(
        {
          error: "Not enough gold",
          required: upgradeCost.gold,
          current: character.gold,
        },
        { status: 400 }
      );
    }

    // Check if user has the required material
    const material = await db.inventoryItem.findUnique({
      where: {
        userId_itemType: {
          userId: user.id,
          itemType: upgradeCost.material as never,
        },
      },
    });

    if (!material || material.quantity < 1) {
      return NextResponse.json(
        {
          error: `Missing required material: ${upgradeCost.material}`,
          material: upgradeCost.material,
        },
        { status: 400 }
      );
    }

    // Deduct gold from character
    await db.character.update({
      where: { id: character.id },
      data: {
        gold: character.gold - upgradeCost.gold,
      },
    });

    // Deduct material
    if (material.quantity === 1) {
      await db.inventoryItem.delete({
        where: { id: material.id },
      });
    } else {
      // Wrap material deduction and item upgrade in a single transaction
      const newUpgradeLevel = item.upgradeLevel + 1;

      const upgradedItem = await db.$transaction(async (tx) => {
        // Deduct or remove the material within the transaction
        if (material.quantity === 1) {
          await tx.inventoryItem.delete({
            where: { id: material.id },
          });
        } else {
          await tx.inventoryItem.update({
            where: { id: material.id },
            data: {
              quantity: material.quantity - 1,
            },
          });
        }

        // Upgrade the item within the same transaction
        if (isEquipped) {
          return tx.equippedItem.update({
            where: { id: item.id },
            data: {
              upgradeLevel: newUpgradeLevel,
            },
            include: {
              equipment: true,
            },
          });
        } else {
          return tx.equipmentInventoryItem.update({
            where: { id: item.id },
            data: {
              upgradeLevel: newUpgradeLevel,
            },
            include: {
              equipment: true,
            },
          });
        }
      });

      // Calculate new stats
      const baseStats = {
        strength: item.equipment.strengthBonus,
        stamina: item.equipment.staminaBonus,
        focus: item.equipment.focusBonus,
        discipline: item.equipment.disciplineBonus,
        charisma: item.equipment.charismaBonus,
      };

      const upgradedStats = {
        strength: calculateUpgradedStats(baseStats.strength, newUpgradeLevel),
        stamina: calculateUpgradedStats(baseStats.stamina, newUpgradeLevel),
        focus: calculateUpgradedStats(baseStats.focus, newUpgradeLevel),
        discipline: calculateUpgradedStats(baseStats.discipline, newUpgradeLevel),
        charisma: calculateUpgradedStats(baseStats.charisma, newUpgradeLevel),
      };

      return NextResponse.json({
        success: true,
        upgradedItem: {
          id: upgradedItem.id,
          upgradeLevel: newUpgradeLevel,
          equipment: upgradedItem.equipment,
          isEquipped,
        },
        cost: {
          gold: upgradeCost.gold,
          material: upgradeCost.material,
        },
        baseStats,
        upgradedStats,
        goldRemaining: character.gold - upgradeCost.gold,
      });
    }

    // Calculate new stats
    const baseStats = {
      strength: item.equipment.strengthBonus,
      stamina: item.equipment.staminaBonus,
      focus: item.equipment.focusBonus,
      discipline: item.equipment.disciplineBonus,
      charisma: item.equipment.charismaBonus,
    };

    const upgradedStats = {
      strength: calculateUpgradedStats(baseStats.strength, newUpgradeLevel),
      stamina: calculateUpgradedStats(baseStats.stamina, newUpgradeLevel),
      focus: calculateUpgradedStats(baseStats.focus, newUpgradeLevel),
      discipline: calculateUpgradedStats(baseStats.discipline, newUpgradeLevel),
      charisma: calculateUpgradedStats(baseStats.charisma, newUpgradeLevel),
    };

    return NextResponse.json({
      success: true,
      upgradedItem: {
        id: upgradedItem.id,
        upgradeLevel: newUpgradeLevel,
        equipment: upgradedItem.equipment,
        isEquipped,
      },
      cost: {
        gold: upgradeCost.gold,
        material: upgradeCost.material,
      },
      baseStats,
      upgradedStats,
      goldRemaining: character.gold - upgradeCost.gold,
    });
  } catch (error) {
    console.error("Error upgrading equipment:", error);
    return NextResponse.json(
      { error: "Failed to upgrade equipment" },
      { status: 500 }
    );
  }
}
