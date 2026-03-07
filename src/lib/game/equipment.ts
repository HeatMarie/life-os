// ══════════════════════════════════════════════════════════════════════════════
// LIFE OS — EQUIPMENT SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

import { GOLD_REWARDS } from "./constants";

// Types
export type EquipmentSlot = "WEAPON" | "ARMOR" | "HELM" | "BOOTS" | "ACCESSORY" | "TRINKET";
export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
export type EquipmentSource = "TASK" | "BOSS_DEFEAT" | "DAILY_BOSS" | "STREAK" | "ACHIEVEMENT";
export type CharacterClass = "WARRIOR" | "MAGE" | "ROGUE" | "BARD" | "DRUID" | "CLERIC" | "NECROMANCER";
export type Priority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface StatBonuses {
  primary: { min: number; max: number };
  secondary?: { min: number; max: number };
}

export interface EquipmentDrop {
  slot: EquipmentSlot;
  rarity: Rarity;
  strengthBonus: number;
  staminaBonus: number;
  focusBonus: number;
  disciplineBonus: number;
  charismaBonus: number;
  levelRequirement: number;
}

export interface UpgradeCost {
  gold: number;
  material: "UPGRADE_STONE" | "ENHANCEMENT_CRYSTAL" | "MYTHIC_ESSENCE";
}

// ── Rarity Roll System ───────────────────────────────────────────────────────

/**
 * Rolls for equipment rarity based on the drop source
 * TASK: 70% Common, 25% Rare, 4.5% Epic, 0.5% Legendary
 * BOSS_DEFEAT: 0% Common, 50% Rare, 40% Epic, 10% Legendary
 * DAILY_BOSS: 40% Common, 40% Rare, 18% Epic, 2% Legendary
 * Focus stat provides +0.5% loot crit chance per point (affects Epic/Legendary)
 */
export function rollEquipmentRarity(
  source: EquipmentSource,
  focusStat: number = 0
): Rarity {
  const roll = Math.random() * 100;
  const lootCrit = focusStat * 0.5; // +0.5% per point of Focus

  // Define base drop rates
  const dropRates: Record<EquipmentSource, { common: number; rare: number; epic: number; legendary: number }> = {
    TASK: { common: 70, rare: 25, epic: 4.5, legendary: 0.5 },
    BOSS_DEFEAT: { common: 0, rare: 50, epic: 40, legendary: 10 },
    DAILY_BOSS: { common: 40, rare: 40, epic: 18, legendary: 2 },
    STREAK: { common: 50, rare: 35, epic: 13, legendary: 2 },
    ACHIEVEMENT: { common: 0, rare: 60, epic: 35, legendary: 5 },
  };

  const rates = dropRates[source];

  // Apply loot crit bonus by shifting odds toward higher rarities
  const legendaryChance = rates.legendary + lootCrit * 0.2;
  const epicChance = rates.epic + lootCrit * 0.3;
  const rareChance = rates.rare;
  const commonChance = Math.max(0, 100 - legendaryChance - epicChance - rareChance);

  // Roll from highest rarity to lowest
  if (roll < legendaryChance) return "LEGENDARY";
  if (roll < legendaryChance + epicChance) return "EPIC";
  if (roll < legendaryChance + epicChance + rareChance) return "RARE";
  return "COMMON";
}

// ── Equipment Slot Roll ──────────────────────────────────────────────────────

/**
 * Rolls for equipment slot with equal probability across all slots
 */
export function rollEquipmentSlot(): EquipmentSlot {
  const slots: EquipmentSlot[] = ["WEAPON", "ARMOR", "HELM", "BOOTS", "ACCESSORY", "TRINKET"];
  const index = Math.floor(Math.random() * slots.length);
  return slots[index];
}

// ── Stat Bonuses by Rarity ───────────────────────────────────────────────────

/**
 * Rolls stat bonuses based on rarity
 * Common: +1-3 primary, no secondary
 * Rare: +2-5 primary, +1-2 secondary
 * Epic: +4-8 primary, +2-4 secondary
 * Legendary: +6-12 primary, +3-6 secondary
 */
export function rollStatBonuses(rarity: Rarity): { primary: number; secondary: number } {
  const bonusRanges: Record<Rarity, StatBonuses> = {
    COMMON: { primary: { min: 1, max: 3 } },
    RARE: { primary: { min: 2, max: 5 }, secondary: { min: 1, max: 2 } },
    EPIC: { primary: { min: 4, max: 8 }, secondary: { min: 2, max: 4 } },
    LEGENDARY: { primary: { min: 6, max: 12 }, secondary: { min: 3, max: 6 } },
  };

  const ranges = bonusRanges[rarity];
  const primary = Math.floor(Math.random() * (ranges.primary.max - ranges.primary.min + 1)) + ranges.primary.min;
  const secondary = ranges.secondary
    ? Math.floor(Math.random() * (ranges.secondary.max - ranges.secondary.min + 1)) + ranges.secondary.min
    : 0;

  return { primary, secondary };
}

// ── Stat Assignment by Class/Slot ────────────────────────────────────────────

/**
 * Determines which stats to boost based on character class and equipment slot
 */
