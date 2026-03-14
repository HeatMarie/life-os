// ══════════════════════════════════════════════════════════════════════════════
// LIFE OS — ABILITY SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

import { CharacterClass } from "./mechanics";

// ══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

export type TaskType =
  | "DEEP_WORK"
  | "MEETING"
  | "APPOINTMENT"
  | "SOCIAL"
  | "ERRAND"
  | "ROUTINE"
  | "ADMIN"
  | "CREATIVE"
  | "LEARNING"
  | "OTHER";

export type TriggerType = TaskType | "STREAK" | "DAILY_GOAL" | "BOSS_DEFEAT" | "HP_THRESHOLD" | "DEATH" | "ANY";

export type EffectType =
  | "DAMAGE"
  | "HEAL"
  | "ENERGY_RESTORE"
  | "XP_MULTIPLIER"
  | "DAMAGE_REDUCTION"
  | "BLOCK_ATTACK"
  | "BUFF"
  | "DEBUFF"
  | "AOE_DAMAGE"
  | "LOOT_BONUS"
  | "REMOVE_PENALTY"
  | "STAT_SCALING"
  | "GUILD_EFFECT";

export interface TriggerCondition {
  type: "task_count" | "task_priority" | "streak_days" | "hp_percent" | "task_timing" | "task_areas" | "word_count" | "milestone" | "death_count";
  value: number | string;
  operator?: ">" | "<" | "=" | ">=" | "<=";
  timeframe?: "hour" | "day" | "week";
}

export interface AbilityEffects {
  bossDamage?: number;
  hpHeal?: number;
  energyRestore?: number;
  xpMultiplier?: number;
  damageReduction?: number;
  durationHours?: number;
  durationTasks?: number;
  blockNextAttack?: boolean;
  affectsGuild?: boolean;
  statScaling?: {
    stat: "STR" | "STA" | "FOC" | "DIS" | "CHA";
    multiplier: number;
  };
  lootCritMultiplier?: number;
  guaranteedGold?: number;
  dodgeAttack?: boolean;
  removePenalty?: boolean;
  guildBuffPercent?: number;
  hotTasks?: number;
  skipBossAttack?: boolean;
  immunityNextAttack?: boolean;
  convertPenaltyToHealing?: boolean;
  autoRevive?: boolean;
  lifestealPercent?: number;
  absorbDamage?: number;
  reviveHpPercent?: number;
  sacrificeHpPercent?: number;
  permanentDamageBonus?: number;
}

export interface Ability {
  id: string;
  classRequired: CharacterClass;
  name: string;
  description: string;
  icon: string;
  unlockLevel: 1 | 3 | 5 | 8 | 12 | 15;
  triggerType: TriggerType;
  triggerCondition?: TriggerCondition;
  effectType: EffectType;
  effects: AbilityEffects;
  cooldownHours: number; // Balanced mode
  manaCost: number; // Hardcore mode
  overchargeCost: number;
  overchargeMultiplier: number;
  secondaryClassEfficiency: number; // 0.75 for secondary class
}

// ══════════════════════════════════════════════════════════════════════════════
// ABILITY DEFINITIONS (42 Total: 7 Classes × 6 Abilities)
// ══════════════════════════════════════════════════════════════════════════════

