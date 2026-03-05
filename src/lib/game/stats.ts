// ══════════════════════════════════════════════════════════════════════════════
// LIFE OS — STAT CALCULATIONS
// ══════════════════════════════════════════════════════════════════════════════
// Pure calculation functions for character stats and their effects
// No database calls - all calculations based on passed parameters

import {
  STAT_EFFECTS,
  STAT_POINTS_PER_LEVEL,
  VITALITY_THRESHOLDS,
} from "./constants";

// ══════════════════════════════════════════════════════════════════════════════
// DERIVED STATS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate Vitality (derived stat from STR, STA, FOC)
 * Vitality = round((strength + stamina + focus) / 3)
 */
export function calculateVitality(
  strength: number,
  stamina: number,
  focus: number
): number {
  return Math.round((strength + stamina + focus) / 3);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAX RESOURCE CALCULATIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate effective max HP with stat bonuses
 * @param baseMaxHP - Base max HP from character
 * @param strength - Strength stat value
 * @param equipmentBonus - Bonus HP from equipment (optional)
 */
export function calculateEffectiveMaxHP(
  baseMaxHP: number,
  strength: number,
  equipmentBonus: number = 0
): number {
  const strengthBonus = strength * STAT_EFFECTS.STRENGTH.maxHP;
  return baseMaxHP + strengthBonus + equipmentBonus;
}

/**
 * Calculate effective max energy with stat bonuses
 * @param baseMaxEnergy - Base max energy from character
 * @param stamina - Stamina stat value
 * @param equipmentBonus - Bonus energy from equipment (optional)
 */
export function calculateEffectiveMaxEnergy(
  baseMaxEnergy: number,
  stamina: number,
  equipmentBonus: number = 0
): number {
  const staminaBonus = stamina * STAT_EFFECTS.STAMINA.maxEnergy;
  return baseMaxEnergy + staminaBonus + equipmentBonus;
}

/**
 * Calculate effective max mana with stat bonuses
 * @param baseMana - Base max mana from character
 * @param focus - Focus stat value
 */
export function calculateEffectiveMaxMana(
  baseMana: number,
  focus: number
): number {
  const focusBonus = focus * STAT_EFFECTS.FOCUS.maxMana;
  return baseMana + focusBonus;
}

// ══════════════════════════════════════════════════════════════════════════════
// ENERGY COST CALCULATIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate energy cost with stamina reduction
 * @param baseCost - Base energy cost of task
 * @param stamina - Stamina stat value
 * @returns Reduced energy cost (minimum 50% reduction, minimum 1 cost)
 */
export function calculateEnergyCostWithStats(
  baseCost: number,
  stamina: number
): number {
  // Calculate reduction percentage (1% per stamina point)
  const reductionPercent = stamina * STAT_EFFECTS.STAMINA.energyCostReduction;

  // Cap at 50% reduction
  const cappedReduction = Math.min(reductionPercent, 0.50);

  // Apply reduction
  const reducedCost = baseCost * (1 - cappedReduction);

  // Minimum cost is 1
  return Math.max(1, Math.floor(reducedCost));
}

// ══════════════════════════════════════════════════════════════════════════════
// BOSS DAMAGE CALCULATIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate boss damage with strength bonus and difficulty multiplier
 * @param baseDamage - Base damage from task priority
 * @param strength - Strength stat value
 * @param difficultyMultiplier - Difficulty multiplier (CASUAL/BALANCED/HARDCORE)
 * @param equipmentBonus - Bonus damage from equipment (optional)
 */
export function calculateBossDamageWithStats(
  baseDamage: number,
  strength: number,
  difficultyMultiplier: number = 1.0,
  equipmentBonus: number = 0
): number {
  const strengthBonus = strength * STAT_EFFECTS.STRENGTH.bossDamage;
  const totalDamage = (baseDamage + strengthBonus + equipmentBonus) * difficultyMultiplier;
  return Math.floor(totalDamage);
}

// ══════════════════════════════════════════════════════════════════════════════
// XP CALCULATIONS WITH STATS
// ══════════════════════════════════════════════════════════════════════════════

export type TaskType =
  | "DEEP_WORK"
  | "LEARNING"
  | "READING"
  | "SOCIAL"
  | "HABIT"
  | "OTHER";

export interface StatValues {
  focus: number;
  charisma: number;
  discipline: number;
}

/**
 * Calculate XP with stat bonuses applied
 * @param baseXP - Base XP from task priority and other multipliers
 * @param stats - Character stats (focus, charisma, discipline)
 * @param taskType - Type of task for determining which stat applies
 * @param streakDays - Current streak for discipline bonus calculation
 * @param difficultyMultiplier - Difficulty multiplier (CASUAL/BALANCED/HARDCORE)
 */
export function calculateXPWithStats(
  baseXP: number,
  stats: StatValues,
  taskType: TaskType,
  streakDays: number = 0,
  difficultyMultiplier: number = 1.0
): number {
  let xpMultiplier = 1.0;

  // Focus bonus for deep work, learning, and reading
  if (taskType === "DEEP_WORK" || taskType === "LEARNING" || taskType === "READING") {
    xpMultiplier += stats.focus * STAT_EFFECTS.FOCUS.xpBonus;
  }

  // Charisma bonus for social tasks
  if (taskType === "SOCIAL") {
    xpMultiplier += stats.charisma * STAT_EFFECTS.CHARISMA.socialXPBonus;
  }

  // Discipline bonus for habits and streaks
  if (taskType === "HABIT") {
    xpMultiplier += stats.discipline * STAT_EFFECTS.DISCIPLINE.habitXPBonus;
  }

  // Discipline streak bonus (applies to all tasks when on a streak)
  if (streakDays > 0) {
    xpMultiplier += stats.discipline * STAT_EFFECTS.DISCIPLINE.streakXPBonus;
  }

  // Apply difficulty multiplier
  const totalXP = baseXP * xpMultiplier * difficultyMultiplier;

  return Math.floor(totalXP);
}

// ══════════════════════════════════════════════════════════════════════════════
// LEVEL UP STAT POINTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate total stat points awarded for leveling up
 * @param oldLevel - Previous level
 * @param newLevel - New level after leveling up
 * @returns Total stat points gained across all levels
 */
export function calculateStatPointsForLevelUp(
  oldLevel: number,
  newLevel: number
): number {
  let totalPoints = 0;

  // Sum stat points for each level gained
  for (let level = oldLevel + 1; level <= newLevel; level++) {
    totalPoints += STAT_POINTS_PER_LEVEL(level);
  }

  return totalPoints;
}

// ══════════════════════════════════════════════════════════════════════════════
// EQUIPMENT CALCULATIONS
// ══════════════════════════════════════════════════════════════════════════════

export interface EquipmentItem {
  id: string;
  setName?: string; // Optional set identifier
  stats?: {
    strength?: number;
    stamina?: number;
    focus?: number;
    discipline?: number;
    charisma?: number;
    maxHP?: number;
    maxEnergy?: number;
    bossDamage?: number;
  };
}

export interface SetBonus {
  setName: string;
  pieceCount: number;
  bonuses: {
    twoSet?: Record<string, number>;
    fourSet?: Record<string, number>;
    sixSet?: Record<string, number>;
  };
}

/**
 * Calculate equipment set bonuses based on equipped items
 * @param equippedItems - Array of currently equipped items
 * @returns Array of active set bonuses
 */
export function calculateEquipmentSetBonuses(
  equippedItems: EquipmentItem[]
): SetBonus[] {
  // Count pieces per set
  const setCounts = new Map<string, number>();

  for (const item of equippedItems) {
    if (item.setName) {
      setCounts.set(item.setName, (setCounts.get(item.setName) || 0) + 1);
    }
  }

  // Determine active bonuses
  const activeBonuses: SetBonus[] = [];

  setCounts.forEach((count, setName) => {
    const bonus: SetBonus = {
      setName,
      pieceCount: count,
      bonuses: {},
    };

    // 2-piece set bonus
    if (count >= 2) {
      bonus.bonuses.twoSet = { maxHP: 10, maxEnergy: 5 };
    }

    // 4-piece set bonus
    if (count >= 4) {
      bonus.bonuses.fourSet = { strength: 2, stamina: 2 };
    }

    // 6-piece set bonus
    if (count >= 6) {
      bonus.bonuses.sixSet = { bossDamage: 10, xpBonus: 0.10 };
    }

    activeBonuses.push(bonus);
  });

  return activeBonuses;
}

/**
 * Calculate total stat bonuses from all equipped items
 * @param equippedItems - Array of currently equipped items
 * @returns Object with summed stat bonuses
 */
export function calculateTotalEquipmentStats(
  equippedItems: EquipmentItem[]
): {
  strength: number;
  stamina: number;
  focus: number;
  discipline: number;
  charisma: number;
  maxHP: number;
  maxEnergy: number;
  bossDamage: number;
} {
  const totals = {
    strength: 0,
    stamina: 0,
    focus: 0,
    discipline: 0,
    charisma: 0,
    maxHP: 0,
    maxEnergy: 0,
    bossDamage: 0,
  };

  // Sum all equipment stats
  for (const item of equippedItems) {
    if (item.stats) {
      totals.strength += item.stats.strength || 0;
      totals.stamina += item.stats.stamina || 0;
      totals.focus += item.stats.focus || 0;
      totals.discipline += item.stats.discipline || 0;
      totals.charisma += item.stats.charisma || 0;
      totals.maxHP += item.stats.maxHP || 0;
      totals.maxEnergy += item.stats.maxEnergy || 0;
      totals.bossDamage += item.stats.bossDamage || 0;
    }
  }

  // Add set bonuses
  const setBonuses = calculateEquipmentSetBonuses(equippedItems);
  for (const setBonus of setBonuses) {
    // Apply 2-piece bonuses
    if (setBonus.bonuses.twoSet) {
      totals.maxHP += setBonus.bonuses.twoSet.maxHP || 0;
      totals.maxEnergy += setBonus.bonuses.twoSet.maxEnergy || 0;
    }

    // Apply 4-piece bonuses
    if (setBonus.bonuses.fourSet) {
      totals.strength += setBonus.bonuses.fourSet.strength || 0;
      totals.stamina += setBonus.bonuses.fourSet.stamina || 0;
    }

    // Apply 6-piece bonuses
    if (setBonus.bonuses.sixSet) {
      totals.bossDamage += setBonus.bonuses.sixSet.bossDamage || 0;
      // Note: xpBonus would need to be handled separately as it's a multiplier
    }
  }

  return totals;
}

// ══════════════════════════════════════════════════════════════════════════════
// VITALITY EFFECTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Check if character can fight legendary bosses based on vitality
 * @param vitality - Character's vitality stat
 */
export function canFightLegendaryBoss(vitality: number): boolean {
  return vitality >= VITALITY_THRESHOLDS.LEGENDARY_BOSS_REQUIREMENT;
}

/**
 * Calculate passive HP regeneration per hour from vitality
 * @param vitality - Character's vitality stat
 */
export function calculateVitalityHPRegen(vitality: number): number {
  return vitality * VITALITY_THRESHOLDS.HP_REGEN_PER_POINT;
}
