// ══════════════════════════════════════════════════════════════════════════════
// LIFE OS — GAME CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

// Color System (Cyberpunk Theme)
export const COLORS = {
  bg: "#0a0d14",
  card: "#0f1219",
  cardHover: "#141924",
  border: "#1a1f2e",
  borderLight: "#252b3d",
  text: "#c8d3e0",
  textMuted: "#5a6478",
  textDim: "#3d4556",
  // Neon colors
  cyan: "#00d4ff",
  magenta: "#ff3d9a",
  green: "#00cc72",
  yellow: "#ffc832",
  red: "#ff4444",
  orange: "#ff8c32",
  purple: "#a855f7",
  gold: "#ffd700",
} as const;

// Area colors mapped to neons
export const AREA_COLORS = {
  WORK: COLORS.cyan,
  HOME: COLORS.magenta,
  WRITING: COLORS.green,
  SIDE_PROJECTS: COLORS.yellow,
} as const;

// Priority colors
export const PRIORITY_COLORS = {
  URGENT: COLORS.red,
  HIGH: COLORS.magenta,
  MEDIUM: COLORS.yellow,
  LOW: COLORS.textMuted,
  NONE: COLORS.textMuted,
} as const;

// XP rewards by priority
export const XP_REWARDS = {
  URGENT: 120,
  HIGH: 90,
  MEDIUM: 60,
  LOW: 30,
  NONE: 20,
} as const;

// Energy costs by priority
export const ENERGY_COSTS = {
  URGENT: 35,
  HIGH: 25,
  MEDIUM: 15,
  LOW: 10,
  NONE: 5,
} as const;

// Damage dealt to character by overdue task priority
export const OVERDUE_DAMAGE = {
  URGENT: 20,
  HIGH: 15,
  MEDIUM: 10,
  LOW: 5,
  NONE: 3,
} as const;

// Rarity colors and effects
export const RARITY_COLORS = {
  COMMON: COLORS.textMuted,
  RARE: COLORS.cyan,
  EPIC: COLORS.magenta,
  LEGENDARY: COLORS.gold,
} as const;

export const RARITY_GLOW = {
  COMMON: "none",
  RARE: `0 0 8px ${COLORS.cyan}60`,
  EPIC: `0 0 12px ${COLORS.magenta}60`,
  LEGENDARY: `0 0 16px ${COLORS.gold}80, 0 0 30px ${COLORS.gold}40`,
} as const;

// Streak multipliers
export const STREAK_MULTIPLIERS = [
  { min: 0, max: 2, mult: 1.0, label: "1x" },
  { min: 3, max: 6, mult: 1.25, label: "1.25x" },
  { min: 7, max: 13, mult: 1.5, label: "1.5x" },
  { min: 14, max: 29, mult: 1.75, label: "1.75x" },
  { min: 30, max: Infinity, mult: 2.0, label: "2x" },
] as const;

// Character class bonuses
export const CLASS_BONUSES = {
  WARRIOR: {
    name: "Warrior",
    icon: "⚔️",
    description: "Masters of work and discipline",
    xpBonus: { area: "WORK", multiplier: 1.25 },
    hpBonus: 20,
    energyBonus: 0,
    lootBonus: 0,
    streakProtection: 0,
  },
  MAGE: {
    name: "Mage",
    icon: "🔮",
    description: "Architects of innovation",
    xpBonus: { area: "SIDE_PROJECTS", multiplier: 1.25 },
    hpBonus: 0,
    energyBonus: 10, // Extra energy regen per day
    lootBonus: 0,
    streakProtection: 0,
  },
  ROGUE: {
    name: "Rogue",
    icon: "🗡️",
    description: "Masters of the home domain",
    xpBonus: { area: "HOME", multiplier: 1.25 },
    hpBonus: 0,
    energyBonus: 0,
    lootBonus: 0.15, // +15% loot drop rate
    streakProtection: 0,
  },
  BARD: {
    name: "Bard",
    icon: "🎭",
    description: "Weavers of words and stories",
    xpBonus: { area: "WRITING", multiplier: 1.25 },
    hpBonus: 0,
    energyBonus: 0,
    lootBonus: 0,
    streakProtection: 1, // +1 streak protection per week
  },
  DRUID: {
    name: "Druid",
    icon: "🌿",
    description: "Guardians of health and wellness",
    xpBonus: { area: "HEALTH", multiplier: 1.25 },
    hpBonus: 0,
    energyBonus: 0,
    lootBonus: 0,
    streakProtection: 0,
    hpRegenBonus: 0.25, // +25% HP regen from wellness
  },
  CLERIC: {
    name: "Cleric",
    icon: "✨",
    description: "Champions of community and connection",
    xpBonus: { area: "HOME", multiplier: 1.25 },
    hpBonus: 0,
    energyBonus: 0,
    lootBonus: 0,
    streakProtection: 0,
    guildHealingBonus: 0.20, // +20% healing from guild
  },
  NECROMANCER: {
    name: "Necromancer",
    icon: "💀",
    description: "Masters of forbidden knowledge",
    xpBonus: { area: "LEARNING", multiplier: 1.25 },
    hpBonus: 0,
    energyBonus: 0,
    lootBonus: 0,
    streakProtection: 0,
    deathPenaltyReduction: 0.50, // 50% reduced death penalty
  },
} as const;