export const ABILITIES: Ability[] = [
  // ════════════════════════════════════════════════════════════════════════════
  // WARRIOR (6 abilities)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "warrior_power_strike",
    classRequired: "WARRIOR",
    name: "Power Strike",
    description: "Deal heavy STR-scaled damage to the boss when completing Work tasks",
    icon: "⚔️",
    unlockLevel: 1,
    triggerType: "DEEP_WORK",
    effectType: "STAT_SCALING",
    effects: {
      bossDamage: 30,
      statScaling: { stat: "STR", multiplier: 1.5 },
    },
    cooldownHours: 0, // No cooldown, triggers on every Work task
    manaCost: 15,
    overchargeCost: 30,
    overchargeMultiplier: 2.0,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "warrior_battle_cry",
    classRequired: "WARRIOR",
    name: "Battle Cry",
    description: "Completing Urgent or High priority tasks grants +15% damage bonus to next 2 abilities",
    icon: "📢",
    unlockLevel: 3,
    triggerType: "ANY",
    triggerCondition: { type: "task_priority", value: "URGENT,HIGH" },
    effectType: "BUFF",
    effects: {
      xpMultiplier: 1.15,
      durationTasks: 2,
    },
    cooldownHours: 4,
    manaCost: 20,
    overchargeCost: 40,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "warrior_iron_will",
    classRequired: "WARRIOR",
    name: "Iron Will",
    description: "Completing a task before its deadline blocks the next boss attack",
    icon: "🛡️",
    unlockLevel: 5,
    triggerType: "ANY",
    triggerCondition: { type: "task_timing", value: "before_deadline" },
    effectType: "BLOCK_ATTACK",
    effects: {
      blockNextAttack: true,
    },
    cooldownHours: 12,
    manaCost: 25,
    overchargeCost: 50,
    overchargeMultiplier: 1.0,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "warrior_berserker_rage",
    classRequired: "WARRIOR",
    name: "Berserker Rage",
    description: "After completing 5+ tasks in a day, deal 2x damage for 2 hours",
    icon: "💢",
    unlockLevel: 8,
    triggerType: "DAILY_GOAL",
    triggerCondition: { type: "task_count", value: 5, operator: ">=", timeframe: "day" },
    effectType: "BUFF",
    effects: {
      bossDamage: 2.0,
      durationHours: 2,
    },
    cooldownHours: 24,
    manaCost: 40,
    overchargeCost: 80,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "warrior_shield_wall",
    classRequired: "WARRIOR",
    name: "Shield Wall",
    description: "With a 7+ day streak, reduce all damage taken by 50% for 24 hours",
    icon: "🛡️",
    unlockLevel: 12,
    triggerType: "STREAK",
    triggerCondition: { type: "streak_days", value: 7, operator: ">=" },
    effectType: "DAMAGE_REDUCTION",
    effects: {
      damageReduction: 0.5,
      durationHours: 24,
    },
    cooldownHours: 72,
    manaCost: 50,
    overchargeCost: 100,
    overchargeMultiplier: 1.3,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "warrior_titans_fury",
    classRequired: "WARRIOR",
    name: "Titan's Fury",
    description: "After completing all Work tasks for the day, deal AoE damage to all active bosses",
    icon: "⚡",
    unlockLevel: 15,
    triggerType: "DAILY_GOAL",
    triggerCondition: { type: "task_areas", value: "WORK_COMPLETE" },
    effectType: "AOE_DAMAGE",
    effects: {
      bossDamage: 100,
      affectsGuild: true,
    },
    cooldownHours: 48,
    manaCost: 75,
    overchargeCost: 150,
    overchargeMultiplier: 2.0,
    secondaryClassEfficiency: 0.75,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // MAGE (6 abilities)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "mage_arcane_bolt",
    classRequired: "MAGE",
    name: "Arcane Bolt",
    description: "Deal Focus-scaled damage when completing Side Project tasks",
    icon: "🔮",
    unlockLevel: 1,
    triggerType: "CREATIVE",
    effectType: "STAT_SCALING",
    effects: {
      bossDamage: 25,
      statScaling: { stat: "FOC", multiplier: 1.8 },
    },
    cooldownHours: 0,
    manaCost: 12,
    overchargeCost: 24,
    overchargeMultiplier: 2.0,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "mage_mana_shield",
    classRequired: "MAGE",
    name: "Mana Shield",
    description: "During a Learning session, absorb the next instance of damage",
    icon: "✨",
    unlockLevel: 3,
    triggerType: "LEARNING",
    effectType: "BLOCK_ATTACK",
    effects: {
      absorbDamage: 50,
    },
    cooldownHours: 8,
    manaCost: 20,
    overchargeCost: 40,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "mage_time_warp",
    classRequired: "MAGE",
    name: "Time Warp",
    description: "Completing a task 24+ hours early extends all deadlines by 12 hours",
    icon: "⏰",
    unlockLevel: 5,
    triggerType: "ANY",
    triggerCondition: { type: "task_timing", value: "24h_early" },
    effectType: "BUFF",
    effects: {
      durationHours: 12,
    },
    cooldownHours: 48,
    manaCost: 35,
    overchargeCost: 70,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "mage_chain_lightning",
    classRequired: "MAGE",
    name: "Chain Lightning",
    description: "Completing tasks in 3+ different areas deals damage to all active bosses",
    icon: "⚡",
    unlockLevel: 8,
    triggerType: "DAILY_GOAL",
    triggerCondition: { type: "task_areas", value: 3, operator: ">=" },
    effectType: "AOE_DAMAGE",
    effects: {
      bossDamage: 60,
    },
    cooldownHours: 24,
    manaCost: 45,
    overchargeCost: 90,
    overchargeMultiplier: 1.8,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "mage_arcane_intellect",
    classRequired: "MAGE",
    name: "Arcane Intellect",
    description: "After completing 90+ minutes of Deep Work, gain 2x XP on the next task",
    icon: "🧠",
    unlockLevel: 12,
    triggerType: "DEEP_WORK",
    triggerCondition: { type: "task_timing", value: "90min" },
    effectType: "XP_MULTIPLIER",
    effects: {
      xpMultiplier: 2.0,
      durationTasks: 1,
    },
    cooldownHours: 12,
    manaCost: 55,
    overchargeCost: 110,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "mage_meteor_storm",
    classRequired: "MAGE",
    name: "Meteor Storm",
    description: "Completing all daily challenges deals massive damage to all bosses",
    icon: "☄️",
    unlockLevel: 15,
    triggerType: "DAILY_GOAL",
    triggerCondition: { type: "milestone", value: "all_challenges" },
    effectType: "AOE_DAMAGE",
    effects: {
      bossDamage: 150,
      affectsGuild: true,
    },
    cooldownHours: 48,
    manaCost: 80,
    overchargeCost: 160,
    overchargeMultiplier: 2.0,
    secondaryClassEfficiency: 0.75,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ROGUE (6 abilities)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "rogue_backstab",
    classRequired: "ROGUE",
    name: "Backstab",
    description: "Completing Home tasks guarantees a loot critical strike",
    icon: "🗡️",
    unlockLevel: 1,
    triggerType: "ERRAND",
    effectType: "LOOT_BONUS",
    effects: {
      bossDamage: 20,
      lootCritMultiplier: 2.0,
    },
    cooldownHours: 0,
    manaCost: 10,
    overchargeCost: 20,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "rogue_pickpocket",
    classRequired: "ROGUE",
    name: "Pickpocket",
    description: "Completing Errand tasks grants guaranteed bonus gold",
    icon: "💰",
    unlockLevel: 3,
    triggerType: "ERRAND",
    effectType: "LOOT_BONUS",
    effects: {
      guaranteedGold: 50,
    },
    cooldownHours: 6,
    manaCost: 15,
    overchargeCost: 30,
    overchargeMultiplier: 2.0,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "rogue_evasion",
    classRequired: "ROGUE",
    name: "Evasion",
    description: "Completing 3 tasks within 2 hours allows you to dodge the next boss attack",
    icon: "💨",
    unlockLevel: 5,
    triggerType: "DAILY_GOAL",
    triggerCondition: { type: "task_count", value: 3, operator: ">=", timeframe: "hour" },
    effectType: "BLOCK_ATTACK",
    effects: {
      dodgeAttack: true,
    },
    cooldownHours: 16,
    manaCost: 25,
    overchargeCost: 50,
    overchargeMultiplier: 1.0,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "rogue_shadow_step",
    classRequired: "ROGUE",
    name: "Shadow Step",
    description: "Completing an overdue task removes all associated penalties",
    icon: "🌑",
    unlockLevel: 8,
    triggerType: "ANY",
    triggerCondition: { type: "task_timing", value: "overdue" },
    effectType: "REMOVE_PENALTY",
    effects: {
      removePenalty: true,
      hpHeal: 20,
    },
    cooldownHours: 24,
    manaCost: 35,
    overchargeCost: 70,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "rogue_blade_flurry",
    classRequired: "ROGUE",
    name: "Blade Flurry",
    description: "Rapidly completing 3+ Low/Medium tasks grants bonus damage as if they were High priority",
    icon: "🌪️",
    unlockLevel: 12,
    triggerType: "DAILY_GOAL",
    triggerCondition: { type: "task_count", value: 3, operator: ">=", timeframe: "day" },
    effectType: "BUFF",
    effects: {
      bossDamage: 80,
    },
    cooldownHours: 20,
    manaCost: 45,
    overchargeCost: 90,
    overchargeMultiplier: 1.8,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "rogue_assassinate",
    classRequired: "ROGUE",
    name: "Assassinate",
    description: "Completing a final project task deals 3x damage to the boss",
    icon: "💀",
    unlockLevel: 15,
    triggerType: "ANY",
    triggerCondition: { type: "milestone", value: "final_task" },
    effectType: "DAMAGE",
    effects: {
      bossDamage: 200,
    },
    cooldownHours: 96,
    manaCost: 70,
    overchargeCost: 140,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // BARD (6 abilities)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "bard_inspiring_verse",
    classRequired: "BARD",
    name: "Inspiring Verse",
    description: "Writing tasks heal HP and deal light damage to the boss",
    icon: "📝",
    unlockLevel: 1,
    triggerType: "CREATIVE",
    effectType: "HEAL",
    effects: {
      hpHeal: 15,
      bossDamage: 15,
    },
    cooldownHours: 0,
    manaCost: 12,
    overchargeCost: 24,
    overchargeMultiplier: 1.8,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "bard_song_of_rest",
    classRequired: "BARD",
    name: "Song of Rest",
    description: "Writing 500+ words restores energy",
    icon: "🎵",
    unlockLevel: 3,
    triggerType: "CREATIVE",
    triggerCondition: { type: "word_count", value: 500, operator: ">=" },
    effectType: "ENERGY_RESTORE",
    effects: {
      energyRestore: 30,
    },
    cooldownHours: 8,
    manaCost: 20,
    overchargeCost: 40,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "bard_rallying_cry",
    classRequired: "BARD",
    name: "Rallying Cry",
    description: "Social tasks grant +10% buff to all guild members",
    icon: "📯",
    unlockLevel: 5,
    triggerType: "SOCIAL",
    effectType: "GUILD_EFFECT",
    effects: {
      guildBuffPercent: 0.10,
      affectsGuild: true,
    },
    cooldownHours: 12,
    manaCost: 30,
    overchargeCost: 60,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "bard_epic_ballad",
    classRequired: "BARD",
    name: "Epic Ballad",
    description: "Maintaining a 3+ day writing streak grants +20% XP for 24 hours",
    icon: "🎭",
    unlockLevel: 8,
    triggerType: "STREAK",
    triggerCondition: { type: "streak_days", value: 3, operator: ">=", timeframe: "day" },
    effectType: "XP_MULTIPLIER",
    effects: {
      xpMultiplier: 1.20,
      durationHours: 24,
    },
    cooldownHours: 48,
    manaCost: 40,
    overchargeCost: 80,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "bard_charm_monster",
    classRequired: "BARD",
    name: "Charm Monster",
    description: "Completing Creative + Social tasks on the same day reduces boss attack by 40%",
    icon: "💫",
    unlockLevel: 12,
    triggerType: "DAILY_GOAL",
    triggerCondition: { type: "task_areas", value: "CREATIVE,SOCIAL" },
    effectType: "DEBUFF",
    effects: {
      damageReduction: 0.40,
      durationHours: 24,
    },
    cooldownHours: 36,
    manaCost: 50,
    overchargeCost: 100,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "bard_magnum_opus",
    classRequired: "BARD",
    name: "Magnum Opus",
    description: "Reaching a word count milestone grants massive XP + Epic loot",
    icon: "👑",
    unlockLevel: 15,
    triggerType: "CREATIVE",
    triggerCondition: { type: "milestone", value: "word_milestone" },
    effectType: "XP_MULTIPLIER",
    effects: {
      xpMultiplier: 3.0,
      lootCritMultiplier: 5.0,
    },
    cooldownHours: 168,
    manaCost: 75,
    overchargeCost: 150,
    overchargeMultiplier: 2.0,
    secondaryClassEfficiency: 0.75,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // DRUID (6 abilities)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "druid_shapeshift",
    classRequired: "DRUID",
    name: "Shapeshift",
    description: "Workout tasks deal moderate damage and grant temporary damage resistance",
    icon: "🐻",
    unlockLevel: 1,
    triggerType: "ROUTINE",
    effectType: "DAMAGE",
    effects: {
      bossDamage: 25,
      damageReduction: 0.20,
      durationHours: 4,
    },
    cooldownHours: 0,
    manaCost: 15,
    overchargeCost: 30,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "druid_regrowth",
    classRequired: "DRUID",
    name: "Regrowth",
    description: "Wellness tasks heal HP and provide healing over time for the next 3 tasks",
    icon: "🌱",
    unlockLevel: 3,
    triggerType: "ROUTINE",
    effectType: "HEAL",
    effects: {
      hpHeal: 20,
      hotTasks: 3,
    },
    cooldownHours: 6,
    manaCost: 20,
    overchargeCost: 40,
    overchargeMultiplier: 1.8,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "druid_entangling_roots",
    classRequired: "DRUID",
    name: "Entangling Roots",
    description: "Completing a task ahead of deadline causes the boss to skip its next attack",
    icon: "🌿",
    unlockLevel: 5,
    triggerType: "ANY",
    triggerCondition: { type: "task_timing", value: "before_deadline" },
    effectType: "BLOCK_ATTACK",
    effects: {
      skipBossAttack: true,
    },
    cooldownHours: 24,
    manaCost: 30,
    overchargeCost: 60,
    overchargeMultiplier: 1.0,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "druid_wrath_of_nature",
    classRequired: "DRUID",
    name: "Wrath of Nature",
    description: "Deep Work sessions deal heavy damage to the boss",
    icon: "⚡",
    unlockLevel: 8,
    triggerType: "DEEP_WORK",
    effectType: "DAMAGE",
    effects: {
      bossDamage: 80,
    },
    cooldownHours: 8,
    manaCost: 40,
    overchargeCost: 80,
    overchargeMultiplier: 2.0,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "druid_tranquility",
    classRequired: "DRUID",
    name: "Tranquility",
    description: "With a 7+ day streak, fully heal all guild members",
    icon: "☮️",
    unlockLevel: 12,
    triggerType: "STREAK",
    triggerCondition: { type: "streak_days", value: 7, operator: ">=" },
    effectType: "GUILD_EFFECT",
    effects: {
      hpHeal: 999,
      affectsGuild: true,
    },
    cooldownHours: 96,
    manaCost: 60,
    overchargeCost: 120,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "druid_tree_of_life",
    classRequired: "DRUID",
    name: "Tree of Life",
    description: "Completing ALL daily habits grants massive heal + shield + damage",
    icon: "🌳",
    unlockLevel: 15,
    triggerType: "DAILY_GOAL",
    triggerCondition: { type: "milestone", value: "all_habits" },
    effectType: "HEAL",
    effects: {
      hpHeal: 100,
      absorbDamage: 50,
      bossDamage: 100,
      affectsGuild: true,
    },
    cooldownHours: 48,
    manaCost: 80,
    overchargeCost: 160,
    overchargeMultiplier: 2.0,
    secondaryClassEfficiency: 0.75,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // CLERIC (6 abilities)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "cleric_holy_light",
    classRequired: "CLERIC",
    name: "Holy Light",
    description: "Social/Meeting tasks heal HP and deal light damage",
    icon: "✨",
    unlockLevel: 1,
    triggerType: "SOCIAL",
    effectType: "HEAL",
    effects: {
      hpHeal: 20,
      bossDamage: 12,
    },
    cooldownHours: 0,
    manaCost: 12,
    overchargeCost: 24,
    overchargeMultiplier: 1.8,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "cleric_blessing",
    classRequired: "CLERIC",
    name: "Blessing",
    description: "Guild shared tasks grant +20% buff to the target player",
    icon: "🙏",
    unlockLevel: 3,
    triggerType: "SOCIAL",
    triggerCondition: { type: "milestone", value: "guild_shared" },
    effectType: "BUFF",
    effects: {
      guildBuffPercent: 0.20,
    },
    cooldownHours: 12,
    manaCost: 25,
    overchargeCost: 50,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "cleric_divine_shield",
    classRequired: "CLERIC",
    name: "Divine Shield",
    description: "Appointment tasks grant immunity to the next boss attack",
    icon: "🛡️",
    unlockLevel: 5,
    triggerType: "APPOINTMENT",
    effectType: "BLOCK_ATTACK",
    effects: {
      immunityNextAttack: true,
    },
    cooldownHours: 16,
    manaCost: 30,
    overchargeCost: 60,
    overchargeMultiplier: 1.0,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "cleric_prayer_of_healing",
    classRequired: "CLERIC",
    name: "Prayer of Healing",
    description: "Completing tasks in 2+ different areas heals all guild members",
    icon: "💫",
    unlockLevel: 8,
    triggerType: "DAILY_GOAL",
    triggerCondition: { type: "task_areas", value: 2, operator: ">=" },
    effectType: "GUILD_EFFECT",
    effects: {
      hpHeal: 40,
      affectsGuild: true,
    },
    cooldownHours: 24,
    manaCost: 45,
    overchargeCost: 90,
    overchargeMultiplier: 1.8,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "cleric_atonement",
    classRequired: "CLERIC",
    name: "Atonement",
    description: "Completing an overdue task converts the HP penalty into healing",
    icon: "⚖️",
    unlockLevel: 12,
    triggerType: "ANY",
    triggerCondition: { type: "task_timing", value: "overdue" },
    effectType: "HEAL",
    effects: {
      convertPenaltyToHealing: true,
      hpHeal: 50,
    },
    cooldownHours: 36,
    manaCost: 55,
    overchargeCost: 110,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "cleric_guardian_angel",
    classRequired: "CLERIC",
    name: "Guardian Angel",
    description: "With a 14+ day streak, gain auto-revive (triggers once per week)",
    icon: "👼",
    unlockLevel: 15,
    triggerType: "DEATH",
    triggerCondition: { type: "streak_days", value: 14, operator: ">=" },
    effectType: "HEAL",
    effects: {
      autoRevive: true,
      reviveHpPercent: 0.50,
    },
    cooldownHours: 168,
    manaCost: 75,
    overchargeCost: 150,
    overchargeMultiplier: 1.0,
    secondaryClassEfficiency: 0.75,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // NECROMANCER (6 abilities)
  // ════════════════════════════════════════════════════════════════════════════
  {
    id: "necromancer_drain_life",
    classRequired: "NECROMANCER",
    name: "Drain Life",
    description: "Learning tasks deal damage and heal for 50% of damage dealt",
    icon: "💀",
    unlockLevel: 1,
    triggerType: "LEARNING",
    effectType: "DAMAGE",
    effects: {
      bossDamage: 30,
      lifestealPercent: 0.50,
    },
    cooldownHours: 0,
    manaCost: 15,
    overchargeCost: 30,
    overchargeMultiplier: 2.0,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "necromancer_bone_shield",
    classRequired: "NECROMANCER",
    name: "Bone Shield",
    description: "Admin tasks grant a shield that absorbs damage",
    icon: "🦴",
    unlockLevel: 3,
    triggerType: "ADMIN",
    effectType: "BLOCK_ATTACK",
    effects: {
      absorbDamage: 40,
    },
    cooldownHours: 8,
    manaCost: 20,
    overchargeCost: 40,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "necromancer_raise_dead",
    classRequired: "NECROMANCER",
    name: "Raise Dead",
    description: "Revive from death with 50% HP instead of 25%",
    icon: "⚰️",
    unlockLevel: 5,
    triggerType: "DEATH",
    effectType: "HEAL",
    effects: {
      reviveHpPercent: 0.50,
    },
    cooldownHours: 48,
    manaCost: 40,
    overchargeCost: 80,
    overchargeMultiplier: 1.3,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "necromancer_soul_harvest",
    classRequired: "NECROMANCER",
    name: "Soul Harvest",
    description: "Completing 3+ tasks while below 25% HP grants massive XP",
    icon: "👻",
    unlockLevel: 8,
    triggerType: "ANY",
    triggerCondition: { type: "hp_percent", value: 25, operator: "<=", timeframe: "day" },
    effectType: "XP_MULTIPLIER",
    effects: {
      xpMultiplier: 2.5,
    },
    cooldownHours: 24,
    manaCost: 45,
    overchargeCost: 90,
    overchargeMultiplier: 1.8,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "necromancer_death_pact",
    classRequired: "NECROMANCER",
    name: "Death Pact",
    description: "Sacrifice 30% HP to deal 2x damage for the next 3 abilities",
    icon: "🩸",
    unlockLevel: 12,
    triggerType: "ANY",
    effectType: "BUFF",
    effects: {
      sacrificeHpPercent: 0.30,
      bossDamage: 2.0,
      durationTasks: 3,
    },
    cooldownHours: 48,
    manaCost: 60,
    overchargeCost: 120,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
  {
    id: "necromancer_army_of_the_dead",
    classRequired: "NECROMANCER",
    name: "Army of the Dead",
    description: "After dying and reviving 3 times total, gain permanent +10% damage",
    icon: "🧟",
    unlockLevel: 15,
    triggerType: "DEATH",
    triggerCondition: { type: "death_count", value: 3, operator: ">=" },
    effectType: "BUFF",
    effects: {
      permanentDamageBonus: 0.10,
    },
    cooldownHours: 0,
    manaCost: 80,
    overchargeCost: 160,
    overchargeMultiplier: 1.5,
    secondaryClassEfficiency: 0.75,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get all abilities for a specific character class
 * @param characterClass - The character class to filter by
 * @returns Array of abilities for the specified class
 */
export function getClassAbilities(characterClass: CharacterClass): Ability[] {
  return ABILITIES.filter((ability) => ability.classRequired === characterClass);
}

/**
 * Get available abilities for a character based on class, level, and optional secondary class
 * @param characterClass - Primary character class
 * @param level - Current character level
 * @param secondaryClass - Optional secondary class (dual-class support)
 * @returns Array of available abilities (includes secondary class at 75% efficiency for levels 1/3/5 only)
 */
export function getAvailableAbilities(
  characterClass: CharacterClass,
  level: number,
  secondaryClass?: CharacterClass
): Ability[] {
  const primaryAbilities = ABILITIES.filter(
    (ability) => ability.classRequired === characterClass && ability.unlockLevel <= level
  );

  if (!secondaryClass) {
    return primaryAbilities;
  }

  // Secondary class abilities only available at levels 1, 3, and 5
  const secondaryAbilities = ABILITIES.filter(
    (ability) =>
      ability.classRequired === secondaryClass &&
      ability.unlockLevel <= level &&
      [1, 3, 5].includes(ability.unlockLevel)
  );

  return [...primaryAbilities, ...secondaryAbilities];
}

/**
 * Get a specific ability by its ID
 * @param id - The unique ability ID
 * @returns The ability object or undefined if not found
 */
export function getAbilityById(id: string): Ability | undefined {
  return ABILITIES.find((ability) => ability.id === id);
}

/**
 * Get abilities that can be triggered by a specific task type
 * @param characterClass - The character class to filter by
 * @param taskType - The task type that triggers the ability
 * @param level - Current character level
 * @returns Array of abilities that can be triggered by the task type
 */
export function getAbilitiesForTaskType(
  characterClass: CharacterClass,
  taskType: TaskType,
  level: number
): Ability[] {
  const classAbilities = getAvailableAbilities(characterClass, level);

  return classAbilities.filter(
    (ability) => ability.triggerType === taskType || ability.triggerType === "ANY"
  );
}

/**
 * Calculate ability effectiveness based on whether it's primary or secondary class
 * @param ability - The ability to calculate effectiveness for
 * @param characterClass - Primary character class
 * @returns Effectiveness multiplier (1.0 for primary, 0.75 for secondary)
 */
export function getAbilityEffectiveness(ability: Ability, characterClass: CharacterClass): number {
  if (ability.classRequired === characterClass) {
    return 1.0;
  }
  return ability.secondaryClassEfficiency;
}
