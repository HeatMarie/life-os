# Life-OS: Game Design Document

> Version: 1.0 — Final Design
> Last Updated: March 2026

This document is the **single source of truth** for all game mechanics, numbers, formulas, and systems in Life-OS. All implementation work should reference this document.

---

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Character Classes](#2-character-classes)
3. [Stat System](#3-stat-system)
4. [Ability System](#4-ability-system)
5. [Equipment System](#5-equipment-system)
6. [Difficulty Tiers](#6-difficulty-tiers)
7. [XP & Leveling](#7-xp--leveling)
8. [HP & Energy Systems](#8-hp--energy-systems)
9. [Boss System](#9-boss-system)
10. [Quest System](#10-quest-system)
11. [Loot & Gold System](#11-loot--gold-system)
12. [Guild System](#12-guild-system)
13. [Implementation Phases](#13-implementation-phases)

---

## 1. Game Overview

Life-OS is a **gamified life/project management application** that transforms productivity into an RPG experience. Users complete real-life tasks to earn XP, level up their character, fight bosses (projects), and collect loot—keeping them engaged and motivated.

### Core Loop

```
Complete Task → Earn XP + Loot + Boss Damage
                        ↓
              Level Up → Gain Stat Points → Allocate Stats
                        ↓
             Defeat Boss → Major Rewards + Gold
                        ↓
              Spend Gold in Shop → Permanent Upgrades
```

### Design Pillars

1. **Authentic RPG feel** — classes, stats, abilities, equipment all matter
2. **Real-world mapping** — every mechanic maps to a genuine productivity concept
3. **Configurable depth** — Casual to Hardcore, users choose how much complexity they want
4. **Social layer** — guilds let groups collaborate on shared goals

---

## 2. Character Classes

Seven classes, each tied to a life domain and providing unique bonuses. Classes are chosen at character creation and cannot be changed.

### Class Definitions

| Class | Domain | Primary Bonus | Secondary Bonus | Icon |
|-------|--------|---------------|-----------------|------|
| WARRIOR | Work | +25% XP from Work tasks | +20 max HP | ⚔️ |
| MAGE | Side Projects | +25% XP from Side Projects | +20 energy regen/day | 🔮 |
| ROGUE | Home | +25% XP from Home tasks | +15% loot drop rate | 🗡️ |
| BARD | Writing | +25% XP from Writing | +1 streak shield/week | 🎭 |
| DRUID | Health | +25% XP from Health activities | Energy costs –10% | 🌿 |
| CLERIC | Social | +25% XP from Social/Meeting tasks | +10 HP on task completion | ✨ |
| NECROMANCER | Any | +10% XP bonus on all tasks | Reduced death penalty (–50% XP loss on death) | 💀 |

### Class Stat Affinities

Each class has a **primary stat** that scales better with class-specific activities:

| Class | Primary Stat | Effect |
|-------|-------------|--------|
| WARRIOR | Strength | +1% boss damage per Strength point |
| MAGE | Focus | +1% XP bonus per Focus point |
| ROGUE | Luck | +0.5% loot drop rate per Luck point |
| BARD | Charisma | +1 streak protection per 10 Charisma |
| DRUID | Vitality | +2 max HP per Vitality point (base rate) |
| CLERIC | Discipline | +1% HP regen per Discipline point |
| NECROMANCER | Luck | +0.5% chance to negate death per Luck point |

---

## 3. Stat System

### Overview

Characters have **6 stats total**: 5 allocatable stats that players assign points to on level-up, and 1 derived stat (Vitality) that is calculated from the character's level and Discipline (DIS).

### Allocatable Stats (5)

Players receive **3 stat points per level-up** to distribute freely.

| Stat | Abbreviation | Primary Effect | Secondary Effect |
|------|-------------|----------------|-----------------|
| Strength | STR | +1% XP from URGENT/HIGH priority tasks per point | +0.5% boss damage per point |
| Focus | FOC | +1% XP on all tasks per point | –5% chance of distraction penalty per 5 pts |
| Discipline | DIS | –2% energy cost per point (capped at –40%) | +1% HP regen rate per point |
| Charisma | CHA | +1% XP from Social/Meeting tasks per point | +1 streak protection per 10 points |
| Luck | LCK | +0.5% loot drop rate per point | +0.25% chance of bonus XP roll per point |

### Derived Stat (1)

| Stat | Formula | Effect |
|------|---------|--------|
| Vitality | `10 + (level × 2) + (DIS × 1)` | Determines max HP pool |

**Note:** Vitality is not directly allocatable. It grows passively with level and scales with Discipline investment.

### Stat Caps

- Maximum stat points in any single stat: **50**
- Total stat points ever allocated by level 50: `3 × 49 = 147`
- This ensures builds remain varied and interesting at max level

### Stat Reset

- One free stat reset per character lifetime
- Additional resets cost 500 Gold (shop item)

---

## 4. Ability System

### Overview

**42 total abilities** across 7 classes, 6 per class. Abilities are grouped into **3 ability tiers** (2 abilities per tier per class). Higher-tier abilities require the character to have at least one lower-tier ability from the same class active.

### Ability Tier Requirements

| Tier | Name | Unlock Level | Requirement |
|------|------|-------------|-------------|
| 1 | Apprentice | Level 5 (first), Level 10 (second) | None |
| 2 | Journeyman | Level 15 (first), Level 20 (second) | 1 Tier 1 ability active |
| 3 | Master | Level 25 (first), Level 30 (second) | 1 Tier 2 ability active |

Players choose **one ability per tier slot** — there is no "wrong" choice, just different playstyles.

### WARRIOR Abilities

| Tier | Name | Effect |
|------|------|--------|
| T1-A | Battle Cry | URGENT tasks grant +15% additional XP |
| T1-B | Iron Will | Gain +3 max HP permanently each level-up |
| T2-A | Berserker Mode | Completing 3+ URGENT tasks in one day triggers 1.5× XP on the next task |
| T2-B | Shield Wall | Task completion restores +5 HP (additive with base regen) |
| T3-A | Warlord's March | If all URGENT tasks are completed each week, earn a 500 XP bonus |
| T3-B | Death Defiance | Once per week, survive a lethal HP event at 1 HP instead of dying |

### MAGE Abilities

| Tier | Name | Effect |
|------|------|--------|
| T1-A | Arcane Focus | Side Project tasks grant +15% additional XP |
| T1-B | Mana Well | Energy regeneration increased by +10/day |
| T2-A | Spell Surge | After completing a Side Project task, next task of any type earns +25% XP |
| T2-B | Energy Tap | Gain +15 energy whenever a boss takes damage from your tasks |
| T3-A | Grand Arcanum | Side Project boss defeat grants double XP reward |
| T3-B | Infinite Mana | Maximum energy cap increased by +50 permanently |

### ROGUE Abilities

| Tier | Name | Effect |
|------|------|--------|
| T1-A | Pickpocket | +20% loot drop rate on all tasks |
| T1-B | Shadow Step | Home tasks cost –15% less energy |
| T2-A | Treasure Hunter | Rare+ loot drop rate increased by +10% |
| T2-B | Quick Hands | Completing 5+ tasks in a day grants a bonus common loot drop |
| T3-A | Master Thief | Once per week, duplicate the loot from any single task completion |
| T3-B | Shadow Realm | Once per day, complete a LOW priority task with zero energy cost |

### BARD Abilities

| Tier | Name | Effect |
|------|------|--------|
| T1-A | Epic Tale | Writing tasks grant +15% additional XP |
| T1-B | Inspire | Gain +1 streak shield per week (stacks with base class bonus, total +2/week) |
| T2-A | Battle Hymn | For every 7-day streak milestone reached, earn +200 bonus XP |
| T2-B | Song of Rest | Daily streak is maintained even if only 1 task is completed |
| T3-A | Legend's Saga | Streak multiplier caps at 2.5× instead of 2.0× |
| T3-B | Undying Song | Streak cannot drop below 3 days even if broken (minimum 3-day streak preserved) |

### DRUID Abilities

| Tier | Name | Effect |
|------|------|--------|
| T1-A | Nature's Gift | Health-tracking activities (steps, sleep, workouts) grant +15% additional XP |
| T1-B | Resilience | All energy costs reduced by –10% |
| T2-A | Earthbound | Logging sleep data restores +10 HP |
| T2-B | Grove's Blessing | Hitting daily step goal grants +20 energy next day |
| T3-A | Primal Form | Once per week, set energy to maximum regardless of current value |
| T3-B | Ancient Grove | Maximum energy cap increased by +30; energy never drops below 20% max |

### CLERIC Abilities

| Tier | Name | Effect |
|------|------|--------|
| T1-A | Holy Light | Social and Meeting tasks grant +15% additional XP |
| T1-B | Healing Word | Completing any task restores +8 HP (instead of base formula) |
| T2-A | Aura of Protection | HP cannot drop below 15 from any single damage event |
| T2-B | Divine Favor | Completing a task when HP is below 30% grants +50% XP bonus |
| T3-A | Resurrection | Death cooldown reduced from 24 hours to 12 hours |
| T3-B | Sacred Shield | Once per week, completely negate one HP loss event |

### NECROMANCER Abilities

| Tier | Name | Effect |
|------|------|--------|
| T1-A | Dark Harvest | All tasks grant +10% additional XP (all domains) |
| T1-B | Undying | XP loss on death reduced from 10% to 0% |
| T2-A | Soul Drain | Defeating a boss restores HP to 50% if below 50% |
| T2-B | Raise Dead | Broken streaks of 7+ days can be revived once per month for 200 Gold |
| T3-A | Lich Form | After dying and respawning, gain 2× XP for 24 hours |
| T3-B | Death's Door | When HP is below 10%, all XP gains are doubled |

---

## 5. Equipment System

### Overview

Equipment provides **passive stat bonuses** and is collected through boss defeat loot, task completion drops, and the Gold shop. Characters have **6 equipment slots**.

### Equipment Slots

| Slot | Name | Primary Stat Bonus |
|------|------|-------------------|
| HEAD | Helm | Focus or Discipline |
| CHEST | Armor | Vitality (max HP) or Strength |
| HANDS | Gloves | Luck or Strength |
| FEET | Boots | Discipline or Focus |
| WEAPON | Weapon | Strength or Focus (class-dependent) |
| ACCESSORY | Amulet/Ring | Any stat, often mixed |

### Item Rarities & Stat Ranges

| Rarity | Stat Bonus Range | Drop Source |
|--------|-----------------|-------------|
| COMMON | +1–3 to one stat | Task completion (10% chance) |
| RARE | +3–6 to one stat, or +2–3 to two stats | Task completion (3%), boss defeat |
| EPIC | +6–10 to one stat, or +4–6 to two stats | Boss defeat, shop |
| LEGENDARY | +10–15 to one stat, or +6–10 to two stats | Boss defeat (rare), shop (expensive) |

### Class Equipment Sets

Each class has a **thematic set** of 6 items (one per slot). Equipping 3+ set pieces grants a **Set Bonus**; equipping all 6 grants the **Full Set Bonus**.

| Class | Set Name | 3-Piece Bonus | 6-Piece Bonus |
|-------|----------|--------------|---------------|
| WARRIOR | Iron Sentinel Set | +10 max HP | +20% XP from Work + 15% boss damage |
| MAGE | Arcane Weave Set | +15 max energy | +30% XP from Side Projects + energy never depletes below 10 |
| ROGUE | Shadow Veil Set | +10% loot rate | +25% loot rate + 1 free loot re-roll per day |
| BARD | Troubadour's Garb | +1 streak shield/week | +25% XP from Writing + streak multiplier +0.25 |
| DRUID | Grove Warden Set | –15% energy cost | –25% energy cost + +30 max energy |
| CLERIC | Sacred Vestments | +10 HP regen/task | +20 HP regen/task + death cooldown halved |
| NECROMANCER | Lich's Regalia | XP loss on death = 0 | Double XP for 48h after death + +15% XP all tasks |

### Equipment Upgrades

Equipment can be upgraded using Gold and crafting materials (dropped from bosses):

| Upgrade Level | Cost | Effect |
|--------------|------|--------|
| +1 | 50 Gold + 2 Iron Scraps | +1 to all stat bonuses on item |
| +2 | 100 Gold + 5 Iron Scraps | +2 to all stat bonuses |
| +3 | 200 Gold + 10 Iron Scraps + 1 Boss Core | +3 to all stat bonuses + unlock item's hidden effect |
| Max (+5) | Expensive | Item glows, max bonuses, exclusive visual |

**Item upgrade cap**: +5 (items cannot be upgraded beyond +5).

### Crafting Materials

| Material | Source | Use |
|----------|--------|-----|
| Iron Scrap | Task completion (5% chance) | Equipment upgrades |
| Boss Core | Boss defeat (guaranteed) | High-tier upgrades |
| Arcane Dust | Disenchanting equipment | Reforging stats |
| Life Essence | 7-day streak milestone | LEGENDARY crafts |

---

## 6. Difficulty Tiers

### Overview

Difficulty tiers are **game depth settings** that control how complex and punishing the RPG mechanics are. Players choose their tier at character creation and can adjust it in Settings (with a 7-day cooldown between changes).

### Tiers

#### Casual

*"Productivity first. The RPG is flavor."*

| Feature | Setting |
|---------|---------|
| Boss attacks on overdue tasks | Disabled |
| Energy system | Simplified (no burnout state) |
| HP loss from tasks | Disabled |
| Character death | Disabled |
| Stats | Basic only (no allocations) |
| Equipment | Visual only (no stat effects) |
| Abilities | Disabled |
| XP multipliers | Active (progress feels faster) |
| Streak system | Active |
| Loot drops | Active (cosmetic rewards) |

#### Balanced *(default)*

*"Full RPG experience with safety nets."*

| Feature | Setting |
|---------|---------|
| Boss attacks on overdue tasks | Enabled (daily check) |
| Energy system | Full (burnout state possible) |
| HP loss from tasks | Enabled (from overdue tasks) |
| Character death | Enabled (24-hour cooldown respawn) |
| Stats | Full (3 points/level-up) |
| Equipment | Full stat effects |
| Abilities | Enabled (unlock with level) |
| XP multipliers | Standard |
| Streak system | Active |
| Loot drops | Full system |

#### Hardcore

*"Unforgiving. Every missed task has consequences."*

| Feature | Setting |
|---------|---------|
| Boss attacks on overdue tasks | Enabled (hourly check) |
| Energy system | Strict (longer recovery, lower cap) |
| HP loss from tasks | Increased (1.5× damage) |
| Character death | Enabled (24-hour cooldown + XP penalty –10%) |
| Stats | Full + no free reset |
| Equipment | Full stat effects + item degradation |
| Abilities | Enabled |
| XP multipliers | Reduced (progress is earned) |
| Streak system | Active (shields disabled) |
| Loot drops | Full system + higher drop rates as compensation |

### Changing Difficulty

- Free to change anytime from Casual → Balanced
- Downgrading Hardcore → Balanced requires 7-day cooldown
- Upgrading to Hardcore requires explicit confirmation dialog

---

## 7. XP & Leveling

### XP Rewards by Task Priority

| Priority | Base XP | Energy Cost |
|----------|---------|-------------|
| URGENT | 120 | 35 |
| HIGH | 90 | 25 |
| MEDIUM | 60 | 15 |
| LOW | 30 | 10 |
| NONE | 20 | 5 |

### Level Formula

```
xpRequiredForLevel(n) = 250 × n^1.5
```

| Level | XP Required | Cumulative XP |
|-------|------------|--------------|
| 1→2 | 250 | 250 |
| 5→6 | 2,795 | 7,085 |
| 10→11 | 7,906 | 29,141 |
| 20→21 | 22,360 | 144,477 |
| 30→31 | 41,090 | 418,459 |
| 50→51 | 88,388 | 1,500,000 (approx) |

### Streak Multipliers

| Streak Days | Multiplier |
|------------|-----------|
| 0–2 | 1.0× |
| 3–6 | 1.25× |
| 7–13 | 1.5× |
| 14–29 | 1.75× |
| 30+ | 2.0× |
| 30+ (Bard T3 Legend's Saga) | 2.5× |

### Class XP Bonuses

Applied on top of base XP for relevant task types:

- Most classes: +25% XP for their domain tasks; Necromancer: +10% XP on all tasks (no domain bonus)
- Each Focus stat point: +1% XP on all tasks
- Each Strength stat point: +1% XP on URGENT/HIGH tasks

### Level-Up Rewards

On each level-up, the character receives:
- **3 stat points** to allocate (Balanced/Hardcore)
- **Ability unlock notification** at levels 5, 10, 15, 20, 25, 30
- **50 Gold** base (scales: +5 Gold per 5 levels)
- **Loot drop roll** (guaranteed at least COMMON rarity)

---

## 8. HP & Energy Systems

### HP System

| Event | HP Change |
|-------|----------|
| Task completion (URGENT) | +10 HP |
| Task completion (HIGH) | +8 HP |
| Task completion (MEDIUM) | +5 HP |
| Task completion (LOW) | +3 HP |
| Task completion (NONE) | +2 HP |
| Overdue task (URGENT) | –20 HP |
| Overdue task (HIGH) | –15 HP |
| Overdue task (MEDIUM) | –10 HP |
| Overdue task (LOW) | –5 HP |
| Overdue task (NONE) | –3 HP |
| Boss attack (daily) | –5 to –30 HP (based on boss tier) |
| Death threshold | 0 HP |

**Base max HP**: 100  
**WARRIOR bonus**: +20 max HP  
**Vitality formula**: `maxHP = 100 + (Vitality × 2)`

### HP Danger Thresholds

| HP % | Status | UI Effect |
|------|--------|----------|
| >50% | Normal | Standard display |
| 26–50% | Warning | Yellow HP bar |
| 11–25% | Danger | Red HP bar, warning toast |
| 1–10% | Critical | Pulsing red HP bar, urgent warning |
| 0 | Dead | Death screen, 24h cooldown |

### Energy System

| Event | Energy Change |
|-------|--------------|
| Task completion | –energyCost (varies by priority) |
| Daily reset (base) | +20 energy |
| Daily reset (MAGE bonus) | +20 energy |
| Sleep log (per hour 6–9h) | +5 energy |
| Workout completion | +10 energy |
| Maximum daily regen | 50 energy |
| DRUID T3 Primal Form | Reset to max once/week |

**Base max energy**: 100  
**Weekly energy budget**: 500 (resets Monday)

### Burnout State (Exhausted)

When energy reaches 0:
- Character enters **EXHAUSTED** status
- All tasks can still be completed but grant no XP
- HP loss from overdue tasks doubles
- Recovery: rest (next day reset) or Health Potion item

---

## 9. Boss System

### Boss Creation

Bosses are created when a Project is assigned a boss. Boss HP scales with project complexity:

```
bossHP = baseDifficulty × taskCount × priorityMultiplier
```

| Difficulty | Base HP |
|-----------|---------|
| Easy | 200 |
| Normal | 500 |
| Hard | 1000 |
| Legendary | 2500 |

### Boss Damage Per Task

| Priority | Damage |
|----------|--------|
| URGENT | 25 |
| HIGH | 20 |
| MEDIUM | 15 |
| LOW | 10 |
| NONE | 5 |

### Boss Defeat Rewards

| Reward | Amount |
|--------|--------|
| XP | 500 base (scales with boss HP) |
| Gold | 100–500 (scales with difficulty) |
| Loot rolls | 3–5 rolls (higher rarity weighting) |
| Boss Core (crafting) | 1 guaranteed |

### Boss Escape (Deadline Missed)

When a project deadline passes with the boss still alive:
- Boss is marked ESCAPED
- Character takes HP damage: `bossHP_remaining × 0.1` (capped at 30 HP)
- Story entry is created about the failure
- Boss can be re-activated on the project if needed

### Guild Bosses (Shared)

- Boss HP scaled: `baseDifficulty × (1 + 0.25 × memberCount)`
- All contributing members get XP and loot rolls on defeat
- Combined boss damage from all members

---

## 10. Quest System

### Quest Types

| Type | Description | XP Multiplier |
|------|-------------|--------------|
| MAIN_QUEST | Critical path tasks linked to active projects | 1.5× |
| DAILY_QUEST | Habits and recurring tasks | 1.0× (+ streak bonus) |
| SIDE_QUEST | All other tasks (default) | 1.0× |

### Daily Habits

- Users define recurring habits (e.g., "Exercise", "Journal", "Read 30 min")
- Each habit has: frequency, time of day, XP reward, HP restore on completion
- Missed habits: no HP loss (they are positive reinforcement, not punishment)
- Streak tracked per habit independently from main streak

### AI Daily Challenges

- Daily AI-generated challenge suggestions based on user patterns
- Examples: "Complete 3 DEEP_WORK tasks today", "Don't miss any meetings"
- Completing a suggested challenge: +200 XP bonus
- Max 1 active AI challenge per day

---

## 11. Loot & Gold System

### Loot Drop Table (Task Completion)

| Item | Rarity | Drop Chance | Effect |
|------|--------|-------------|--------|
| XP Shard | COMMON | 30% | +25 XP immediately |
| Energy Potion | COMMON | 20% | +25 Energy |
| Health Potion | COMMON | 20% | +25 HP |
| XP Crystal | RARE | 15% | +75 XP immediately |
| Streak Shield | RARE | 10% | Protect streak for 1 day |
| Double XP Token | EPIC | 4% | Next task 2× XP |
| Boss Bane | LEGENDARY | 1% | 50% extra boss damage (one use) |
| Revive Token | LEGENDARY | 0.5% | Skip death cooldown |
| Iron Scrap | COMMON | 5% | Equipment upgrade material |

**Base drop trigger chance**: 25% per task completion  
**ROGUE bonus**: +15% base drop trigger  
**Luck stat**: +0.5% trigger chance per point

### Gold System

Gold is the **premium currency** earned in-game (no real money):

| Source | Gold Earned |
|--------|-------------|
| Level-up | 50 base + 5 per 5 levels |
| Boss defeat | 100–500 (scales with difficulty) |
| Achievement unlock | 25–200 (varies by rarity) |
| 7-day streak milestone | 50 |
| 30-day streak milestone | 200 |

### Gold Shop

| Item | Cost | Effect |
|------|------|--------|
| Health Potion | 30 Gold | +25 HP |
| Energy Potion | 30 Gold | +25 Energy |
| XP Crystal | 50 Gold | +75 XP |
| Streak Shield (3-pack) | 75 Gold | 3 days of streak protection |
| Double XP Token | 100 Gold | Next task 2× XP |
| Stat Reset | 500 Gold | Reallocate all stat points |
| Streak Revive | 200 Gold | Restore streak of 7+ days (Necromancer: free once/month) |
| Equipment Slot Unlock | 1000 Gold | Unlock an accessory slot (total 2 accessory slots) |
| Name Change Token | 150 Gold | Rename character |
| Avatar Slot | 200 Gold | Unlock additional avatar customization slot |

---

## 12. Guild System

### Core Concepts

Guilds (also called "Parties" for smaller groups) allow users to:
- Collaborate on shared projects with combined boss damage
- Complete guild-wide challenges together
- Earn guild XP that unlocks collective perks
- See activity feeds of guild members' achievements
- Compete on guild leaderboards

### Guild XP & Leveling

```
guildXpForLevel(n) = 1000 × n^1.8
```

| Event | Guild XP |
|-------|---------|
| Any member completes task | +10 |
| Shared boss defeated | +100 × difficultyMultiplier |
| Guild challenge completed | Varies per challenge |
| Guild member levels up | +50 |

### Guild Perks by Level

| Level | Perk |
|-------|------|
| 2 | +5% XP bonus for all members |
| 5 | Shared loot pool unlocked |
| 10 | Guild challenges unlocked |
| 15 | +10% XP bonus (stacks with Level 2 bonus) + Guild achievements |
| 20 | Custom guild cosmetics |

### Guild Mechanics

**Guild Size:**
```
maxMembers = 5 + (guildLevel × 2)
```

**Shared Bosses:**
- Boss HP: `baseDifficulty × (1 + 0.25 × memberCount)`
- All contributing members receive XP + loot on defeat
- Damage tracked per member for leaderboard

**Guild Challenges (Examples):**
- "Complete 50 tasks as a guild this week" → +500 Guild XP
- "Every member maintain 3+ day streak" → +300 Guild XP + loot for all
- "Defeat 3 bosses together" → +750 Guild XP

**Permissions by Role:**
- **Leader**: All permissions, transfer leadership, disband guild
- **Officer**: Invite/kick members, create guild projects, manage challenges
- **Member**: View guild, contribute to projects, see activity feed

### Database Models (Planned)

```prisma
model Guild {
  id          String   @id @default(cuid())
  name        String
  description String?
  level       Int      @default(1)
  xp          Int      @default(0)
  inviteCode  String   @unique @default(cuid())
  maxMembers  Int      @default(5)
  createdAt   DateTime @default(now())
  
  members     GuildMember[]
  projects    GuildProject[]
  challenges  GuildChallenge[]
  activities  GuildActivity[]
}

enum GuildRole {
  LEADER
  OFFICER
  MEMBER
}
```

---

## 13. Implementation Phases

### Phase 1: Authentication & Multi-User Foundation ✅ MOSTLY COMPLETE

| Task | Status |
|------|--------|
| 1.1: Supabase Auth Helpers (`getAuthenticatedUser`, `requireAuth`) | ✅ Complete |
| 1.2: Auth Pages (login, register, OAuth callback) | ✅ Complete |
| 1.3: Auth Middleware (route protection) | ✅ Complete |
| 1.4: Migrate API Routes (all routes use `requireAuth`) | ✅ Complete |
| 1.5: Session Provider (client-side auth context, user menu) | ⬅️ CURRENT |

### Phase 2: Character Stats & Equipment System

| Task | Description |
|------|-------------|
| 2.1 | Add `Stats` model and `statPoints` to Character schema |
| 2.2 | Add `Equipment` and `EquipmentItem` models |
| 2.3 | Update `CharacterClass` enum to include all 7 classes |
| 2.4 | Implement `calculateEffectiveStats()` function |
| 2.5 | Integrate stats with XP/HP/Energy calculations |
| 2.6 | Create stat allocation UI (level-up modal) |
| 2.7 | Create equipment panel UI |
| 2.8 | Implement equipment drops on boss defeat |

### Phase 3: Ability System

| Task | Description |
|------|-------------|
| 3.1 | Add `Ability` model to schema (class, tier, name, effect definition) |
| 3.2 | Add `CharacterAbility` junction (active abilities per character) |
| 3.3 | Define all 42 ability effect functions in `src/lib/game/abilities.ts` |
| 3.4 | Integrate abilities into XP/HP calculations (passive effects) |
| 3.5 | Build ability selection UI (displayed on level-up at unlock levels) |
| 3.6 | Add ability display to character sheet |

### Phase 4: Quest Type System

| Task | Description |
|------|-------------|
| 4.1 | Add `QuestType` enum (MAIN_QUEST, DAILY_QUEST, SIDE_QUEST) |
| 4.2 | Add `questType` field to Task (default SIDE_QUEST) |
| 4.3 | Create `DailyHabit` model (recurring habits) |
| 4.4 | Build habits API and habits UI |
| 4.5 | Implement AI-suggested daily challenges |
| 4.6 | Add quest type selector to task creation UI |

### Phase 5: Boss Attack & Stakes

| Task | Description |
|------|-------------|
| 5.1 | Create deadline monitoring system (cron/check endpoint) |
| 5.2 | Implement boss attack on overdue MAIN_QUEST tasks |
| 5.3 | Add dramatic attack notifications (toasts, HP bar animations) |
| 5.4 | Build full-screen death/respawn UI experience |
| 5.5 | Implement emergency respawn via task completion |

### Phase 6: Game Depth Settings (Difficulty Tiers)

| Task | Description |
|------|-------------|
| 6.1 | Create `GameSettings` model with difficulty tier and feature toggles |
| 6.2 | Build `/settings` page with difficulty selector and individual toggles |
| 6.3 | Implement Casual/Balanced/Hardcore presets |
| 6.4 | Apply conditional logic throughout app based on settings |
| 6.5 | Add settings migration (existing users default to Balanced) |

### Phase 7: Character Creation Wizard

| Task | Description |
|------|-------------|
| 7.1 | Build multi-step character creation flow |
| 7.2 | Step 1: Character name |
| 7.3 | Step 2: Class selection with all 7 classes and bonus previews |
| 7.4 | Step 3: Difficulty tier preset (Casual/Balanced/Hardcore) |
| 7.5 | Step 4: Initial focus areas (optional) |
| 7.6 | Onboarding tutorial overlay |

### Phase 8: Guilds & Social Features

| Task | Description |
|------|-------------|
| 8.1 | Create Guild, GuildMember, GuildProject, GuildChallenge, GuildActivity models |
| 8.2 | Guild CRUD API (`POST/GET/PUT/DELETE /api/guilds`) |
| 8.3 | Guild membership API (invite, join, roles, leave) |
| 8.4 | Shared projects & boss mechanics |
| 8.5 | Guild XP & leveling system |
| 8.6 | Guild challenges (generation, progress, rewards) |
| 8.7 | Guild activity feed (real-time via Supabase Realtime) |
| 8.8 | Guild UI (dashboard, member management, shared projects) |
| 8.9 | Guild components library |

### Phase 9: Gold Economy & Shop

| Task | Description |
|------|-------------|
| 9.1 | Add `gold` field to Character model |
| 9.2 | Add gold to all reward flows (boss defeat, level-up, achievements, streaks) |
| 9.3 | Create `ShopItem` model and seed shop inventory |
| 9.4 | Build Shop API (`GET /api/shop`, `POST /api/shop/purchase`) |
| 9.5 | Create `/shop` page with item grid and purchase flow |
| 9.6 | Implement stat reset, streak revive, and other shop item effects |
| 9.7 | Add Gold display to character header/sidebar |

### Phase 10: Avatar Builder

| Task | Description |
|------|-------------|
| 10.1 | Define avatar data model (JSON in Character or separate model) |
| 10.2 | Source or create preset appearance assets (faces, hair, body types) |
| 10.3 | Create class-themed outfit sets (one per class) |
| 10.4 | Build avatar builder UI component |
| 10.5 | Reflect equipped items visually on avatar |
| 10.6 | Add guild emblems and color customization |
| 10.7 | Integrate avatar display across the app (sidebar, character sheet, guild) |