// Level progression
export const LEVEL_UP_XP = (level: number): number => {
  // XP required to reach next level
  // Formula: 250 * (level ^ 1.5)
  return Math.floor(250 * Math.pow(level, 1.5));
};

// Base XP per level (constant for convenience)
export const XP_PER_LEVEL_BASE = 250;

// Rank titles by level
export const RANKS = [
  { level: 1, rank: "INIT PROCESS" },
  { level: 5, rank: "KERNEL AGENT" },
  { level: 10, rank: "SYSTEM OPERATOR" },
  { level: 15, rank: "DAEMON MASTER" },
  { level: 20, rank: "ROOT ADMIN" },
  { level: 25, rank: "NEXUS ARCHITECT" },
  { level: 30, rank: "LEGENDARY SYSADMIN" },
  { level: 40, rank: "LIFE OS MASTER" },
  { level: 50, rank: "TRANSCENDENT" },
] as const;

export const getRank = (level: number): string => {
  const rank = [...RANKS].reverse().find((r) => level >= r.level);
  return rank?.rank || "INIT PROCESS";
};

// Loot drop table for task completion
export const LOOT_TABLE = [
  {
    itemType: "XP_SHARD",
    name: "XP Shard",
    icon: "💠",
    effect: "+25 XP",
    rarity: "COMMON",
    chance: 30,
  },
  {
    itemType: "XP_CRYSTAL",
    name: "XP Crystal",
    icon: "💎",
    effect: "+75 XP",
    rarity: "RARE",
    chance: 15,
  },
  {
    itemType: "ENERGY_POTION",
    name: "Energy Potion",
    icon: "⚡",
    effect: "+25 Energy",
    rarity: "COMMON",
    chance: 20,
  },
  {
    itemType: "HEALTH_POTION",
    name: "Health Potion",
    icon: "❤️‍🩹",
    effect: "+25 HP",
    rarity: "COMMON",
    chance: 20,
  },
  {
    itemType: "STREAK_SHIELD",
    name: "Streak Shield",
    icon: "🛡️",
    effect: "Protect streak 1 day",
    rarity: "RARE",
    chance: 10,
  },
  {
    itemType: "DOUBLE_XP_TOKEN",
    name: "Double XP Token",
    icon: "⭐",
    effect: "Next task 2x XP",
    rarity: "EPIC",
    chance: 4,
  },
  {
    itemType: "BOSS_BANE",
    name: "Boss Bane",
    icon: "🗡️",
    effect: "50% extra boss damage",
    rarity: "LEGENDARY",
    chance: 1,
  },
  {
    itemType: "REVIVE_TOKEN",
    name: "Revive Token",
    icon: "💫",
    effect: "Skip death cooldown",
    rarity: "LEGENDARY",
    chance: 0.5,
  },
] as const;

// Boss damage calculation
export const BOSS_DAMAGE_PER_TASK = {
  URGENT: 25,
  HIGH: 20,
  MEDIUM: 15,
  LOW: 10,
  NONE: 5,
} as const;

// Character status thresholds
export const CHARACTER_THRESHOLDS = {
  DANGER_HP: 25, // Show warning below this HP
  CRITICAL_HP: 10, // Show critical warning
  LOW_ENERGY: 20, // Show energy warning
  BURNOUT_THRESHOLD: 0, // At 0 energy = exhausted state
  DEATH_THRESHOLD: 0, // At 0 HP = dead
  RESPAWN_COOLDOWN: 24 * 60 * 60 * 1000, // 24 hours in ms
  EMERGENCY_RESPAWN_TASKS: 3, // Complete 3 tasks to emergency respawn
} as const;

