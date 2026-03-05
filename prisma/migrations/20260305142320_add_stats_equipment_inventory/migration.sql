-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CharacterClass" AS ENUM ('WARRIOR', 'MAGE', 'ROGUE', 'BARD', 'DRUID', 'CLERIC', 'NECROMANCER');

-- CreateEnum
CREATE TYPE "CharacterStatus" AS ENUM ('ALIVE', 'DEAD', 'EXHAUSTED');

-- CreateEnum
CREATE TYPE "AreaType" AS ENUM ('WORK', 'HOME', 'WRITING', 'SIDE_PROJECTS');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'WAITING', 'SOMEDAY', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DEEP_WORK', 'MEETING', 'APPOINTMENT', 'SOCIAL', 'ERRAND', 'ROUTINE', 'ADMIN', 'CREATIVE', 'LEARNING', 'OTHER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ACTION_ITEM', 'REMINDER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED_BY_SELF', 'CANCELED_BY_OTHER', 'MISSED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "BossStatus" AS ENUM ('DORMANT', 'ACTIVE', 'DEFEATED', 'ESCAPED');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('XP_SHARD', 'XP_CRYSTAL', 'STREAK_SHIELD', 'ENERGY_POTION', 'DOUBLE_XP_TOKEN', 'BOSS_BANE', 'HEALTH_POTION', 'REVIVE_TOKEN');

-- CreateEnum
CREATE TYPE "EquipmentSlot" AS ENUM ('WEAPON', 'ARMOR', 'HELM', 'BOOTS', 'ACCESSORY', 'TRINKET');

-- CreateEnum
CREATE TYPE "EquipmentRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('COMPLETE_TASKS', 'HIGH_PRIORITY', 'DEFEAT_BOSS', 'WORKOUT', 'WRITING', 'MULTI_AREA', 'EARLY_BIRD', 'NIGHT_OWL');

-- CreateEnum
CREATE TYPE "WritingType" AS ENUM ('STORY', 'BLOG_POST', 'ARTICLE', 'POETRY', 'OTHER');

