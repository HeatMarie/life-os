// ══════════════════════════════════════════════════════════════════════════════
// LIFE OS — ACHIEVEMENTS SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export interface AchievementDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
  rarity: Rarity;
  xpReward: number;
  condition: {
    type: string;
    value: number;
    area?: string;
  };
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ── Common Achievements ────────────────────────────────────────────────────
  {
    code: "FIRST_BLOOD",
    name: "FIRST BLOOD",
    icon: "🩸",
    description: "Complete your first task",
    rarity: "COMMON",
    xpReward: 50,
    condition: { type: "TASKS_COMPLETED", value: 1 },
  },
  {
    code: "EARLY_BIRD",
    name: "EARLY BIRD",
    icon: "🌅",
    description: "Complete a task before 8am",
    rarity: "COMMON",
    xpReward: 75,
    condition: { type: "TASK_BEFORE_HOUR", value: 8 },
  },
  {
    code: "NIGHT_OWL",
    name: "NIGHT OWL",
    icon: "🌙",
    description: "Complete a task after 10pm",
    rarity: "COMMON",
    xpReward: 75,
    condition: { type: "TASK_AFTER_HOUR", value: 22 },
  },
  {
    code: "STREAK_STARTER",
    name: "STREAK STARTER",
    icon: "🔥",
    description: "Hit a 3-day streak",
    rarity: "COMMON",
    xpReward: 100,
    condition: { type: "STREAK_DAYS", value: 3 },
  },
  {
    code: "WORDSMITH",
    name: "WORDSMITH",
    icon: "✍️",
    description: "Write 1,000 words total",
    rarity: "COMMON",
    xpReward: 200,
    condition: { type: "WORDS_WRITTEN", value: 1000 },
  },
  
  // ── Rare Achievements ──────────────────────────────────────────────────────
  {
    code: "SPEED_DEMON",
    name: "SPEED DEMON",
    icon: "⚡",
    description: "Complete 5 tasks in one day",
    rarity: "RARE",
    xpReward: 150,
    condition: { type: "TASKS_IN_DAY", value: 5 },
  },
  {
    code: "WEEK_WARRIOR",
    name: "WEEK WARRIOR",
    icon: "⚔️",
    description: "Maintain a 7-day streak",
    rarity: "RARE",
    xpReward: 250,
    condition: { type: "STREAK_DAYS", value: 7 },
  },
  {
    code: "MULTITASKER",
    name: "MULTITASKER",
    icon: "🎯",
    description: "Complete tasks in all 4 areas in one day",
    rarity: "RARE",
    xpReward: 250,
    condition: { type: "AREAS_IN_DAY", value: 4 },
  },
  {
    code: "CENTURION",
    name: "CENTURION",
    icon: "💯",
    description: "Complete 100 tasks",
    rarity: "RARE",
    xpReward: 500,
    condition: { type: "TASKS_COMPLETED", value: 100 },
  },
  {
    code: "AREA_MASTER_WORK",
    name: "MASTER: WORK",
    icon: "💼",
    description: "Complete 25 work tasks",
    rarity: "RARE",
    xpReward: 300,
    condition: { type: "AREA_TASKS_COMPLETED", value: 25, area: "WORK" },
  },
  {
    code: "AREA_MASTER_HOME",
    name: "MASTER: HOME",
    icon: "🏠",
    description: "Complete 25 home tasks",
    rarity: "RARE",
    xpReward: 300,
    condition: { type: "AREA_TASKS_COMPLETED", value: 25, area: "HOME" },
  },
  {
    code: "AREA_MASTER_WRITING",
    name: "MASTER: WRITING",
    icon: "🖊️",
    description: "Complete 25 writing tasks",
    rarity: "RARE",
    xpReward: 300,
    condition: { type: "AREA_TASKS_COMPLETED", value: 25, area: "WRITING" },
  },
  {
    code: "AREA_MASTER_SIDE",
    name: "MASTER: SIDE PROJECTS",
    icon: "🚀",
    description: "Complete 25 side project tasks",
    rarity: "RARE",
    xpReward: 300,
    condition: { type: "AREA_TASKS_COMPLETED", value: 25, area: "SIDE_PROJECTS" },
  },
  
  // ── Epic Achievements ──────────────────────────────────────────────────────
  {
    code: "OVERACHIEVER",
    name: "OVERACHIEVER",
    icon: "🌟",
    description: "Complete 10 tasks in one day",
    rarity: "EPIC",
    xpReward: 400,
    condition: { type: "TASKS_IN_DAY", value: 10 },
  },
  {
    code: "PERFECT_WEEK",
    name: "PERFECT WEEK",
    icon: "✨",
    description: "Complete 1+ task every day for 7 days",
    rarity: "EPIC",
    xpReward: 500,
    condition: { type: "STREAK_DAYS", value: 7 },
  },
  {
    code: "BOSS_SLAYER",
    name: "BOSS SLAYER",
    icon: "💀",
    description: "Defeat your first boss",
    rarity: "EPIC",
    xpReward: 600,
    condition: { type: "BOSSES_DEFEATED", value: 1 },
  },
  {
    code: "MARATHON",
    name: "MARATHON",
    icon: "🏃",
    description: "Maintain a 30-day streak",
    rarity: "EPIC",
    xpReward: 750,
    condition: { type: "STREAK_DAYS", value: 30 },
  },
  {
    code: "NOVELIST",
    name: "NOVELIST",
    icon: "📚",
    description: "Write 10,000 words total",
    rarity: "EPIC",
    xpReward: 750,
    condition: { type: "WORDS_WRITTEN", value: 10000 },
  },
  {
    code: "PHOENIX",
    name: "PHOENIX",
    icon: "🔥",
    description: "Respawn from death 3 times",
    rarity: "EPIC",
    xpReward: 500,
    condition: { type: "DEATH_COUNT", value: 3 },
  },
  {
    code: "BURNOUT_SURVIVOR",
    name: "BURNOUT SURVIVOR",
    icon: "😵‍💫",
    description: "Recover from exhausted state",
    rarity: "EPIC",
    xpReward: 400,
    condition: { type: "BURNOUT_RECOVERIES", value: 1 },
  },
  
  // ── Legendary Achievements ─────────────────────────────────────────────────
  {
    code: "LEGENDARY",
    name: "LEGENDARY",
    icon: "👑",
    description: "Reach level 25",
    rarity: "LEGENDARY",
    xpReward: 1000,
    condition: { type: "LEVEL", value: 25 },
  },
  {
    code: "MASTER_SLAYER",
    name: "MASTER SLAYER",
    icon: "⚔️",
    description: "Defeat 5 bosses",
    rarity: "LEGENDARY",
    xpReward: 1500,
    condition: { type: "BOSSES_DEFEATED", value: 5 },
  },
  {
    code: "IMMORTAL",
    name: "IMMORTAL",
    icon: "💫",
    description: "Reach 100-day streak",
    rarity: "LEGENDARY",
    xpReward: 2000,
    condition: { type: "STREAK_DAYS", value: 100 },
  },
  {
    code: "AUTHOR",
    name: "AUTHOR",
    icon: "📖",
    description: "Write 50,000 words (a novel!)",
    rarity: "LEGENDARY",
    xpReward: 2500,
    condition: { type: "WORDS_WRITTEN", value: 50000 },
  },
  {
    code: "LIFE_OS_MASTER",
    name: "LIFE OS MASTER",
    icon: "🎮",
    description: "Reach level 50",
    rarity: "LEGENDARY",
    xpReward: 5000,
    condition: { type: "LEVEL", value: 50 },
  },
];

