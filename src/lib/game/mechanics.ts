// ══════════════════════════════════════════════════════════════════════════════
// LIFE OS — GAME MECHANICS
// ══════════════════════════════════════════════════════════════════════════════

import {
  XP_REWARDS,
  ENERGY_COSTS,
  OVERDUE_DAMAGE,
  STREAK_MULTIPLIERS,
  CLASS_BONUSES,
  LEVEL_UP_XP,
  LOOT_TABLE,
  BOSS_DAMAGE_PER_TASK,
  HP_REGEN_PER_TASK,
  CHARACTER_THRESHOLDS,
  ENERGY_REGEN,
} from "./constants";

// Local type definitions (matches Prisma schema)
export type CharacterClass = "WARRIOR" | "MAGE" | "ROGUE" | "BARD";
export type Priority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
export type AreaType = "WORK" | "PERSONAL" | "HEALTH" | "LEARNING" | "CREATIVE" | "SOCIAL" | "FINANCE" | "HOME";
export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

// Types
export interface Character {
  id: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  currentStreak: number;
  class: CharacterClass;
  status: "ALIVE" | "DEAD" | "EXHAUSTED";
  diedAt: Date | null;
  tasksCompleted: number;
}

export interface LootDrop {
  itemType: string;
  name: string;
  icon: string;
  effect: string;
  rarity: Rarity;
}

export interface TaskCompletionResult {
  xpEarned: number;
  hpRestored: number;
  energySpent: number;
  bossDamage: number;
  leveledUp: boolean;
  newLevel?: number;
  lootDrop?: LootDrop;
  streakUpdated: boolean;
  comboMultiplier: number;
}

// ── XP Calculations ──────────────────────────────────────────────────────────

export function getBaseXP(priority: Priority): number {
  return XP_REWARDS[priority] || XP_REWARDS.MEDIUM;
}

export function getStreakMultiplier(streak: number): number {
  const tier = STREAK_MULTIPLIERS.find((s) => streak >= s.min && streak <= s.max);
  return tier?.mult || 1.0;
}

export function getClassXPMultiplier(
  characterClass: CharacterClass,
  taskArea: AreaType
): number {
  const bonus = CLASS_BONUSES[characterClass];
  if (bonus.xpBonus.area === taskArea) {
    return bonus.xpBonus.multiplier;
  }
  return 1.0;
}

export function calculateXP(
  priority: Priority,
  characterClass: CharacterClass,
  taskArea: AreaType,
  streak: number,
  comboCount: number,
  hasDoubleXPToken: boolean = false
): number {
  const baseXP = getBaseXP(priority);
  const streakMult = getStreakMultiplier(streak);
  const classMult = getClassXPMultiplier(characterClass, taskArea);
  
  // Combo bonus: +5% per task completed today (max 50%)
  const comboMult = 1 + Math.min(comboCount * 0.05, 0.5);
  
  // Double XP token
  const tokenMult = hasDoubleXPToken ? 2 : 1;
  
  return Math.floor(baseXP * streakMult * classMult * comboMult * tokenMult);
}

// ── Energy System ────────────────────────────────────────────────────────────

export function getEnergyCost(priority: Priority): number {
  return ENERGY_COSTS[priority] || ENERGY_COSTS.MEDIUM;
}

export function canAffordTask(currentEnergy: number, priority: Priority): boolean {
  return currentEnergy >= getEnergyCost(priority);
}

export function calculateDailyEnergyLoad(
  tasks: Array<{ priority: Priority }>
): number {
  return tasks.reduce((total, task) => total + getEnergyCost(task.priority), 0);
}

export function isBurnoutRisk(dailyEnergyLoad: number): boolean {
  return dailyEnergyLoad > 60; // SAFE_DAILY_ENERGY
}

export function calculateEnergyRegen(
  baseRegen: number,
  sleepHours: number = 0,
  didWorkout: boolean = false
): number {
  let regen = baseRegen;
  
  // Sleep bonus
  if (sleepHours >= 7) {
    regen += ENERGY_REGEN.SLEEP_BONUS * (sleepHours - 6); // Bonus for each hour over 6
  }
  
  // Workout bonus
  if (didWorkout) {
    regen += ENERGY_REGEN.WORKOUT_BONUS;
  }
  
  // Cap at max daily
  return Math.min(regen, ENERGY_REGEN.MAX_DAILY);
}

// ── HP System ────────────────────────────────────────────────────────────────

export function getHPRegen(priority: Priority): number {
  return HP_REGEN_PER_TASK[priority] || HP_REGEN_PER_TASK.MEDIUM;
}

export function getOverdueDamage(priority: Priority): number {
  return OVERDUE_DAMAGE[priority] || OVERDUE_DAMAGE.MEDIUM;
}