-- CreateEnum
CREATE TYPE "WritingStatus" AS ENUM ('IDEA', 'OUTLINING', 'DRAFTING', 'EDITING', 'PUBLISHED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "HealthProvider" AS ENUM ('APPLE_HEALTH', 'GOOGLE_FIT', 'FITBIT');

-- CreateEnum
CREATE TYPE "HealthLogType" AS ENUM ('WORKOUT', 'STEPS', 'SLEEP', 'WATER', 'CALORIES', 'ACTIVE_MINUTES', 'HEART_RATE', 'WEIGHT', 'MOOD');

-- CreateEnum
CREATE TYPE "HealthSource" AS ENUM ('MANUAL', 'APPLE_HEALTH', 'IOS_SHORTCUT', 'GOOGLE_FIT', 'FITBIT');

-- CreateEnum
CREATE TYPE "StoryEntryType" AS ENUM ('EVENT_COMPLETED', 'EVENT_MISSED', 'EVENT_CANCELED', 'EVENT_RESCHEDULED', 'BOSS_DAMAGE', 'BOSS_DEFEATED', 'LEVEL_UP', 'ACHIEVEMENT', 'STREAK_MILESTONE', 'DAILY_SUMMARY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supabaseId" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class" "CharacterClass" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "xpToNextLevel" INTEGER NOT NULL DEFAULT 250,
    "hp" INTEGER NOT NULL DEFAULT 100,
    "maxHp" INTEGER NOT NULL DEFAULT 100,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "maxEnergy" INTEGER NOT NULL DEFAULT 100,
    "energyRegenRate" INTEGER NOT NULL DEFAULT 20,
    "status" "CharacterStatus" NOT NULL DEFAULT 'ALIVE',
    "diedAt" TIMESTAMP(3),
    "deathCount" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakProtection" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "bossesDefeated" INTEGER NOT NULL DEFAULT 0,
    "totalXpEarned" INTEGER NOT NULL DEFAULT 0,
    "weeklyEnergy" INTEGER NOT NULL DEFAULT 500,
    "maxWeeklyEnergy" INTEGER NOT NULL DEFAULT 500,
    "weekStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statStrength" INTEGER NOT NULL DEFAULT 0,
    "statStamina" INTEGER NOT NULL DEFAULT 0,
    "statFocus" INTEGER NOT NULL DEFAULT 0,
    "statDiscipline" INTEGER NOT NULL DEFAULT 0,
    "statCharisma" INTEGER NOT NULL DEFAULT 0,
    "statPointsAvailable" INTEGER NOT NULL DEFAULT 0,
    "totalStatPointsEarned" INTEGER NOT NULL DEFAULT 0,
    "mana" INTEGER NOT NULL DEFAULT 100,
    "maxMana" INTEGER NOT NULL DEFAULT 100,
    "secondaryClass" "CharacterClass",
    "lastRespecAt" TIMESTAMP(3),
    "gold" INTEGER NOT NULL DEFAULT 0,
    "totalGoldEarned" INTEGER NOT NULL DEFAULT 0,
    "inventoryCapacity" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "type" "AreaType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "projectId" TEXT,
    "bucketId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "type" "TaskType" NOT NULL DEFAULT 'OTHER',
    "energyCost" INTEGER NOT NULL DEFAULT 15,
    "xpReward" INTEGER NOT NULL DEFAULT 60,
    "startsAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "damageDealt" INTEGER NOT NULL DEFAULT 0,
    "googleEventId" TEXT,
    "questChainId" TEXT,
    "questStepIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_buckets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_tags" (
    "taskId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "task_tags_pkey" PRIMARY KEY ("taskId","tagId")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "eventType" "EventType" NOT NULL DEFAULT 'ACTION_ITEM',
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "projectId" TEXT,
    "xpEarned" INTEGER,
    "hpPenalty" INTEGER,
    "bossDamage" INTEGER,
    "googleEventId" TEXT,
    "googleCalendarId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bosses" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT '💀',
    "hp" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "status" "BossStatus" NOT NULL DEFAULT 'ACTIVE',
    "deadline" TIMESTAMP(3),
    "xpReward" INTEGER NOT NULL DEFAULT 500,
    "lootTableId" TEXT,
    "defeatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bosses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "condition" JSONB NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "rarity" "Rarity" NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loot_tables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "drops" JSONB NOT NULL,

    CONSTRAINT "loot_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slot" "EquipmentSlot" NOT NULL,
    "rarity" "EquipmentRarity" NOT NULL,
    "levelRequirement" INTEGER NOT NULL DEFAULT 1,
    "icon" TEXT NOT NULL DEFAULT '⚔️',
    "strengthBonus" INTEGER NOT NULL DEFAULT 0,
    "staminaBonus" INTEGER NOT NULL DEFAULT 0,
    "focusBonus" INTEGER NOT NULL DEFAULT 0,
    "disciplineBonus" INTEGER NOT NULL DEFAULT 0,
    "charismaBonus" INTEGER NOT NULL DEFAULT 0,
    "specialEffect" TEXT,
    "specialEffectId" TEXT,
    "setName" TEXT,
    "setClass" "CharacterClass",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipped_items" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "slot" "EquipmentSlot" NOT NULL,
    "upgradeLevel" INTEGER NOT NULL DEFAULT 0,
    "equippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipped_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_inventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "upgradeLevel" INTEGER NOT NULL DEFAULT 0,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_chains" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "narrative" TEXT,
    "steps" JSONB NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "xpReward" INTEGER NOT NULL DEFAULT 500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "quest_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "description" TEXT NOT NULL,
    "target" INTEGER NOT NULL DEFAULT 1,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "xpReward" INTEGER NOT NULL DEFAULT 75,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cadence" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_entries" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "goal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_pieces" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "type" "WritingType" NOT NULL,
    "status" "WritingStatus" NOT NULL DEFAULT 'IDEA',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "targetWords" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_pieces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_sessions" (
    "id" TEXT NOT NULL,
    "writingId" TEXT NOT NULL,
    "wordsAdded" INTEGER NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "writing_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_syncs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "HealthProvider" NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "workoutToday" BOOLEAN NOT NULL DEFAULT false,
    "sleepHours" DOUBLE PRECISION,
    "steps" INTEGER,
    "activeMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "HealthLogType" NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "notes" TEXT,
    "source" "HealthSource" NOT NULL DEFAULT 'MANUAL',
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_syncs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'GOOGLE',
    "email" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "context" TEXT,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryType" "StoryEntryType" NOT NULL,
    "title" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "eventId" TEXT,
    "xpEarned" INTEGER,
    "hpChange" INTEGER,
    "bossDamage" INTEGER,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "characters_userId_key" ON "characters"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "areas_type_key" ON "areas"("type");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_googleEventId_key" ON "tasks"("googleEventId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "task_buckets_userId_name_key" ON "task_buckets"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "events_googleEventId_key" ON "events"("googleEventId");

-- CreateIndex
CREATE UNIQUE INDEX "bosses_projectId_key" ON "bosses"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_userId_itemType_key" ON "inventory_items"("userId", "itemType");

-- CreateIndex
CREATE UNIQUE INDEX "equipped_items_characterId_slot_key" ON "equipped_items"("characterId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "daily_challenges_userId_type_date_key" ON "daily_challenges"("userId", "type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "goal_entries_goalId_date_key" ON "goal_entries"("goalId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "health_syncs_userId_provider_key" ON "health_syncs"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_syncs_userId_provider_email_key" ON "calendar_syncs"("userId", "provider", "email");

-- CreateIndex
CREATE INDEX "story_entries_userId_createdAt_idx" ON "story_entries"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "task_buckets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_questChainId_fkey" FOREIGN KEY ("questChainId") REFERENCES "quest_chains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bosses" ADD CONSTRAINT "bosses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipped_items" ADD CONSTRAINT "equipped_items_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipped_items" ADD CONSTRAINT "equipped_items_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_inventory" ADD CONSTRAINT "equipment_inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_inventory" ADD CONSTRAINT "equipment_inventory_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_chains" ADD CONSTRAINT "quest_chains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_challenges" ADD CONSTRAINT "daily_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_entries" ADD CONSTRAINT "goal_entries_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_pieces" ADD CONSTRAINT "writing_pieces_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_pieces" ADD CONSTRAINT "writing_pieces_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_pieces" ADD CONSTRAINT "writing_pieces_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_sessions" ADD CONSTRAINT "writing_sessions_writingId_fkey" FOREIGN KEY ("writingId") REFERENCES "writing_pieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_syncs" ADD CONSTRAINT "health_syncs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_logs" ADD CONSTRAINT "health_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_entries" ADD CONSTRAINT "story_entries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