// Energy regeneration
export const ENERGY_REGEN = {
  BASE_DAILY: 20, // Base energy regenerated per day
  SLEEP_BONUS: 5, // Extra energy per hour of sleep (from health data)
  WORKOUT_BONUS: 10, // Extra energy from workout completion
  MAX_DAILY: 50, // Maximum energy regeneration per day
} as const;

// Safe daily energy expenditure (to prevent burnout warnings)
export const SAFE_DAILY_ENERGY = 60;

// HP regeneration from task completion
export const HP_REGEN_PER_TASK = {
  URGENT: 10,
  HIGH: 8,
  MEDIUM: 5,
  LOW: 3,
  NONE: 2,
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// EVENT REWARDS & PENALTIES
// ══════════════════════════════════════════════════════════════════════════════

// XP for completing action items by duration (minutes)
export const EVENT_XP = {
  XP_PER_30_MINS: 25,     // Base XP per 30 minute block
  MIN_XP: 15,              // Minimum XP for any event
  MAX_XP: 150,             // Maximum XP for a single event
} as const;

// HP penalty for missing/canceling events
export const EVENT_PENALTIES = {
  MISSED_BASE: 12,         // Base HP damage for missing an event
  CANCELED_SELF_BASE: 8,   // Base HP damage for self-canceling
  HP_PER_HOUR: 5,          // Additional HP damage per hour of event
  MAX_PENALTY: 25,         // Maximum HP penalty
} as const;

// Boss damage from completing project-linked events
export const EVENT_BOSS_DAMAGE = {
  DAMAGE_PER_30_MINS: 10,  // Boss damage per 30 minute block
  MIN_DAMAGE: 5,           // Minimum boss damage
  MAX_DAMAGE: 40,          // Maximum boss damage
} as const;

// HP restoration from completing events
export const EVENT_HP_REGEN = {
  BASE: 5,                 // Base HP restored
  PER_HOUR: 2,             // Additional HP per hour
  MAX: 15,                 // Maximum HP restored
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// STAT SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

// Stat points awarded per level
export const STAT_POINTS_PER_LEVEL = (level: number): number => {
  if (level <= 10) return 3;
  if (level <= 20) return 4;
  return 5;
};

// Stat effects per point invested
export const STAT_EFFECTS = {
  STRENGTH: {
    bossDamage: 1.5,        // +1.5 boss damage per point
    maxHP: 3,               // +3 max HP per point
  },
  STAMINA: {
    maxEnergy: 2,           // +2 max energy per point
    energyCostReduction: 0.01, // -1% energy cost per point
    energyRegen: 0.5,       // +0.5 energy regen per day per point
  },
  FOCUS: {
    xpBonus: 0.02,          // +2% XP on Deep Work/Learning/Reading per point
    maxMana: 2,             // +2 max mana per point
    lootCrit: 0.005,        // +0.5% loot crit chance per point
  },
  DISCIPLINE: {
    streakXPBonus: 0.015,   // +1.5% streak XP bonus per point
    habitXPBonus: 0.02,     // +2% habit bonus XP per point
    manaRegen: 0.5,         // +0.5 mana regen per hour per point
  },
  CHARISMA: {
    socialXPBonus: 0.02,    // +2% social XP per point
    guildXPContribution: 0.01, // +1% guild XP contribution per point
  },
} as const;

// Vitality thresholds and effects
export const VITALITY_THRESHOLDS = {
  LEGENDARY_BOSS_REQUIREMENT: 50, // Minimum vitality to fight legendary bosses
  HP_REGEN_PER_POINT: 0.5,        // +0.5 HP regen per hour per vitality point
} as const;

// Difficulty multipliers
export const DIFFICULTY_MULTIPLIERS = {
  CASUAL: 1.0,
  BALANCED: 1.25,
  HARDCORE: 1.5,
} as const;

// Gold rewards by priority
export const GOLD_REWARDS = {
  URGENT: 25,
  HIGH: 20,
  MEDIUM: 15,
  LOW: 10,
  NONE: 5,
} as const;

// Respec cost calculation
export const RESPEC_COST = (level: number): number => {
  return 500 * level;
};

// Inventory expansion configuration
export const INVENTORY_EXPANSION = {
  SLOTS_PER_PURCHASE: 5,
  BASE_COST: 500,
  COST_SCALING: 1.5,
  MAX_SLOTS: 50,
} as const;