export function calculateOverdueDamage(
  overdueTasks: Array<{ priority: Priority }>
): number {
  return overdueTasks.reduce((total, task) => total + getOverdueDamage(task.priority), 0);
}

export function isCharacterCritical(hp: number): boolean {
  return hp <= CHARACTER_THRESHOLDS.CRITICAL_HP;
}

export function isCharacterInDanger(hp: number): boolean {
  return hp <= CHARACTER_THRESHOLDS.DANGER_HP;
}

export function canRespawn(diedAt: Date | null): boolean {
  if (!diedAt) return true;
  const cooldownEnd = new Date(diedAt.getTime() + CHARACTER_THRESHOLDS.RESPAWN_COOLDOWN);
  return new Date() >= cooldownEnd;
}

export function getRespawnTimeRemaining(diedAt: Date): number {
  const cooldownEnd = new Date(diedAt.getTime() + CHARACTER_THRESHOLDS.RESPAWN_COOLDOWN);
  return Math.max(0, cooldownEnd.getTime() - new Date().getTime());
}

// ── Level System ─────────────────────────────────────────────────────────────

export function checkLevelUp(currentXP: number, currentLevel: number): {
  leveledUp: boolean;
  newLevel: number;
  remainingXP: number;
  xpToNext: number;
} {
  let level = currentLevel;
  let xp = currentXP;
  let leveledUp = false;
  
  while (xp >= LEVEL_UP_XP(level)) {
    xp -= LEVEL_UP_XP(level);
    level++;
    leveledUp = true;
  }
  
  return {
    leveledUp,
    newLevel: level,
    remainingXP: xp,
    xpToNext: LEVEL_UP_XP(level),
  };
}

// ── Loot System ──────────────────────────────────────────────────────────────

export function rollForLoot(
  characterClass: CharacterClass,
  taskPriority: Priority
): LootDrop | null {
  // Higher priority = higher loot chance
  const priorityBonus = {
    URGENT: 1.5,
    HIGH: 1.25,
    MEDIUM: 1.0,
    LOW: 0.75,
    NONE: 0.5,
  };
  
  // Class loot bonus (Rogue)
  const classBonus = CLASS_BONUSES[characterClass]?.lootBonus || 0;
  
  const totalMultiplier = (priorityBonus[taskPriority] || 1.0) * (1 + classBonus);
  
  // Roll for each loot type
  for (const loot of LOOT_TABLE) {
    const adjustedChance = loot.chance * totalMultiplier;
    const roll = Math.random() * 100;
    
    if (roll < adjustedChance) {
      return {
        itemType: loot.itemType,
        name: loot.name,
        icon: loot.icon,
        effect: loot.effect,
        rarity: loot.rarity as Rarity,
      };
    }
  }
  
  return null;
}

// ── Boss System ──────────────────────────────────────────────────────────────

export function getBossDamage(priority: Priority, hasBossBane: boolean = false): number {
  const baseDamage = BOSS_DAMAGE_PER_TASK[priority] || BOSS_DAMAGE_PER_TASK.MEDIUM;
  return hasBossBane ? Math.floor(baseDamage * 1.5) : baseDamage;
}

// HP increase when a task is added to a project (boss grows stronger)
export function getBossHPIncrease(priority: Priority): number {
  return BOSS_DAMAGE_PER_TASK[priority] || BOSS_DAMAGE_PER_TASK.MEDIUM;
}

export function isBossDefeated(currentHP: number, damageDealt: number): boolean {
  return currentHP - damageDealt <= 0;
}

// ── Streak System ────────────────────────────────────────────────────────────

