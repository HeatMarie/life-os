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

  // Create default task buckets for the user
  const buckets = await Promise.all([
    prisma.taskBucket.upsert({
      where: { userId_name: { userId: user.id, name: "To Do" } },
      update: {},
      create: {
        userId: user.id,
        name: "To Do",
        color: "#06b6d4",
        sortOrder: 0,
        isDefault: true,
      },
    }),
    prisma.taskBucket.upsert({
      where: { userId_name: { userId: user.id, name: "In Progress" } },
      update: {},
      create: {
        userId: user.id,
        name: "In Progress",
        color: "#eab308",
        sortOrder: 1,
        isDefault: true,
      },
    }),
    prisma.taskBucket.upsert({
      where: { userId_name: { userId: user.id, name: "Done" } },
      update: {},
      create: {
        userId: user.id,
        name: "Done",
        color: "#22c55e",
        sortOrder: 2,
        isDefault: true,
      },
    }),
  ]);
  console.log("✅ Created task buckets:", buckets.length);

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

  // ══════════════════════════════════════════════════════════════════════════════
  // EQUIPMENT DEFINITIONS
  // ══════════════════════════════════════════════════════════════════════════════

  console.log("⚔️  Seeding equipment definitions...");

  // Class-specific equipment sets (6 pieces per class × 7 classes = 42 items)
  const classEquipmentData = [
    // WARRIOR SET
    { class: "WARRIOR", name: "Warrior's Greatsword", slot: "WEAPON", icon: "⚔️", strengthBonus: 5, staminaBonus: 3 },
    { class: "WARRIOR", name: "Warrior's Plate Armor", slot: "ARMOR", icon: "🛡️", strengthBonus: 3, staminaBonus: 5 },
    { class: "WARRIOR", name: "Warrior's Battle Helm", slot: "HELM", icon: "🪖", strengthBonus: 2, staminaBonus: 4 },
    { class: "WARRIOR", name: "Warrior's Steel Boots", slot: "BOOTS", icon: "🥾", strengthBonus: 2, staminaBonus: 3 },
    { class: "WARRIOR", name: "Warrior's Power Ring", slot: "ACCESSORY", icon: "💍", strengthBonus: 4, staminaBonus: 2 },
    { class: "WARRIOR", name: "Warrior's Badge", slot: "TRINKET", icon: "🏅", strengthBonus: 3, staminaBonus: 3 },

    // MAGE SET
    { class: "MAGE", name: "Archmage's Staff", slot: "WEAPON", icon: "🪄", focusBonus: 5, disciplineBonus: 3 },
    { class: "MAGE", name: "Archmage's Robes", slot: "ARMOR", icon: "👘", focusBonus: 3, disciplineBonus: 5 },
    { class: "MAGE", name: "Archmage's Circlet", slot: "HELM", icon: "👑", focusBonus: 4, disciplineBonus: 2 },
    { class: "MAGE", name: "Archmage's Slippers", slot: "BOOTS", icon: "🥿", focusBonus: 2, disciplineBonus: 3 },
    { class: "MAGE", name: "Archmage's Amulet", slot: "ACCESSORY", icon: "📿", focusBonus: 4, disciplineBonus: 2 },
    { class: "MAGE", name: "Archmage's Tome", slot: "TRINKET", icon: "📖", focusBonus: 3, disciplineBonus: 3 },

    // ROGUE SET
    { class: "ROGUE", name: "Shadow Dagger", slot: "WEAPON", icon: "🗡️", focusBonus: 4, charismaBonus: 3 },
    { class: "ROGUE", name: "Shadow Leather Armor", slot: "ARMOR", icon: "🧥", focusBonus: 3, charismaBonus: 4 },
    { class: "ROGUE", name: "Shadow Hood", slot: "HELM", icon: "🎭", focusBonus: 2, charismaBonus: 4 },
    { class: "ROGUE", name: "Shadow Boots", slot: "BOOTS", icon: "👢", focusBonus: 3, charismaBonus: 2 },
    { class: "ROGUE", name: "Shadow Ring", slot: "ACCESSORY", icon: "💎", focusBonus: 2, charismaBonus: 4 },
    { class: "ROGUE", name: "Shadow Cloak Pin", slot: "TRINKET", icon: "📌", focusBonus: 3, charismaBonus: 3 },

    // BARD SET
    { class: "BARD", name: "Bard's Lute", slot: "WEAPON", icon: "🎸", charismaBonus: 5, disciplineBonus: 2 },
    { class: "BARD", name: "Bard's Coat", slot: "ARMOR", icon: "🧥", charismaBonus: 4, disciplineBonus: 3 },
    { class: "BARD", name: "Bard's Hat", slot: "HELM", icon: "🎩", charismaBonus: 4, disciplineBonus: 2 },
    { class: "BARD", name: "Bard's Shoes", slot: "BOOTS", icon: "👞", charismaBonus: 3, disciplineBonus: 2 },
    { class: "BARD", name: "Bard's Necklace", slot: "ACCESSORY", icon: "📿", charismaBonus: 4, disciplineBonus: 2 },
    { class: "BARD", name: "Bard's Quill", slot: "TRINKET", icon: "🖋️", charismaBonus: 3, disciplineBonus: 3 },

    // DRUID SET
    { class: "DRUID", name: "Druid's Nature Staff", slot: "WEAPON", icon: "🌿", staminaBonus: 3, focusBonus: 4 },
    { class: "DRUID", name: "Druid's Bark Armor", slot: "ARMOR", icon: "🍃", staminaBonus: 5, focusBonus: 2 },
    { class: "DRUID", name: "Druid's Wreath", slot: "HELM", icon: "🌺", staminaBonus: 3, focusBonus: 3 },
    { class: "DRUID", name: "Druid's Root Boots", slot: "BOOTS", icon: "🌱", staminaBonus: 4, focusBonus: 2 },
    { class: "DRUID", name: "Druid's Vine Ring", slot: "ACCESSORY", icon: "🌿", staminaBonus: 2, focusBonus: 4 },
    { class: "DRUID", name: "Druid's Seed", slot: "TRINKET", icon: "🌰", staminaBonus: 3, focusBonus: 3 },

    // CLERIC SET
    { class: "CLERIC", name: "Holy Mace", slot: "WEAPON", icon: "🔨", disciplineBonus: 4, staminaBonus: 3 },
    { class: "CLERIC", name: "Holy Vestments", slot: "ARMOR", icon: "👗", disciplineBonus: 5, staminaBonus: 2 },
    { class: "CLERIC", name: "Holy Crown", slot: "HELM", icon: "👑", disciplineBonus: 4, staminaBonus: 2 },
    { class: "CLERIC", name: "Holy Sandals", slot: "BOOTS", icon: "🩴", disciplineBonus: 3, staminaBonus: 2 },
    { class: "CLERIC", name: "Holy Symbol", slot: "ACCESSORY", icon: "✝️", disciplineBonus: 4, staminaBonus: 2 },
    { class: "CLERIC", name: "Prayer Beads", slot: "TRINKET", icon: "📿", disciplineBonus: 3, staminaBonus: 3 },

    // NECROMANCER SET
    { class: "NECROMANCER", name: "Death's Scythe", slot: "WEAPON", icon: "☠️", focusBonus: 5, disciplineBonus: 2 },
    { class: "NECROMANCER", name: "Necromancer's Robes", slot: "ARMOR", icon: "🦇", focusBonus: 3, disciplineBonus: 4 },
    { class: "NECROMANCER", name: "Skull Mask", slot: "HELM", icon: "💀", focusBonus: 4, disciplineBonus: 2 },
    { class: "NECROMANCER", name: "Soul Walker Boots", slot: "BOOTS", icon: "👣", focusBonus: 2, disciplineBonus: 3 },
    { class: "NECROMANCER", name: "Bone Ring", slot: "ACCESSORY", icon: "💀", focusBonus: 4, disciplineBonus: 2 },
    { class: "NECROMANCER", name: "Soul Gem", slot: "TRINKET", icon: "💎", focusBonus: 3, disciplineBonus: 3 },
  ];

  const classEquipment = [];
  for (const item of classEquipmentData) {
    const equipment = await prisma.equipmentDefinition.create({
      data: {
        name: item.name,
        description: `${item.class} set piece - bonus when wearing multiple pieces`,
        slot: item.slot,
        rarity: "EPIC",
        levelRequirement: 1,
        icon: item.icon,
        strengthBonus: item.strengthBonus || 0,
        staminaBonus: item.staminaBonus || 0,
        focusBonus: item.focusBonus || 0,
        disciplineBonus: item.disciplineBonus || 0,
        charismaBonus: item.charismaBonus || 0,
        setName: `${item.class} Set`,
        setClass: item.class,
      },
    });
    classEquipment.push(equipment);
  }
  console.log("✅ Created class equipment sets:", classEquipment.length);

  // Generic non-set equipment (5 per slot per rarity across 5 slots = 100 items)
  const genericEquipmentData = [
    // WEAPON - Common
    { name: "Iron Sword", slot: "WEAPON", rarity: "COMMON", icon: "⚔️", strengthBonus: 1, level: 1 },
    { name: "Wooden Staff", slot: "WEAPON", rarity: "COMMON", icon: "🪵", focusBonus: 1, level: 1 },
    { name: "Simple Dagger", slot: "WEAPON", rarity: "COMMON", icon: "🔪", charismaBonus: 1, level: 1 },
    { name: "Club", slot: "WEAPON", rarity: "COMMON", icon: "🏏", strengthBonus: 1, level: 1 },
    { name: "Sling", slot: "WEAPON", rarity: "COMMON", icon: "🎯", focusBonus: 1, level: 1 },

    // WEAPON - Rare
    { name: "Steel Longsword", slot: "WEAPON", rarity: "RARE", icon: "🗡️", strengthBonus: 3, level: 5 },
    { name: "Crystal Wand", slot: "WEAPON", rarity: "RARE", icon: "✨", focusBonus: 3, level: 5 },
    { name: "Poison Blade", slot: "WEAPON", rarity: "RARE", icon: "🗡️", charismaBonus: 3, level: 5 },
    { name: "War Hammer", slot: "WEAPON", rarity: "RARE", icon: "🔨", strengthBonus: 3, staminaBonus: 1, level: 5 },
    { name: "Crossbow", slot: "WEAPON", rarity: "RARE", icon: "🏹", focusBonus: 3, level: 5 },

    // WEAPON - Epic
    { name: "Flaming Sword", slot: "WEAPON", rarity: "EPIC", icon: "🔥", strengthBonus: 5, focusBonus: 2, level: 10 },
    { name: "Arcane Staff", slot: "WEAPON", rarity: "EPIC", icon: "🪄", focusBonus: 5, disciplineBonus: 2, level: 10 },
    { name: "Assassin's Blade", slot: "WEAPON", rarity: "EPIC", icon: "🗡️", charismaBonus: 5, focusBonus: 2, level: 10 },
    { name: "Dragon Slayer", slot: "WEAPON", rarity: "EPIC", icon: "⚔️", strengthBonus: 6, staminaBonus: 1, level: 10 },
    { name: "Lightning Bow", slot: "WEAPON", rarity: "EPIC", icon: "⚡", focusBonus: 5, strengthBonus: 2, level: 10 },

    // WEAPON - Legendary
    { name: "Excalibur", slot: "WEAPON", rarity: "LEGENDARY", icon: "⚔️", strengthBonus: 10, staminaBonus: 5, charismaBonus: 3, level: 20 },
    { name: "Staff of Ages", slot: "WEAPON", rarity: "LEGENDARY", icon: "🌟", focusBonus: 10, disciplineBonus: 5, level: 20 },
    { name: "Shadowfang", slot: "WEAPON", rarity: "LEGENDARY", icon: "🌙", charismaBonus: 10, focusBonus: 5, level: 20 },
    { name: "Mjolnir", slot: "WEAPON", rarity: "LEGENDARY", icon: "⚡", strengthBonus: 12, disciplineBonus: 3, level: 20 },
    { name: "Phoenix Bow", slot: "WEAPON", rarity: "LEGENDARY", icon: "🏹", focusBonus: 8, strengthBonus: 6, charismaBonus: 2, level: 20 },

    // ARMOR - Common
    { name: "Cloth Robe", slot: "ARMOR", rarity: "COMMON", icon: "👘", staminaBonus: 1, level: 1 },
    { name: "Leather Vest", slot: "ARMOR", rarity: "COMMON", icon: "🧥", staminaBonus: 1, level: 1 },
    { name: "Padded Armor", slot: "ARMOR", rarity: "COMMON", icon: "🛡️", staminaBonus: 2, level: 1 },
    { name: "Simple Tunic", slot: "ARMOR", rarity: "COMMON", icon: "👕", staminaBonus: 1, level: 1 },
    { name: "Traveler's Cloak", slot: "ARMOR", rarity: "COMMON", icon: "🧥", staminaBonus: 1, charismaBonus: 1, level: 1 },

    // ARMOR - Rare
    { name: "Reinforced Leather", slot: "ARMOR", rarity: "RARE", icon: "🧥", staminaBonus: 4, level: 5 },
    { name: "Chain Mail", slot: "ARMOR", rarity: "RARE", icon: "⛓️", staminaBonus: 5, level: 5 },
    { name: "Enchanted Robes", slot: "ARMOR", rarity: "RARE", icon: "👘", staminaBonus: 3, focusBonus: 2, level: 5 },
    { name: "Battle Armor", slot: "ARMOR", rarity: "RARE", icon: "🛡️", staminaBonus: 5, strengthBonus: 1, level: 5 },
    { name: "Studded Leather", slot: "ARMOR", rarity: "RARE", icon: "🧥", staminaBonus: 4, charismaBonus: 1, level: 5 },

    // ARMOR - Epic
    { name: "Dragon Scale Armor", slot: "ARMOR", rarity: "EPIC", icon: "🐉", staminaBonus: 7, strengthBonus: 3, level: 10 },
    { name: "Mithril Plate", slot: "ARMOR", rarity: "EPIC", icon: "🛡️", staminaBonus: 8, level: 10 },
    { name: "Archmage Vestments", slot: "ARMOR", rarity: "EPIC", icon: "👘", staminaBonus: 5, focusBonus: 4, level: 10 },
    { name: "Shadow Leather", slot: "ARMOR", rarity: "EPIC", icon: "🦇", staminaBonus: 6, charismaBonus: 3, level: 10 },
    { name: "Crystal Armor", slot: "ARMOR", rarity: "EPIC", icon: "💎", staminaBonus: 7, focusBonus: 2, level: 10 },

    // ARMOR - Legendary
    { name: "Godplate Armor", slot: "ARMOR", rarity: "LEGENDARY", icon: "🛡️", staminaBonus: 15, strengthBonus: 5, level: 20 },
    { name: "Celestial Robes", slot: "ARMOR", rarity: "LEGENDARY", icon: "✨", staminaBonus: 10, focusBonus: 8, disciplineBonus: 3, level: 20 },
    { name: "Void Armor", slot: "ARMOR", rarity: "LEGENDARY", icon: "🌌", staminaBonus: 12, charismaBonus: 6, level: 20 },
    { name: "Phoenix Plate", slot: "ARMOR", rarity: "LEGENDARY", icon: "🔥", staminaBonus: 14, disciplineBonus: 4, level: 20 },
    { name: "Eternal Guard", slot: "ARMOR", rarity: "LEGENDARY", icon: "⚔️", staminaBonus: 13, strengthBonus: 4, focusBonus: 3, level: 20 },

    // HELM - Common
    { name: "Cloth Cap", slot: "HELM", rarity: "COMMON", icon: "🧢", disciplineBonus: 1, level: 1 },
    { name: "Leather Hood", slot: "HELM", rarity: "COMMON", icon: "🎭", focusBonus: 1, level: 1 },
    { name: "Iron Helmet", slot: "HELM", rarity: "COMMON", icon: "⛑️", staminaBonus: 1, level: 1 },
    { name: "Simple Bandana", slot: "HELM", rarity: "COMMON", icon: "🧣", charismaBonus: 1, level: 1 },
    { name: "Straw Hat", slot: "HELM", rarity: "COMMON", icon: "🎩", charismaBonus: 1, level: 1 },

    // HELM - Rare
    { name: "Steel Helmet", slot: "HELM", rarity: "RARE", icon: "🪖", staminaBonus: 3, level: 5 },
    { name: "Wizard Hat", slot: "HELM", rarity: "RARE", icon: "🎩", focusBonus: 3, level: 5 },
    { name: "Shadow Mask", slot: "HELM", rarity: "RARE", icon: "🎭", charismaBonus: 3, level: 5 },
    { name: "War Crown", slot: "HELM", rarity: "RARE", icon: "👑", strengthBonus: 2, disciplineBonus: 2, level: 5 },
    { name: "Ranger's Cap", slot: "HELM", rarity: "RARE", icon: "🎯", focusBonus: 3, level: 5 },

    // HELM - Epic
    { name: "Crown of Wisdom", slot: "HELM", rarity: "EPIC", icon: "👑", focusBonus: 5, disciplineBonus: 3, level: 10 },
    { name: "Battle Helm", slot: "HELM", rarity: "EPIC", icon: "⛑️", staminaBonus: 4, strengthBonus: 3, level: 10 },
    { name: "Phantom Mask", slot: "HELM", rarity: "EPIC", icon: "👻", charismaBonus: 5, focusBonus: 2, level: 10 },
    { name: "Dragon Helm", slot: "HELM", rarity: "EPIC", icon: "🐉", strengthBonus: 4, staminaBonus: 3, level: 10 },
    { name: "Crystal Circlet", slot: "HELM", rarity: "EPIC", icon: "💎", focusBonus: 6, level: 10 },

    // HELM - Legendary
    { name: "Crown of the Gods", slot: "HELM", rarity: "LEGENDARY", icon: "👑", focusBonus: 8, disciplineBonus: 8, charismaBonus: 4, level: 20 },
    { name: "Immortal Helm", slot: "HELM", rarity: "LEGENDARY", icon: "⚔️", staminaBonus: 8, strengthBonus: 6, level: 20 },
    { name: "Void Mask", slot: "HELM", rarity: "LEGENDARY", icon: "🌑", charismaBonus: 10, focusBonus: 5, level: 20 },
    { name: "Phoenix Crown", slot: "HELM", rarity: "LEGENDARY", icon: "🔥", disciplineBonus: 10, focusBonus: 5, level: 20 },
    { name: "Starlight Diadem", slot: "HELM", rarity: "LEGENDARY", icon: "✨", focusBonus: 12, charismaBonus: 3, level: 20 },

    // BOOTS - Common
    { name: "Cloth Shoes", slot: "BOOTS", rarity: "COMMON", icon: "👟", charismaBonus: 1, level: 1 },
    { name: "Leather Boots", slot: "BOOTS", rarity: "COMMON", icon: "🥾", staminaBonus: 1, level: 1 },
    { name: "Iron Boots", slot: "BOOTS", rarity: "COMMON", icon: "👢", strengthBonus: 1, level: 1 },
    { name: "Sandals", slot: "BOOTS", rarity: "COMMON", icon: "🩴", disciplineBonus: 1, level: 1 },
    { name: "Soft Slippers", slot: "BOOTS", rarity: "COMMON", icon: "🥿", focusBonus: 1, level: 1 },

    // BOOTS - Rare
    { name: "Swift Boots", slot: "BOOTS", rarity: "RARE", icon: "👟", charismaBonus: 3, level: 5 },
    { name: "Heavy Boots", slot: "BOOTS", rarity: "RARE", icon: "👢", staminaBonus: 3, strengthBonus: 1, level: 5 },
    { name: "Mystic Slippers", slot: "BOOTS", rarity: "RARE", icon: "🥿", focusBonus: 3, level: 5 },
    { name: "War Boots", slot: "BOOTS", rarity: "RARE", icon: "🥾", strengthBonus: 3, level: 5 },
    { name: "Shadow Steps", slot: "BOOTS", rarity: "RARE", icon: "👣", charismaBonus: 3, focusBonus: 1, level: 5 },

    // BOOTS - Epic
    { name: "Boots of Haste", slot: "BOOTS", rarity: "EPIC", icon: "⚡", charismaBonus: 5, focusBonus: 2, level: 10 },
    { name: "Titan Boots", slot: "BOOTS", rarity: "EPIC", icon: "👢", strengthBonus: 5, staminaBonus: 3, level: 10 },
    { name: "Arcane Treads", slot: "BOOTS", rarity: "EPIC", icon: "🥿", focusBonus: 6, disciplineBonus: 2, level: 10 },
    { name: "Dragon Boots", slot: "BOOTS", rarity: "EPIC", icon: "🐉", staminaBonus: 4, strengthBonus: 3, level: 10 },
    { name: "Phantom Steps", slot: "BOOTS", rarity: "EPIC", icon: "👻", charismaBonus: 5, focusBonus: 3, level: 10 },

    // BOOTS - Legendary
    { name: "Boots of the Wind", slot: "BOOTS", rarity: "LEGENDARY", icon: "💨", charismaBonus: 10, focusBonus: 5, level: 20 },
    { name: "Earth Shakers", slot: "BOOTS", rarity: "LEGENDARY", icon: "🌍", strengthBonus: 10, staminaBonus: 8, level: 20 },
    { name: "Celestial Steps", slot: "BOOTS", rarity: "LEGENDARY", icon: "✨", focusBonus: 12, disciplineBonus: 4, level: 20 },
    { name: "Phoenix Treads", slot: "BOOTS", rarity: "LEGENDARY", icon: "🔥", staminaBonus: 8, disciplineBonus: 6, level: 20 },
    { name: "Void Walkers", slot: "BOOTS", rarity: "LEGENDARY", icon: "🌌", charismaBonus: 8, strengthBonus: 6, level: 20 },

    // ACCESSORY - Common
    { name: "Simple Ring", slot: "ACCESSORY", rarity: "COMMON", icon: "💍", strengthBonus: 1, level: 1 },
    { name: "Copper Bracelet", slot: "ACCESSORY", rarity: "COMMON", icon: "📿", staminaBonus: 1, level: 1 },
    { name: "Wooden Pendant", slot: "ACCESSORY", rarity: "COMMON", icon: "🪵", focusBonus: 1, level: 1 },
    { name: "Cloth Band", slot: "ACCESSORY", rarity: "COMMON", icon: "🎀", charismaBonus: 1, level: 1 },
    { name: "Stone Amulet", slot: "ACCESSORY", rarity: "COMMON", icon: "🗿", disciplineBonus: 1, level: 1 },

    // ACCESSORY - Rare
    { name: "Silver Ring", slot: "ACCESSORY", rarity: "RARE", icon: "💍", strengthBonus: 3, level: 5 },
    { name: "Protection Amulet", slot: "ACCESSORY", rarity: "RARE", icon: "📿", staminaBonus: 3, level: 5 },
    { name: "Focus Crystal", slot: "ACCESSORY", rarity: "RARE", icon: "💎", focusBonus: 3, level: 5 },
    { name: "Charm Bracelet", slot: "ACCESSORY", rarity: "RARE", icon: "✨", charismaBonus: 3, level: 5 },
    { name: "Meditation Beads", slot: "ACCESSORY", rarity: "RARE", icon: "📿", disciplineBonus: 3, level: 5 },

    // ACCESSORY - Epic
    { name: "Ruby Ring", slot: "ACCESSORY", rarity: "EPIC", icon: "💍", strengthBonus: 5, charismaBonus: 2, level: 10 },
    { name: "Diamond Necklace", slot: "ACCESSORY", rarity: "EPIC", icon: "💎", focusBonus: 5, disciplineBonus: 2, level: 10 },
    { name: "Emerald Bracelet", slot: "ACCESSORY", rarity: "EPIC", icon: "💚", staminaBonus: 5, focusBonus: 2, level: 10 },
    { name: "Sapphire Amulet", slot: "ACCESSORY", rarity: "EPIC", icon: "💙", disciplineBonus: 5, focusBonus: 2, level: 10 },
    { name: "Onyx Ring", slot: "ACCESSORY", rarity: "EPIC", icon: "🖤", charismaBonus: 5, strengthBonus: 2, level: 10 },

    // ACCESSORY - Legendary
    { name: "Dragon's Heart", slot: "ACCESSORY", rarity: "LEGENDARY", icon: "❤️", strengthBonus: 8, staminaBonus: 8, level: 20 },
    { name: "Eye of Eternity", slot: "ACCESSORY", rarity: "LEGENDARY", icon: "👁️", focusBonus: 10, disciplineBonus: 6, level: 20 },
    { name: "Soul Pendant", slot: "ACCESSORY", rarity: "LEGENDARY", icon: "💫", charismaBonus: 10, focusBonus: 5, level: 20 },
    { name: "Ring of Power", slot: "ACCESSORY", rarity: "LEGENDARY", icon: "💍", strengthBonus: 6, focusBonus: 6, disciplineBonus: 4, level: 20 },
    { name: "Cosmic Amulet", slot: "ACCESSORY", rarity: "LEGENDARY", icon: "🌟", focusBonus: 8, disciplineBonus: 8, charismaBonus: 4, level: 20 },
  ];

  const genericEquipment = [];
  for (const item of genericEquipmentData) {
    const equipment = await prisma.equipmentDefinition.create({
      data: {
        name: item.name,
        description: `Generic ${item.rarity.toLowerCase()} equipment`,
        slot: item.slot,
        rarity: item.rarity,
        levelRequirement: item.level,
        icon: item.icon,
        strengthBonus: item.strengthBonus || 0,
        staminaBonus: item.staminaBonus || 0,
        focusBonus: item.focusBonus || 0,
        disciplineBonus: item.disciplineBonus || 0,
        charismaBonus: item.charismaBonus || 0,
      },
    });
    genericEquipment.push(equipment);
  }
  console.log("✅ Created generic equipment:", genericEquipment.length);

  // Special Trinkets from design doc
  const specialTrinkets = [
    {
      name: "Hourglass of Efficiency",
      description: "Reduces energy cost of all tasks by 10%",
      icon: "⏳",
      specialEffect: "Reduces energy cost by 10%",
      specialEffectId: "ENERGY_REDUCTION_10",
      disciplineBonus: 3,
      focusBonus: 3,
    },
    {
      name: "Phoenix Feather",
      description: "Auto-revive once per week with 50% HP",
      icon: "🪶",
      specialEffect: "Auto-revive once per week with 50% HP",
      specialEffectId: "AUTO_REVIVE_WEEKLY",
      staminaBonus: 5,
      disciplineBonus: 2,
    },
    {
      name: "Tome of Greed",
      description: "+20% XP from all sources",
      icon: "📚",
      specialEffect: "+20% XP from all sources",
      specialEffectId: "XP_BOOST_20",
      focusBonus: 4,
      disciplineBonus: 2,
    },
    {
      name: "Shadow Cloak",
      description: "+25% loot drop rate",
      icon: "🦇",
      specialEffect: "+25% loot drop rate",
      specialEffectId: "LOOT_BOOST_25",
      charismaBonus: 4,
      focusBonus: 2,
    },
    {
      name: "Berserker's Mark",
      description: "+50% boss damage, -10 max HP",
      icon: "⚡",
      specialEffect: "+50% boss damage, -10 max HP",
      specialEffectId: "BOSS_DAMAGE_50",
      strengthBonus: 6,
    },
    {
      name: "Druid's Seed",
      description: "+1 energy regen per day",
      icon: "🌰",
      specialEffect: "+1 energy regen per day",
      specialEffectId: "ENERGY_REGEN_BOOST",
      staminaBonus: 3,
      focusBonus: 3,
    },
    {
      name: "Scholar's Lens",
      description: "Reveals hidden task XP bonuses",
      icon: "🔍",
      specialEffect: "Reveals hidden task XP bonuses",
      specialEffectId: "REVEAL_BONUSES",
      focusBonus: 5,
      disciplineBonus: 2,
    },
    {
      name: "Guild Standard",
      description: "+5% all stats when in a party (future feature)",
      icon: "🚩",
      specialEffect: "+5% all stats when in a party",
      specialEffectId: "PARTY_BOOST_5",
      strengthBonus: 2,
      staminaBonus: 2,
      focusBonus: 2,
      disciplineBonus: 2,
      charismaBonus: 2,
    },
  ];

  const trinkets = [];
  for (const trinket of specialTrinkets) {
    const equipment = await prisma.equipmentDefinition.create({
      data: {
        name: trinket.name,
        description: trinket.description,
        slot: "TRINKET",
        rarity: "LEGENDARY",
        levelRequirement: 10,
        icon: trinket.icon,
        strengthBonus: trinket.strengthBonus || 0,
        staminaBonus: trinket.staminaBonus || 0,
        focusBonus: trinket.focusBonus || 0,
        disciplineBonus: trinket.disciplineBonus || 0,
        charismaBonus: trinket.charismaBonus || 0,
        specialEffect: trinket.specialEffect,
        specialEffectId: trinket.specialEffectId,
      },
    });
    trinkets.push(equipment);
  }
  console.log("✅ Created special trinkets:", trinkets.length);

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
