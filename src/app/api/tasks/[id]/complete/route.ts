import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  generateLootDrop,
  calculateBossDamage,
  getStreakMultiplier,
  getClassBonus,
} from "@/lib/game/mechanics";
import { checkAchievementUnlocks } from "@/lib/game/achievements";
import { XP_PER_LEVEL_BASE, STAT_POINTS_PER_LEVEL } from "@/lib/game/constants";
import {
  shouldDropEquipment,
  generateEquipmentDrop,
  calculateGoldReward,
} from "@/lib/game/equipment";

// POST /api/tasks/[id]/complete - Complete a task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    // Get the task with project and project's boss
    const task = await db.task.findFirst({
      where: { id, userId },
      include: { 
        project: {
          include: { boss: true }
        }
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status === "DONE") {
      return NextResponse.json(
        { error: "Task already completed" },
        { status: 400 }
      );
    }

    // Get character
    const character = await db.character.findUnique({
      where: { userId },
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    if (character.status === "DEAD") {
      return NextResponse.json(
        { error: "Cannot complete tasks while dead. Revive first!" },
        { status: 400 }
      );
    }

    // Check energy
    if (character.energy < task.energyCost) {
      return NextResponse.json(
        { error: "Not enough energy. Rest to recover!" },
        { status: 400 }
      );
    }

    // Calculate rewards with multipliers
    const streakMultiplier = getStreakMultiplier(character.currentStreak);
    const classBonus = getClassBonus(character.class, task.priority);
    const baseXP = task.xpReward;
    const totalXP = Math.floor(baseXP * streakMultiplier * classBonus);

    // Update streak (simple version - just increment if active today)
    const now = new Date();
    const lastActive = character.lastActiveAt;
    const daysSinceActive = Math.floor(
      (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let newStreak = character.currentStreak;
    if (daysSinceActive === 0) {
      // Same day, keep streak
    } else if (daysSinceActive === 1) {
      // Next day, increment streak
      newStreak += 1;
    } else {
      // Missed days, reset streak (unless protected)
      if (daysSinceActive <= character.streakProtection) {
        newStreak = character.currentStreak; // Protected
      } else {
        newStreak = 1; // Reset
      }
    }

    // Calculate new XP and level
    let newXP = character.xp + totalXP;
    let newLevel = character.level;
    let newXPToNext = character.xpToNextLevel;
    let leveledUp = false;
    const levelUps: number[] = [];

    // Handle level ups
    while (newXP >= newXPToNext) {
      newXP -= newXPToNext;
      newLevel += 1;
      newXPToNext = Math.floor(XP_PER_LEVEL_BASE * Math.pow(1.15, newLevel - 1));
      leveledUp = true;
      levelUps.push(newLevel);
    }

    // Calculate bonus stats on level up
    let maxHpBonus = 0;
    let maxEnergyBonus = 0;
    let statPointsEarned = 0;
    if (leveledUp) {
      // +5 HP and +3 energy per level
      maxHpBonus = levelUps.length * 5;
      maxEnergyBonus = levelUps.length * 3;
      // Award stat points based on each level gained
      for (const level of levelUps) {
        statPointsEarned += STAT_POINTS_PER_LEVEL(level);
      }
    }

    // Generate loot drop (chance based on task priority)
    const loot = generateLootDrop(task.priority);
    let inventoryItem = null;

    if (loot) {
      // Map loot type to ItemType enum
      const itemTypeMap: { [key: string]: string } = {
        xp_boost: "XP_SHARD",
        energy: "ENERGY_POTION",
        streak: "STREAK_SHIELD",
        damage: "BOSS_BANE",
        health: "HEALTH_POTION",
        revive: "REVIVE_TOKEN",
      };
      
      const itemType = itemTypeMap[loot.type] || "XP_SHARD";
      
      // Check if user already has this item (upsert to increase quantity)
      const existingItem = await db.inventoryItem.findUnique({
        where: {
          userId_itemType: {
            userId,
            itemType: itemType as never,
          },
        },
      });

      if (existingItem) {
        inventoryItem = await db.inventoryItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + 1 },
        });
      } else {
        inventoryItem = await db.inventoryItem.create({
          data: {
            userId,
            itemType: itemType as never,
            name: loot.name,
            icon: loot.icon,
            effect: loot.description,
            rarity: loot.rarity as never,
            quantity: 1,
          },
        });
      }
    }

    // Generate equipment drop (small chance based on priority)
    let equipmentDrop = null;
    if (shouldDropEquipment(task.priority)) {
      const drop = generateEquipmentDrop(
        character.level,
        "TASK",
        character.class as never,
        character.focus || 0
      );

      // Check inventory capacity
      const inventoryCount = await db.equipmentInventoryItem.count({
        where: { characterId: character.id },
      });

      if (inventoryCount < character.inventoryCapacity) {
        // Find or create equipment definition matching the drop
        // For now, we'll need to find a matching equipment from the database
        // In a real scenario, this would be more sophisticated
        const equipmentWhere = {
          slot: drop.slot as never,
          rarity: drop.rarity as never,
          levelRequirement: { lte: character.level },
          // Prefer equipment definitions aligned with the character's class
          setClass: character.class as never,
        };

        const matchingCount = await db.equipmentDefinition.count({
          where: equipmentWhere,
        });

        let matchingEquipment = null;

        if (matchingCount > 0) {
          // Randomize selection among all matching equipment definitions
          const randomSkip = Math.floor(Math.random() * matchingCount);

          matchingEquipment = await db.equipmentDefinition.findFirst({
            where: equipmentWhere,
            skip: randomSkip,
          });
        }
        if (matchingEquipment) {
          equipmentDrop = await db.equipmentInventoryItem.create({
            data: {
              characterId: character.id,
              equipmentId: matchingEquipment.id,
              upgradeLevel: 0,
            },
            include: {
              equipment: true,
            },
          });
        }
      }
    }

    // Award gold based on task priority
    const goldReward = calculateGoldReward(task.priority);

    // Handle boss damage (through project)
    let bossDamage = 0;
    let bossDefeated = false;
    let bossRewards: any = null;
    const boss = task.project?.boss;

    if (boss && boss.status === "ACTIVE") {
      bossDamage = calculateBossDamage(task.priority);
      const newBossHP = Math.max(0, boss.hp - bossDamage);

      if (newBossHP === 0) {
        // Boss defeated!
        bossDefeated = true;
        bossRewards = {
          xp: boss.xpReward,
        };

        // Generate guaranteed equipment drop from boss defeat
        const bossDrop = generateEquipmentDrop(
          character.level,
          "BOSS_DEFEAT",
          character.class as never,
          character.focus || 0
        );

        // Check inventory capacity for boss equipment
        const inventoryCount = await db.equipmentInventoryItem.count({
          where: { characterId: character.id },
        });

        let bossEquipmentDrop = null;
        if (inventoryCount < character.inventoryCapacity) {
          const matchingEquipment = await db.equipmentDefinition.findFirst({
            where: {
              slot: bossDrop.slot as never,
              rarity: bossDrop.rarity as never,
              levelRequirement: { lte: character.level },
            },
          });

          if (matchingEquipment) {
            bossEquipmentDrop = await db.equipmentInventoryItem.create({
              data: {
                characterId: character.id,
                equipmentId: matchingEquipment.id,
                upgradeLevel: 0,
              },
              include: {
                equipment: true,
              },
            });
          }
        }

        // Add boss equipment drop to rewards
        if (bossEquipmentDrop) {
          bossRewards.equipmentDrop = bossEquipmentDrop;
        }

        await db.boss.update({
          where: { id: boss.id },
          data: {
            hp: 0,
            status: "DEFEATED",
          },
        });
      } else {
        await db.boss.update({
          where: { id: boss.id },
          data: { hp: newBossHP },
        });
      }
    }

    // Update character
    const updatedCharacter = await db.character.update({
      where: { userId },
      data: {
        xp: newXP,
        level: newLevel,
        xpToNextLevel: newXPToNext,
        energy: character.energy - task.energyCost,
        maxHp: character.maxHp + maxHpBonus,
        maxEnergy: character.maxEnergy + maxEnergyBonus,
        currentStreak: newStreak,
        longestStreak: Math.max(character.longestStreak, newStreak),
        tasksCompleted: character.tasksCompleted + 1,
        totalXpEarned: character.totalXpEarned + totalXP + (bossRewards?.xp || 0),
        bossesDefeated: character.bossesDefeated + (bossDefeated ? 1 : 0),
        gold: character.gold + goldReward,
        lastActiveAt: now,
        statPointsAvailable: character.statPointsAvailable + statPointsEarned,
        totalStatPointsEarned: character.totalStatPointsEarned + statPointsEarned,
      },
    });

    // Mark task complete
    await db.task.update({
      where: { id },
      data: {
        status: "DONE",
        completedAt: now,
        damageDealt: bossDamage,
      },
    });

    // Check for new achievements (using user's achievements)
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });
    const unlockedAchievementCodes = userAchievements.map(ua => ua.achievement.code);
    
    // Build stats object matching UserStats interface
    const stats = {
      tasksCompleted: updatedCharacter.tasksCompleted,
      tasksCompletedToday: 1, // Just completed one
      areasCompletedToday: [task.areaId],
      currentStreak: newStreak,
      longestStreak: updatedCharacter.longestStreak,
      level: newLevel,
      wordsWritten: 0, // Would need to track this
      bossesDefeated: updatedCharacter.bossesDefeated,
      deathCount: updatedCharacter.deathCount,
      burnoutRecoveries: 0, // Would need to track this
      tasksByArea: { [task.areaId]: 1 },
    };
    
    const newAchievements = checkAchievementUnlocks(stats, unlockedAchievementCodes);

    // Award new achievements
    let achievementXP = 0;
    for (const achievement of newAchievements) {
      // Find or create the achievement definition
      let achievementDef = await db.achievement.findUnique({
        where: { code: achievement.code },
      });
      
      if (!achievementDef) {
        achievementDef = await db.achievement.create({
          data: {
            code: achievement.code,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            rarity: achievement.rarity,
            xpReward: achievement.xpReward,
            condition: { type: "CUSTOM", code: achievement.code },
          },
        });
      }
      
      // Link to user
      await db.userAchievement.create({
        data: {
          userId,
          achievementId: achievementDef.id,
        },
      });
      
      achievementXP += achievement.xpReward;
    }

    // Add achievement XP if any
    if (achievementXP > 0) {
      await db.character.update({
        where: { userId },
        data: {
          xp: { increment: achievementXP },
          totalXpEarned: { increment: achievementXP },
        },
      });
    }

    return NextResponse.json({
      success: true,
      rewards: {
        xp: totalXP,
        baseXP,
        streakMultiplier,
        classBonus,
        energySpent: task.energyCost,
        gold: goldReward,
        newStreak,
        leveledUp,
        newLevel: leveledUp ? newLevel : null,
        statPointsEarned: leveledUp ? statPointsEarned : 0,
        loot: inventoryItem,
        equipmentDrop,
        bossDamage,
        bossDefeated,
        bossRewards,
        achievements: newAchievements,
        achievementXP,
      },
      character: updatedCharacter,
    });
  } catch (error) {
    console.error("Error completing task:", error);
    return NextResponse.json(
      { error: "Failed to complete task" },
      { status: 500 }
    );
  }
}