export function shouldBreakStreak(lastActiveAt: Date): boolean {
  const now = new Date();
  const lastActive = new Date(lastActiveAt);
  
  // Streak breaks if more than 1 calendar day has passed
  const daysSince = Math.floor(
    (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSince > 1;
}

export function canProtectStreak(streakProtection: number): boolean {
  return streakProtection > 0;
}

// ── Complete Task Handler ────────────────────────────────────────────────────

export function processTaskCompletion(
  character: Character,
  taskPriority: Priority,
  taskArea: AreaType,
  comboCount: number,
  hasBoss: boolean = false,
  hasDoubleXPToken: boolean = false,
  hasBossBane: boolean = false
): TaskCompletionResult {
  // Calculate XP
  const xpEarned = calculateXP(
    taskPriority,
    character.class,
    taskArea,
    character.currentStreak,
    comboCount,
    hasDoubleXPToken
  );
  
  // Calculate HP restoration
  const hpRestored = getHPRegen(taskPriority);
  
  // Calculate energy spent
  const energySpent = getEnergyCost(taskPriority);
  
  // Calculate boss damage if applicable
  const bossDamage = hasBoss ? getBossDamage(taskPriority, hasBossBane) : 0;
  
  // Check for level up
  const levelResult = checkLevelUp(character.xp + xpEarned, character.level);
  
  // Roll for loot
  const lootDrop = rollForLoot(character.class, taskPriority);
  
  // Streak update check
  const today = new Date().toDateString();
  const lastActive = new Date(character.diedAt || new Date()).toDateString();
  const streakUpdated = today !== lastActive;
  
  return {
    xpEarned,
    hpRestored,
    energySpent,
    bossDamage,
    leveledUp: levelResult.leveledUp,
    newLevel: levelResult.leveledUp ? levelResult.newLevel : undefined,
    lootDrop: lootDrop || undefined,
    streakUpdated,
    comboMultiplier: 1 + Math.min(comboCount * 0.05, 0.5),
  };
}

// ── Daily Challenge Generators ───────────────────────────────────────────────

export type ChallengeType =
  | "COMPLETE_TASKS"
  | "HIGH_PRIORITY"
  | "DEFEAT_BOSS"
  | "WORKOUT"
  | "WRITING"
  | "MULTI_AREA"
  | "EARLY_BIRD"
  | "NIGHT_OWL";

export interface DailyChallengeTemplate {
  type: ChallengeType;
  description: string;
  target: number;
  xpReward: number;
}

export function generateDailyChallenges(): DailyChallengeTemplate[] {
  const allChallenges: DailyChallengeTemplate[] = [
    { type: "COMPLETE_TASKS", description: "Complete 5 tasks", target: 5, xpReward: 100 },
    { type: "HIGH_PRIORITY", description: "Complete a high-priority task", target: 1, xpReward: 75 },
    { type: "DEFEAT_BOSS", description: "Deal damage to a boss", target: 1, xpReward: 150 },
    { type: "WORKOUT", description: "Complete a workout", target: 1, xpReward: 75 },
    { type: "WRITING", description: "Write 500 words", target: 500, xpReward: 100 },
    { type: "MULTI_AREA", description: "Complete tasks in 3 areas", target: 3, xpReward: 125 },
    { type: "EARLY_BIRD", description: "Complete a task before 8am", target: 1, xpReward: 75 },
    { type: "NIGHT_OWL", description: "Complete a task after 10pm", target: 1, xpReward: 75 },
  ];
  
  // Shuffle and pick 3
  const shuffled = allChallenges.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// ── API Convenience Aliases ──────────────────────────────────────────────────

// Alias for getBaseXP
export function calculateXPReward(priority: Priority, streakMultiplier: number = 1): number {
  return Math.floor(getBaseXP(priority) * streakMultiplier);
}

// Alias for rollForLoot
export function generateLootDrop(priority: Priority): {
  name: string;
  description: string;
  rarity: Rarity;
  type: string;
  icon: string;
} | null {
  const loot = rollForLoot("WARRIOR", priority);
  if (!loot) return null;
  
  return {
    name: loot.name,
    description: loot.effect,
    rarity: loot.rarity,
    type: loot.itemType,
    icon: loot.icon,
  };
}

// Alias for getBossDamage
export function calculateBossDamage(priority: Priority): number {
  return getBossDamage(priority);
}

// HP regeneration for time-based recovery
export function regenerateHP(character: { currentHP: number; maxHP: number }): number {
  // Regenerate 5 HP per 30-minute period
  const regenAmount = 5;
  return Math.min(regenAmount, character.maxHP - character.currentHP);
}

// Energy regeneration for time-based recovery
export function regenerateEnergy(character: { currentEnergy: number; maxEnergy: number }): number {
  // Regenerate 10 energy per 15-minute period
  const regenAmount = 10;
  return Math.min(regenAmount, character.maxEnergy - character.currentEnergy);
}

// Update streak based on last activity
export function updateStreak(lastTaskCompletedAt: Date | null, now: Date, currentStreak: number): number {
  if (!lastTaskCompletedAt) return 1;
  
  const lastDate = new Date(lastTaskCompletedAt);
  const today = new Date(now);
  
  // Reset time to midnight for comparison
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    // Same day - streak unchanged
    return currentStreak;
  } else if (daysDiff === 1) {
    // Consecutive day - increment streak
    return currentStreak + 1;
  } else {
    // Streak broken - reset to 1
    return 1;
  }
}

// Get class bonus multiplier
export function getClassBonus(characterClass: CharacterClass, priority: Priority): number {
  const classData = CLASS_BONUSES[characterClass];
  if (!classData) return 1;
  
  // Warriors get bonus on URGENT/HIGH tasks
  if (characterClass === "WARRIOR" && (priority === "URGENT" || priority === "HIGH")) {
    return 1.1;
  }
  
  return 1;
}
