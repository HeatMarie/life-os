import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { CharacterClass } from "@prisma/client";

// GET /api/character - Get current user's character
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let character = await db.character.findUnique({
      where: { userId: user.id },
    });

    // If no character exists, return null (user needs to create one)
    if (!character) {
      return NextResponse.json({ character: null });
    }

    // Check for energy regeneration based on time since last activity
    const now = new Date();
    const hoursSinceActive =
      (now.getTime() - character.lastActiveAt.getTime()) / 1000 / 60 / 60;

    // Regenerate energy over time (regen rate is per day, so divide by 24 for hourly)
    if (hoursSinceActive >= 1 && character.status !== "DEAD") {
      const energyRegen = Math.floor(
        (character.energyRegenRate / 24) * hoursSinceActive
      );
      if (energyRegen > 0 && character.energy < character.maxEnergy) {
        character = await db.character.update({
          where: { userId: user.id },
          data: {
            energy: Math.min(character.energy + energyRegen, character.maxEnergy),
            lastActiveAt: now,
          },
        });
      }
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error("Error fetching character:", error);
    return NextResponse.json(
      { error: "Failed to fetch character" },
      { status: 500 }
    );
  }
}

// PUT /api/character - Update character
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();

    const character = await db.character.update({
      where: { userId: user.id },
      data: {
        name: body.name,
        class: body.class,
      },
    });

    return NextResponse.json(character);
  } catch (error) {
    console.error("Error updating character:", error);
    return NextResponse.json(
      { error: "Failed to update character" },
      { status: 500 }
    );
  }
}

// POST /api/character - Create character or perform actions (rest, revive)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();

    // Action: Create new character
    if (body.name && body.class) {
      // Check if character already exists
      const existing = await db.character.findUnique({
        where: { userId: user.id },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Character already exists" },
          { status: 400 }
        );
      }

      // Validate class
      const validClasses = Object.values(CharacterClass);
      if (!validClasses.includes(body.class)) {
        return NextResponse.json(
          { error: "Invalid character class" },
          { status: 400 }
        );
      }

      const character = await db.character.create({
        data: {
          userId: user.id,
          name: body.name,
          class: body.class,
          level: 1,
          xp: 0,
          xpToNextLevel: 250,
          hp: 100,
          maxHp: 100,
          energy: 100,
          maxEnergy: 100,
          energyRegenRate: 20,
          status: "ALIVE",
          currentStreak: 0,
          longestStreak: 0,
          streakProtection: 0,
          tasksCompleted: 0,
          bossesDefeated: 0,
          totalXpEarned: 0,
          deathCount: 0,
        },
      });

      return NextResponse.json(character, { status: 201 });
    }

    // Action: Rest
    if (body.action === "rest") {
      const character = await db.character.findUnique({
        where: { userId: user.id },
      });

      if (!character || character.status === "DEAD") {
        return NextResponse.json(
          { error: "Cannot rest while dead" },
          { status: 400 }
        );
      }

      // Full rest restores 50% HP and 100% energy
      const updatedCharacter = await db.character.update({
        where: { userId: user.id },
        data: {
          hp: Math.min(
            character.hp + Math.floor(character.maxHp * 0.5),
            character.maxHp
          ),
          energy: character.maxEnergy,
          lastActiveAt: new Date(),
        },
      });

      return NextResponse.json(updatedCharacter);
    }

    if (body.action === "revive") {
      const character = await db.character.findUnique({
        where: { userId: user.id },
      });

      if (!character || character.status !== "DEAD") {
        return NextResponse.json(
          { error: "Character is not dead" },
          { status: 400 }
        );
      }

      // Revive with 25% HP and 50% energy, lose 10% of total XP
      const xpLoss = Math.floor(character.totalXpEarned * 0.1);
      const updatedCharacter = await db.character.update({
        where: { userId: user.id },
        data: {
          hp: Math.floor(character.maxHp * 0.25),
          energy: Math.floor(character.maxEnergy * 0.5),
          status: "ALIVE",
          totalXpEarned: character.totalXpEarned - xpLoss,
          deathCount: character.deathCount + 1,
        },
      });

      return NextResponse.json({
        character: updatedCharacter,
        xpLost: xpLoss,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error with character action:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
