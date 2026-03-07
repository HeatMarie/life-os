import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  calculateEffectiveMaxHP,
  calculateEffectiveMaxEnergy,
  calculateEffectiveMaxMana,
} from "@/lib/game/stats";

// PUT /api/character/stats - Allocate stat points
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      strength = 0,
      stamina = 0,
      focus = 0,
      discipline = 0,
      charisma = 0,
    } = body;

    // Validate that all values are non-negative integers
    if (
      !Number.isInteger(strength) ||
      !Number.isInteger(stamina) ||
      !Number.isInteger(focus) ||
      !Number.isInteger(discipline) ||
      !Number.isInteger(charisma) ||
      strength < 0 ||
      stamina < 0 ||
      focus < 0 ||
      discipline < 0 ||
      charisma < 0
    ) {
      return NextResponse.json(
        { error: "Invalid stat values. All values must be non-negative integers." },
        { status: 400 }
      );
    }

    // Calculate total points being allocated
    const totalPointsToAllocate = strength + stamina + focus + discipline + charisma;

    if (totalPointsToAllocate === 0) {
      return NextResponse.json(
        { error: "No stat points to allocate" },
        { status: 400 }
      );
    }

    // Get current character
    const character = await db.character.findUnique({
      where: { userId: user.id },
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // Validate that user has enough available points
    if (totalPointsToAllocate > character.statPointsAvailable) {
      return NextResponse.json(
        {
          error: `Not enough stat points. Available: ${character.statPointsAvailable}, Trying to allocate: ${totalPointsToAllocate}`,
        },
        { status: 400 }
      );
    }

    // Calculate new stat values
    const newStrength = character.strength + strength;
    const newStamina = character.stamina + stamina;
    const newFocus = character.focus + focus;
    const newDiscipline = character.discipline + discipline;
    const newCharisma = character.charisma + charisma;

    // Calculate new effective max values for HP, energy, and mana
    const newMaxHP = calculateEffectiveMaxHP(character.maxHp, newStrength, 0);
    const newMaxEnergy = calculateEffectiveMaxEnergy(
      character.maxEnergy,
      newStamina,
      0
    );
    const newMaxMana = calculateEffectiveMaxMana(character.maxMana, newFocus);

    // Calculate HP/Energy/Mana increase to add to current values
    const currentEffectiveMaxHP = calculateEffectiveMaxHP(
      character.maxHp,
      character.strength,
      0
    );
    const currentEffectiveMaxEnergy = calculateEffectiveMaxEnergy(
      character.maxEnergy,
      character.stamina,
      0
    );
    const currentEffectiveMaxMana = calculateEffectiveMaxMana(
      character.maxMana,
      character.focus
    );

    const hpIncrease = newMaxHP - currentEffectiveMaxHP;
    const energyIncrease = newMaxEnergy - currentEffectiveMaxEnergy;
    const manaIncrease = newMaxMana - currentEffectiveMaxMana;

    // Update character with new stats
    const updatedCharacter = await db.character.update({
      where: { userId: user.id },
      data: {
        strength: newStrength,
        stamina: newStamina,
        focus: newFocus,
        discipline: newDiscipline,
        charisma: newCharisma,
        statPointsAvailable: character.statPointsAvailable - totalPointsToAllocate,
        // Increase current HP/Energy/Mana by the amount gained from stat increases
        hp: Math.min(character.hp + hpIncrease, newMaxHP),
        energy: Math.min(character.energy + energyIncrease, newMaxEnergy),
        mana: Math.min(character.mana + manaIncrease, newMaxMana),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      character: updatedCharacter,
      allocated: {
        strength,
        stamina,
        focus,
        discipline,
        charisma,
        total: totalPointsToAllocate,
      },
      newValues: {
        strength: newStrength,
        stamina: newStamina,
        focus: newFocus,
        discipline: newDiscipline,
        charisma: newCharisma,
      },
      resourceChanges: {
        hp: hpIncrease,
        energy: energyIncrease,
        mana: manaIncrease,
      },
    });
  } catch (error) {
    console.error("Error allocating stats:", error);
    return NextResponse.json(
      { error: "Failed to allocate stats" },
      { status: 500 }
    );
  }
}