export function getStatsForClassAndSlot(
  characterClass: CharacterClass,
  slot: EquipmentSlot
): { primaryStat: keyof EquipmentDrop; secondaryStat: keyof EquipmentDrop } {
  // Class primary stats
  const classPrimaryStats: Record<CharacterClass, keyof EquipmentDrop> = {
    WARRIOR: "strengthBonus",
    MAGE: "focusBonus",
    ROGUE: "focusBonus",
    BARD: "charismaBonus",
    DRUID: "staminaBonus",
    CLERIC: "disciplineBonus",
    NECROMANCER: "focusBonus",
  };

  // Class secondary stats
  const classSecondaryStats: Record<CharacterClass, keyof EquipmentDrop> = {
    WARRIOR: "staminaBonus",
    MAGE: "disciplineBonus",
    ROGUE: "charismaBonus",
    BARD: "disciplineBonus",
    DRUID: "focusBonus",
    CLERIC: "staminaBonus",
    NECROMANCER: "disciplineBonus",
  };

  // Slot influences (weapons favor damage/primary, armor favors defense/stamina)
  const primaryStat = classPrimaryStats[characterClass];
  let secondaryStat = classSecondaryStats[characterClass];

  // Armor pieces favor stamina as secondary
  if (slot === "ARMOR" || slot === "HELM") {
    secondaryStat = "staminaBonus";
  }

  return { primaryStat, secondaryStat };
}

// ── Level Requirement ────────────────────────────────────────────────────────

/**
 * Determines level requirement based on rarity
 */
export function getLevelRequirement(rarity: Rarity): number {
  const requirements: Record<Rarity, number> = {
    COMMON: 1,
    RARE: 5,
    EPIC: 10,
    LEGENDARY: 20,
  };
  return requirements[rarity];
}

// ── Equipment Drop Generator ─────────────────────────────────────────────────

/**
 * Generates a complete equipment drop with stats
 * @param characterLevel - Current character level
 * @param source - Drop source (TASK, BOSS_DEFEAT, etc.)
 * @param characterClass - Character class for stat assignment
 * @param focusStat - Focus stat value for loot crit bonus
 */
export function generateEquipmentDrop(
  characterLevel: number,
  source: EquipmentSource,
  characterClass: CharacterClass,
  focusStat: number = 0
): EquipmentDrop {
  const rarity = rollEquipmentRarity(source, focusStat);
  const slot = rollEquipmentSlot();
  const { primary, secondary } = rollStatBonuses(rarity);
  const { primaryStat, secondaryStat } = getStatsForClassAndSlot(characterClass, slot);
  const levelRequirement = getLevelRequirement(rarity);

  // Build equipment drop with bonuses
  const drop: EquipmentDrop = {
    slot,
    rarity,
    strengthBonus: 0,
    staminaBonus: 0,
    focusBonus: 0,
    disciplineBonus: 0,
    charismaBonus: 0,
    levelRequirement,
  };

  // Assign primary and secondary bonuses
  if (primaryStat === secondaryStat) {
    // When both stats resolve to the same key, combine the bonuses instead of overwriting
    drop[primaryStat] = (primary ?? 0) + (secondary ?? 0);
  } else {
    drop[primaryStat] = primary;
    drop[secondaryStat] = secondary;
  }

  return drop;
}

// ── Upgrade System ───────────────────────────────────────────────────────────

/**
 * Returns the cost to upgrade equipment from current level to next level
 * Level 0→1: 100g + Upgrade Stone
 * Level 1→2: 300g + Enhancement Crystal
 * Level 2→3: 500g + Mythic Essence
 */
export function getUpgradeCost(currentLevel: number): UpgradeCost | null {
  const costs: Record<number, UpgradeCost> = {
    0: { gold: 100, material: "UPGRADE_STONE" },
    1: { gold: 300, material: "ENHANCEMENT_CRYSTAL" },
    2: { gold: 500, material: "MYTHIC_ESSENCE" },
  };

  return costs[currentLevel] || null;
}

/**
 * Calculates upgraded stat bonuses (+30% per upgrade level)
 */
export function calculateUpgradedStats(baseStats: number, upgradeLevel: number): number {
  return Math.floor(baseStats * Math.pow(1.3, upgradeLevel));
}

// ── Sell Prices ──────────────────────────────────────────────────────────────

/**
 * Calculates sell price for equipment
 * Common: 25g, Rare: 75g, Epic: 150g, Legendary: 200g
 * +50g per upgrade level
 */
export function getEquipmentSellPrice(rarity: Rarity, upgradeLevel: number = 0): number {
  const basePrices: Record<Rarity, number> = {
    COMMON: 25,
    RARE: 75,
    EPIC: 150,
    LEGENDARY: 200,
  };

  const basePrice = basePrices[rarity];
  const upgradeBonus = upgradeLevel * 50;

  return basePrice + upgradeBonus;
}

// ── Equipment Drop Chance ────────────────────────────────────────────────────

/**
 * Determines if equipment should drop from task completion
 * Base: 5% chance, modified by priority
 * URGENT: 10%, HIGH: 8%, MEDIUM: 5%, LOW: 3%, NONE: 1%
 */
export function shouldDropEquipment(priority: Priority): boolean {
  const dropChances: Record<Priority, number> = {
    URGENT: 10,
    HIGH: 8,
    MEDIUM: 5,
    LOW: 3,
    NONE: 1,
  };

  const chance = dropChances[priority];
  return Math.random() * 100 < chance;
}

/**
 * Calculate gold reward based on task priority
 */
export function calculateGoldReward(priority: Priority): number {
  return GOLD_REWARDS[priority] || GOLD_REWARDS.MEDIUM;
}