// Achievement checking functions
export interface UserStats {
  tasksCompleted: number;
  tasksCompletedToday: number;
  areasCompletedToday: string[];
  currentStreak: number;
  longestStreak: number;
  level: number;
  wordsWritten: number;
  bossesDefeated: number;
  deathCount: number;
  burnoutRecoveries: number;
  tasksByArea: Record<string, number>;
  lastTaskHour?: number;
}

export function checkAchievementUnlock(
  achievement: AchievementDefinition,
  stats: UserStats
): boolean {
  const { type, value, area } = achievement.condition;
  
  switch (type) {
    case "TASKS_COMPLETED":
      return stats.tasksCompleted >= value;
      
    case "TASKS_IN_DAY":
      return stats.tasksCompletedToday >= value;
      
    case "AREAS_IN_DAY":
      return stats.areasCompletedToday.length >= value;
      
    case "STREAK_DAYS":
      return stats.currentStreak >= value || stats.longestStreak >= value;
      
    case "LEVEL":
      return stats.level >= value;
      
    case "WORDS_WRITTEN":
      return stats.wordsWritten >= value;
      
    case "BOSSES_DEFEATED":
      return stats.bossesDefeated >= value;
      
    case "DEATH_COUNT":
      return stats.deathCount >= value;
      
    case "BURNOUT_RECOVERIES":
      return stats.burnoutRecoveries >= value;
      
    case "AREA_TASKS_COMPLETED":
      if (!area) return false;
      return (stats.tasksByArea[area] || 0) >= value;
      
    case "TASK_BEFORE_HOUR":
      return stats.lastTaskHour !== undefined && stats.lastTaskHour < value;
      
    case "TASK_AFTER_HOUR":
      return stats.lastTaskHour !== undefined && stats.lastTaskHour >= value;
      
    default:
      return false;
  }
}

export function getAchievementProgress(
  achievement: AchievementDefinition,
  stats: UserStats
): number {
  const { type, value, area } = achievement.condition;
  
  switch (type) {
    case "TASKS_COMPLETED":
      return Math.min(stats.tasksCompleted, value);
      
    case "TASKS_IN_DAY":
      return Math.min(stats.tasksCompletedToday, value);
      
    case "AREAS_IN_DAY":
      return Math.min(stats.areasCompletedToday.length, value);
      
    case "STREAK_DAYS":
      return Math.min(Math.max(stats.currentStreak, stats.longestStreak), value);
      
    case "LEVEL":
      return Math.min(stats.level, value);
      
    case "WORDS_WRITTEN":
      return Math.min(stats.wordsWritten, value);
      
    case "BOSSES_DEFEATED":
      return Math.min(stats.bossesDefeated, value);
      
    case "DEATH_COUNT":
      return Math.min(stats.deathCount, value);
      
    case "BURNOUT_RECOVERIES":
      return Math.min(stats.burnoutRecoveries, value);
      
    case "AREA_TASKS_COMPLETED":
      if (!area) return 0;
      return Math.min(stats.tasksByArea[area] || 0, value);
      
    default:
      return 0;
  }
}

export function getUnlockedAchievements(
  stats: UserStats,
  alreadyUnlocked: string[] = []
): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(
    (a) => !alreadyUnlocked.includes(a.code) && checkAchievementUnlock(a, stats)
  );
}

// Alias for API routes
export const checkAchievementUnlocks = getUnlockedAchievements;
