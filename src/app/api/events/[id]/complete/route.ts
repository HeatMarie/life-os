import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  EVENT_XP,
  EVENT_PENALTIES,
  EVENT_BOSS_DAMAGE,
  EVENT_HP_REGEN,
  XP_PER_LEVEL_BASE,
} from "@/lib/game/constants";
import { getStreakMultiplier } from "@/lib/game/mechanics";

// Type for event status enum
type EventStatus = "SCHEDULED" | "COMPLETED" | "CANCELED_BY_SELF" | "CANCELED_BY_OTHER" | "MISSED" | "RESCHEDULED";

// Calculate event duration in minutes
function getEventDurationMinutes(startsAt: Date, endsAt: Date): number {
  return Math.max(1, Math.floor((endsAt.getTime() - startsAt.getTime()) / (1000 * 60)));
}

// Calculate XP reward for completing an event
function calculateEventXP(durationMinutes: number): number {
  const xp = Math.floor((durationMinutes / 30) * EVENT_XP.XP_PER_30_MINS);
  return Math.max(EVENT_XP.MIN_XP, Math.min(xp, EVENT_XP.MAX_XP));
}

// Calculate HP penalty for missing/canceling
function calculateEventPenalty(durationMinutes: number, wasSelfCanceled: boolean): number {
  const durationHours = durationMinutes / 60;
  const basePenalty = wasSelfCanceled ? EVENT_PENALTIES.CANCELED_SELF_BASE : EVENT_PENALTIES.MISSED_BASE;
  const penalty = basePenalty + Math.floor(durationHours * EVENT_PENALTIES.HP_PER_HOUR);
  return Math.min(penalty, EVENT_PENALTIES.MAX_PENALTY);
}

// Calculate boss damage for project-linked events
function calculateEventBossDamage(durationMinutes: number): number {
  const damage = Math.floor((durationMinutes / 30) * EVENT_BOSS_DAMAGE.DAMAGE_PER_30_MINS);
  return Math.max(EVENT_BOSS_DAMAGE.MIN_DAMAGE, Math.min(damage, EVENT_BOSS_DAMAGE.MAX_DAMAGE));
}

// Calculate HP restoration from completing event
function calculateEventHPRegen(durationMinutes: number): number {
  const durationHours = durationMinutes / 60;
  const regen = EVENT_HP_REGEN.BASE + Math.floor(durationHours * EVENT_HP_REGEN.PER_HOUR);
  return Math.min(regen, EVENT_HP_REGEN.MAX);
}

