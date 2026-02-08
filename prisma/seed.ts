import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

// Create a PostgreSQL pool
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: false,
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@lifeos.app" },
    update: {},
    create: {
      email: "demo@lifeos.app",
      name: "Demo User",
      supabaseId: "demo-supabase-id",
    },
  });
  console.log("✅ Created user:", user.email);

  // Create character for the user
  const character = await prisma.character.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: "Hero",
      class: "WARRIOR",
      level: 5,
      xp: 1250,
      xpToNextLevel: 1500,
      hp: 85,
      maxHp: 100,
      energy: 70,
      maxEnergy: 100,
      currentStreak: 7,
      longestStreak: 14,
      tasksCompleted: 47,
      bossesDefeated: 3,
      totalXpEarned: 4750,
    },
  });
  console.log("✅ Created character:", character.name);

  // Create areas (system-level)
  const areas = await Promise.all([
    prisma.area.upsert({
      where: { type: "WORK" },
      update: {},
      create: {
        type: "WORK",
        displayName: "Work",
        icon: "💼",
        color: "#06b6d4",
        sortOrder: 1,
      },
    }),
    prisma.area.upsert({
      where: { type: "HOME" },
      update: {},
      create: {
        type: "HOME",
        displayName: "Home",
        icon: "🏠",
        color: "#ec4899",
        sortOrder: 2,
      },
    }),
    prisma.area.upsert({
      where: { type: "WRITING" },
      update: {},
      create: {
        type: "WRITING",
        displayName: "Writing",
        icon: "✍️",
        color: "#22c55e",
        sortOrder: 3,
      },
    }),
    prisma.area.upsert({
      where: { type: "SIDE_PROJECTS" },
      update: {},
      create: {
        type: "SIDE_PROJECTS",
        displayName: "Side Projects",
        icon: "🚀",
        color: "#eab308",
        sortOrder: 4,
      },
    }),
  ]);
  console.log("✅ Created areas:", areas.length);

  // Create some sample tasks
  const workArea = areas.find((a) => a.type === "WORK")!;
  const homeArea = areas.find((a) => a.type === "HOME")!;

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: user.id,
        areaId: workArea.id,
        title: "Review quarterly reports",
        description: "Go through Q4 reports and prepare summary",
        status: "TODO",
        priority: "HIGH",
        energyCost: 25,
        xpReward: 90,
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        areaId: workArea.id,
        title: "Team standup meeting",
        description: "Daily sync with the team",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        energyCost: 10,
        xpReward: 40,
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        areaId: homeArea.id,
        title: "Grocery shopping",
        description: "Weekly groceries",
        status: "TODO",
        priority: "MEDIUM",
        energyCost: 15,
        xpReward: 50,
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        areaId: homeArea.id,
        title: "Morning workout",
        description: "30 min cardio + strength training",
        status: "DONE",
        priority: "HIGH",
        energyCost: 20,
        xpReward: 75,
        completedAt: new Date(),
      },
    }),
  ]);
  console.log("✅ Created tasks:", tasks.length);

  // Create sample achievements
  const achievements = await Promise.all([
    prisma.achievement.upsert({
      where: { code: "FIRST_BLOOD" },
      update: {},
      create: {
        code: "FIRST_BLOOD",
        name: "First Blood",
        description: "Complete your first task",
        icon: "🩸",
        rarity: "COMMON",
        xpReward: 50,
        condition: { type: "TASKS_COMPLETED", value: 1 },
      },
    }),
    prisma.achievement.upsert({
      where: { code: "STREAK_WARRIOR" },
      update: {},
      create: {
        code: "STREAK_WARRIOR",
        name: "Streak Warrior",
        description: "Maintain a 7-day streak",
        icon: "🔥",
        rarity: "RARE",
        xpReward: 150,
        condition: { type: "STREAK_DAYS", value: 7 },
      },
    }),
    prisma.achievement.upsert({
      where: { code: "BOSS_SLAYER" },
      update: {},
      create: {
        code: "BOSS_SLAYER",
        name: "Boss Slayer",
        description: "Defeat your first boss",
        icon: "🐉",
        rarity: "EPIC",
        xpReward: 250,
        condition: { type: "BOSSES_DEFEATED", value: 1 },
      },
    }),
  ]);
  console.log("✅ Created achievements:", achievements.length);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