// POST /api/events/[id]/complete - Complete or update event status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json().catch(() => ({}));
    const newStatus: EventStatus = body.status || "COMPLETED";

    // Get the event with project and its boss
    const event = await db.event.findFirst({
      where: { id, userId: user.id },
      include: {
        project: {
          include: { boss: true },
        },
        user: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Don't process if already in a final state
    if (event.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: `Event already ${event.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Get character
    const character = await db.character.findUnique({
      where: { userId: event.userId },
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const durationMinutes = getEventDurationMinutes(event.startsAt, event.endsAt);
    const isActionItem = event.eventType === "ACTION_ITEM";

    let xpEarned = 0;
    let hpChange = 0;
    let bossDamage = 0;
    let storyEntryType: string;
    let storyTitle: string;
    let storyNarrative: string;

    // Process based on status
    if (newStatus === "COMPLETED" && isActionItem) {
      // Award XP for completing action items
      const baseXP = calculateEventXP(durationMinutes);
      const streakMultiplier = getStreakMultiplier(character.currentStreak);
      xpEarned = Math.floor(baseXP * streakMultiplier);
      
      // HP restoration
      hpChange = calculateEventHPRegen(durationMinutes);

      // Boss damage if linked to project with boss
      if (event.project?.boss && event.project.boss.status === "ACTIVE") {
        bossDamage = calculateEventBossDamage(durationMinutes);
      }

      storyEntryType = "EVENT_COMPLETED";
      storyTitle = `Completed: ${event.title}`;
      storyNarrative = `The hero completed "${event.title}", gaining ${xpEarned} XP and restoring ${hpChange} HP.${bossDamage > 0 ? ` Dealt ${bossDamage} damage to the boss!` : ""}`;
    } else if (newStatus === "MISSED" && isActionItem) {
      // Penalty for missing action items
      hpChange = -calculateEventPenalty(durationMinutes, false);

      storyEntryType = "EVENT_MISSED";
      storyTitle = `Missed: ${event.title}`;
      storyNarrative = `The hero missed "${event.title}" and took ${Math.abs(hpChange)} damage. Sometimes the path is unclear, but tomorrow brings new opportunities.`;
    } else if (newStatus === "CANCELED_BY_SELF" && isActionItem) {
      // Penalty for self-canceling (but less than missing)
      hpChange = -calculateEventPenalty(durationMinutes, true);

      storyEntryType = "EVENT_CANCELED";
      storyTitle = `Canceled: ${event.title}`;
      storyNarrative = `The hero chose to cancel "${event.title}" and took ${Math.abs(hpChange)} damage. Sometimes retreat is wisdom, sometimes it's just retreat.`;
    } else if (newStatus === "CANCELED_BY_OTHER" || newStatus === "RESCHEDULED") {
      // No penalty, just a story note
      storyEntryType = "EVENT_RESCHEDULED";
      storyTitle = `${newStatus === "CANCELED_BY_OTHER" ? "Canceled" : "Rescheduled"}: ${event.title}`;
      storyNarrative = newStatus === "CANCELED_BY_OTHER"
        ? `The event "${event.title}" was canceled by the organizer. The universe grants a moment of respite.`
        : `The event "${event.title}" was rescheduled. The tides of time shift, but the quest continues.`;
    } else {
      // REMINDER events or other states - just update status, no game effects
      storyEntryType = "EVENT_COMPLETED";
      storyTitle = `Noted: ${event.title}`;
      storyNarrative = `The reminder "${event.title}" has passed.`;
    }

    // Calculate new XP and level
    let newXP = character.xp + xpEarned;
    let newLevel = character.level;
    let newXPToNext = character.xpToNextLevel;
    let leveledUp = false;
    const levelUps: number[] = [];

    while (newXP >= newXPToNext) {
      newXP -= newXPToNext;
      newLevel += 1;
      newXPToNext = Math.floor(XP_PER_LEVEL_BASE * Math.pow(1.15, newLevel - 1));
      leveledUp = true;
      levelUps.push(newLevel);
    }

    // Calculate new HP (capped at maxHp, floored at 0)
    const newHP = Math.min(
      Math.max(0, character.hp + hpChange),
      character.maxHp + (leveledUp ? levelUps.length * 5 : 0)
    );

    // Check for death
    const isDead = newHP === 0;
    const newStatus_: "ALIVE" | "DEAD" | "EXHAUSTED" = isDead ? "DEAD" : character.status;

    // Update character
    await db.character.update({
      where: { id: character.id },
      data: {
        xp: newXP,
        level: newLevel,
        xpToNextLevel: newXPToNext,
        hp: newHP,
        maxHp: leveledUp ? character.maxHp + levelUps.length * 5 : undefined,
        maxEnergy: leveledUp ? character.maxEnergy + levelUps.length * 3 : undefined,
        totalXpEarned: character.totalXpEarned + xpEarned,
        status: newStatus_,
        diedAt: isDead ? new Date() : character.diedAt,
        lastActiveAt: new Date(),
      },
    });

    // Update boss if damage dealt
    if (bossDamage > 0 && event.project?.boss) {
      const boss = event.project.boss;
      const newBossHP = Math.max(0, boss.hp - bossDamage);
      const bossDefeated = newBossHP === 0;

      await db.boss.update({
        where: { id: boss.id },
        data: {
          hp: newBossHP,
          status: bossDefeated ? "DEFEATED" : boss.status,
          defeatedAt: bossDefeated ? new Date() : null,
        },
      });

      if (bossDefeated) {
        // Award boss XP
        await db.character.update({
          where: { id: character.id },
          data: {
            xp: { increment: boss.xpReward },
            bossesDefeated: { increment: 1 },
            totalXpEarned: { increment: boss.xpReward },
          },
        });

        // Create boss defeat story entry
        await db.storyEntry.create({
          data: {
            userId: event.userId,
            entryType: "BOSS_DEFEATED",
            title: `Boss Defeated: ${boss.name}`,
            narrative: `The hero dealt the final blow to ${boss.name}! ${boss.xpReward} XP earned in victory!`,
            xpEarned: boss.xpReward,
            bossDamage,
          },
        });
      }
    }

    // Update event status
    const updatedEvent = await db.event.update({
      where: { id },
      data: {
        status: newStatus,
        xpEarned: xpEarned > 0 ? xpEarned : null,
        hpPenalty: hpChange < 0 ? Math.abs(hpChange) : null,
        bossDamage: bossDamage > 0 ? bossDamage : null,
      },
      include: {
        area: true,
        project: true,
      },
    });

    // Create story entry
    const storyEntry = await db.storyEntry.create({
      data: {
        userId: event.userId,
        entryType: storyEntryType as any,
        title: storyTitle,
        narrative: storyNarrative,
        eventId: event.id,
        xpEarned: xpEarned > 0 ? xpEarned : null,
        hpChange: hpChange !== 0 ? hpChange : null,
        bossDamage: bossDamage > 0 ? bossDamage : null,
      },
    });

    // Create level up story entries
    for (const level of levelUps) {
      await db.storyEntry.create({
        data: {
          userId: event.userId,
          entryType: "LEVEL_UP",
          title: `Level Up! Level ${level}`,
          narrative: `The hero has reached level ${level}! +5 Max HP, +3 Max Energy. The journey continues!`,
          xpEarned: 0,
        },
      });
    }

    return NextResponse.json({
      event: updatedEvent,
      storyEntry,
      rewards: {
        xpEarned,
        hpChange,
        bossDamage,
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
        isDead,
      },
    });
  } catch (error) {
    console.error("Error completing event:", error);
    return NextResponse.json(
      { error: "Failed to complete event" },
      { status: 500 }
    );
  }
}
