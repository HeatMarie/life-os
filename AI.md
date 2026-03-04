# Life-OS: AI Development Guide

> Last Updated: March 2026

## Project Vision

Life-OS is a **gamified life/project management application** that transforms productivity into an RPG experience. Users complete real-life tasks to earn XP, level up their character, fight bosses (projects), and collect loot—keeping them engaged and motivated.

**Social Layer**: Guilds (parties) allow families, teams, or friend groups to collaborate on shared projects, tackle guild bosses together, and compete/cooperate for collective rewards.

---

## Current State

The application has a **solid foundation** with most core game mechanics implemented and authentication fully wired up.

### ✅ Fully Implemented
- XP/Level progression system with streak multipliers
- HP/Energy resource management (burnout/death states)
- Character classes (WARRIOR, MAGE, ROGUE, BARD) with bonuses
- Boss fights linked to projects
- Loot drop system with 8 item types
- Achievement system (25 achievements)
- Task completion with full reward calculation
- Health tracking (steps, sleep, workouts) with XP integration
- Google Calendar sync
- AI-powered life chronicle/story generation
- Kanban board with buckets
- Quest chain data structure
- **Supabase auth helpers** (`getAuthenticatedUser`, `requireAuth`)
- **Auth pages** (login, register, Google OAuth, callback)
- **Auth middleware** (route protection, redirect to /login)
- **All API routes** migrated to use `requireAuth`

### ⚠️ Partially Implemented
- **Session Provider**: Auth helpers exist server-side; no client-side auth context or user menu in sidebar yet (Task 1.5)
- **Daily challenges**: Model exists, generation logic defined, not fully integrated
- **Inventory usage**: Items collected but no "use item" mechanics
- **Character death UI**: Logic exists, limited user-facing experience

### ❌ Not Yet Implemented
- Session provider / client-side auth context
- 3 additional character classes (DRUID, CLERIC, NECROMANCER)
- Stat system (5 allocatable stats: STR, FOC, DIS, CHA, LCK + Vitality derived)
- Ability system (42 abilities across 7 classes, 3 difficulty tiers)
- Equipment system (6 slots, class sets, +5 upgrade cap)
- Gold economy and shop
- Quest type classification (MAIN_QUEST, DAILY_QUEST, SIDE_QUEST)
- Boss attack mechanics on missed deadlines
- Difficulty tier settings (Casual/Balanced/Hardcore)
- Character creation wizard (7-class selection with previews)
- Avatar/appearance customization
- **Guilds/Parties system**
- **Shared projects and bosses**
- **Guild quests and challenges**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma |
| Auth | Supabase (SSR) |
| Styling | Tailwind CSS + shadcn/ui |
| AI | OpenAI (via lib/ai/client.ts) |
| Calendar | Google Calendar API |

---

## Key Files & Locations

### Database
- `prisma/schema.prisma` - All database models and enums

### Game Mechanics
- `src/lib/game/constants.ts` - XP values, level formulas, streak multipliers, class bonuses
- `src/lib/game/mechanics.ts` - Loot drop calculations, reward processing
- `src/lib/game/achievements.ts` - Achievement definitions and unlock conditions
- `src/lib/game/event-classifier.ts` - Classifies calendar events

### Authentication
- `src/lib/supabase/server.ts` - Server-side Supabase client + `getAuthenticatedUser()` + `requireAuth()`
- `src/lib/supabase/client.ts` - Client-side Supabase client
- `src/middleware.ts` - Route protection (redirects unauthenticated users to /login)
- `src/app/(auth)/` - Login, register, callback pages

### API Routes
- `src/app/api/character/route.ts` - Character CRUD, rest/revive actions
- `src/app/api/tasks/[id]/complete/route.ts` - **Core game loop**: XP, HP, energy, boss damage, loot
- `src/app/api/bosses/route.ts` - Boss management
- `src/app/api/achievements/route.ts` - Achievement tracking

### UI Components
- `src/components/game/status-bars.tsx` - HP/Energy/XP display
- `src/components/app-sidebar.tsx` - Main navigation
- `src/components/ui/` - shadcn/ui components

---

## Database Schema Overview

### Core Models
- **User** → owns everything, linked to Supabase auth (`supabaseId`)
- **Character** → name, class, level, xp, hp, energy, streak, status
- **Task** → title, priority, type, bucketId, xpReward, energyCost, questChainId
- **Project** → name, deadline, linked Boss
- **Boss** → hp, maxHp, status, deadline, linked Project
- **Area** → life domains (WORK, HOME, WRITING, SIDE_PROJECTS)

### Game Models
- **Achievement** / **UserAchievement** → unlockable trophies
- **InventoryItem** → loot with type, quantity, rarity
- **QuestChain** → multi-step quest narratives
- **DailyChallenge** → daily objectives

### Planned Models (Stats & Equipment)
- **Stats** → statPoints per character (STR, FOC, DIS, CHA, LCK)
- **Equipment** → active equipped items per character (6 slots)
- **EquipmentItem** → item definitions with stat bonuses and rarity
- **GameSettings** → difficulty tier and feature toggles per user
- **ShopItem** → purchasable items and their Gold costs

### Planned Models (Guilds)
- **Guild** → name, description, level, xp, inviteCode, settings
- **GuildMember** → userId, guildId, role (LEADER/OFFICER/MEMBER), joinedAt
- **GuildProject** → projectId, guildId (shared projects)
- **GuildChallenge** → guild-wide objectives with collective progress
- **GuildActivity** → activity feed for guild actions

### Enums
- `CharacterClass`: WARRIOR, MAGE, ROGUE, BARD, DRUID, CLERIC, NECROMANCER
- `Priority`: URGENT, HIGH, MEDIUM, LOW, NONE
- `TaskType`: DEEP_WORK, MEETING, APPOINTMENT, SOCIAL, ERRAND, ROUTINE, ADMIN, CREATIVE, LEARNING, OTHER
- `ItemType`: XP_SHARD, XP_CRYSTAL, STREAK_SHIELD, ENERGY_POTION, DOUBLE_XP_TOKEN, BOSS_BANE, HEALTH_POTION, REVIVE_TOKEN
- `Rarity`: COMMON, RARE, EPIC, LEGENDARY
- `GuildRole`: LEADER, OFFICER, MEMBER (planned)
- `QuestType`: MAIN_QUEST, DAILY_QUEST, SIDE_QUEST (planned)
- `DifficultTier`: CASUAL, BALANCED, HARDCORE (planned)

---

## Game Balance Constants

Located in `src/lib/game/constants.ts`:

```typescript
// XP by priority
URGENT: 120, HIGH: 90, MEDIUM: 60, LOW: 30, NONE: 20

// Level up formula
xpForLevel = 250 × level^1.5

// Streak multipliers
0-2 days: 1.0x | 3-6: 1.25x | 7-13: 1.5x | 14-29: 1.75x | 30+: 2.0x

// Boss damage per completed task
URGENT: 25, HIGH: 20, MEDIUM: 15, LOW: 10, NONE: 5

// Overdue task damage TO player
URGENT: 20, HIGH: 15, MEDIUM: 10, LOW: 5, NONE: 3
```

### Stat System (Planned)

5 allocatable stats + 1 derived:

```typescript
// Allocatable stats (3 points per level-up)
STR  (Strength)   → +1% XP from URGENT/HIGH per point, +0.5% boss damage
FOC  (Focus)      → +1% XP all tasks per point, –5% distraction penalty per 5pts
DIS  (Discipline) → –2% energy cost per point (cap –40%), +1% HP regen rate
CHA  (Charisma)   → +1% XP from Social/Meeting per point, +1 streak shield per 10
LCK  (Luck)       → +0.5% loot drop rate per point, +0.25% bonus XP roll chance

// Derived stat (auto-calculated)
Vitality = 10 + (level × 2) + (DIS × 1)  // → determines max HP
```

### Ability System (Planned)

42 abilities total — 7 classes × 6 abilities each, grouped into 3 difficulty tiers (2 per tier):

```typescript
// Unlock levels
Tier 1 (Apprentice): levels 5 and 10
Tier 2 (Journeyman): levels 15 and 20  (requires 1 Tier 1 ability)
Tier 3 (Master):     levels 25 and 30  (requires 1 Tier 2 ability)
```

Full ability list in `docs/GAME_DESIGN.md` Section 4.

### Equipment System (Planned)

6 equipment slots: HEAD, CHEST, HANDS, FEET, WEAPON, ACCESSORY

```typescript
// Stat bonus ranges by rarity
COMMON:    +1–3 to one stat
RARE:      +3–6 to one stat | +2–3 to two stats
EPIC:      +6–10 to one stat | +4–6 to two stats
LEGENDARY: +10–15 to one stat | +6–10 to two stats

// Upgrade levels
+1 to +5 max, costs Gold + crafting materials (Iron Scrap, Boss Core)
```

Each class has a **6-piece set** with set bonuses at 3/6 items equipped.

### Difficulty Tiers (Planned)

| Setting | Casual | Balanced | Hardcore |
|---------|--------|----------|---------|
| Boss attacks | Off | On (daily) | On (hourly) |
| Character death | Off | On | On + XP penalty |
| Stat allocation | Off | On | On, no free reset |
| Abilities | Off | On | On |
| Streak shields | On | On | Off |

### Gold Economy (Planned)

```typescript
// Gold earned per event
Level-up:           50 + (5 per 5 levels)
Boss defeat:        100–500 (scales with difficulty)
Achievement unlock: 25–200
7-day streak:       50
30-day streak:      200
```

### Guild Constants (Planned)

```typescript
// Guild XP per member task completion
GUILD_XP_PER_TASK: 10

// Guild level formula
guildXpForLevel = 1000 × level^1.8

// Guild size
maxMembers = 5 + (guildLevel × 2)

// Guild perks by level
Level 2:  +5% XP bonus for all members
Level 5:  Shared loot pool unlocked
Level 10: Guild challenges unlocked
Level 15: +10% XP bonus + guild achievements
Level 20: Custom guild cosmetics
```

---

## Implementation Phases

See `docs/GAME_DESIGN.md` Section 13 for full task breakdowns.

### Phase 1: Authentication & Multi-User ✅ MOSTLY COMPLETE
- Tasks 1.1–1.4 complete
- **Task 1.5** (Session Provider) ⬅️ CURRENT

### Phase 2: Character Stats & Equipment
Add 7-class enum, Stats model, Equipment models, stat allocation UI, equipment UI

### Phase 3: Ability System
Define 42 abilities, add Ability and CharacterAbility models, ability selection UI

### Phase 4: Quest Type System
MAIN_QUEST/DAILY_QUEST/SIDE_QUEST types, DailyHabit model, AI daily challenges

### Phase 5: Boss Attack & Stakes
Deadline monitoring, boss attacks on overdue tasks, death/respawn UI

### Phase 6: Game Depth Settings (Difficulty Tiers)
GameSettings model, Casual/Balanced/Hardcore presets, conditional logic throughout app

### Phase 7: Character Creation Wizard
7-class selection with previews, difficulty tier selection, onboarding tutorial

### Phase 8: Guilds & Social Features
Full guild system, shared bosses, guild XP/leveling, activity feed

### Phase 9: Gold Economy & Shop
Gold rewards, Shop API, `/shop` page, stat resets, streak revives

### Phase 10: Avatar Builder
Preset appearances, class outfits, equipment visual reflection, guild emblems

---

## Guild System Design

### Core Concepts

**Guilds** (also called "Parties" for smaller groups) allow users to:
- Collaborate on shared projects with combined boss damage
- Complete guild-wide challenges together
- Earn guild XP that unlocks collective perks
- See activity feeds of guild members' achievements
- Compete on guild leaderboards

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

model GuildMember {
  id        String    @id @default(cuid())
  guildId   String
  userId    String
  role      GuildRole @default(MEMBER)
  joinedAt  DateTime  @default(now())
  
  guild     Guild     @relation(fields: [guildId], references: [id])
  user      User      @relation(fields: [userId], references: [id])
  
  @@unique([guildId, userId])
}

enum GuildRole {
  LEADER
  OFFICER
  MEMBER
}

model GuildProject {
  id        String  @id @default(cuid())
  guildId   String
  projectId String
  
  guild     Guild   @relation(fields: [guildId], references: [id])
  project   Project @relation(fields: [projectId], references: [id])
  
  @@unique([guildId, projectId])
}

model GuildChallenge {
  id          String   @id @default(cuid())
  guildId     String
  title       String
  description String
  target      Int
  progress    Int      @default(0)
  xpReward    Int
  completed   Boolean  @default(false)
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  
  guild       Guild    @relation(fields: [guildId], references: [id])
}

model GuildActivity {
  id        String   @id @default(cuid())
  guildId   String
  userId    String
  type      String   // TASK_COMPLETE, BOSS_DAMAGE, LEVEL_UP, ACHIEVEMENT, etc.
  message   String
  metadata  Json?
  createdAt DateTime @default(now())
  
  guild     Guild    @relation(fields: [guildId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}
```

### Mechanics

**Shared Bosses:**
- When a project is marked as "Guild Project", its boss becomes shared
- Any guild member assigned tasks on that project deals damage
- Boss HP scales: `baseDifficulty × (1 + 0.25 × memberCount)`
- Defeating shared boss: all contributors get XP + loot rolls

**Guild XP:**
- Every task completed by any member: +10 Guild XP
- Shared boss defeated: +100 × difficultyMultiplier Guild XP
- Guild challenge completed: bonus XP per challenge
- Guild levels unlock perks and increase max members

**Guild Challenges (Examples):**
- "Complete 50 tasks as a guild this week" → +500 Guild XP
- "Every member maintain 3+ day streak" → +300 Guild XP + loot
- "Defeat 3 bosses together" → +750 Guild XP

**Permissions by Role:**
- **Leader**: All permissions, transfer leadership, disband guild
- **Officer**: Invite/kick members, create guild projects, manage challenges
- **Member**: View guild, contribute to projects, see activity feed

### API Routes (Planned)
- `POST /api/guilds` - Create guild
- `GET /api/guilds` - List user's guilds
- `GET /api/guilds/[id]` - Guild details with members
- `POST /api/guilds/[id]/invite` - Generate/refresh invite
- `POST /api/guilds/join` - Join via invite code
- `PUT /api/guilds/[id]/members/[userId]` - Update member role
- `DELETE /api/guilds/[id]/members/[userId]` - Remove member
- `POST /api/guilds/[id]/projects` - Add project to guild
- `GET /api/guilds/[id]/activity` - Activity feed
- `GET /api/guilds/[id]/challenges` - Guild challenges

### UI Pages (Planned)
- `/guild` - Guild dashboard (or redirect to create/join)
- `/guild/[id]` - Specific guild view
- `/guild/[id]/members` - Member management
- `/guild/[id]/projects` - Shared projects
- `/guild/[id]/challenges` - Guild challenges
- `/guild/create` - Guild creation
- `/guild/join` - Join via code

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth provider | Supabase Auth | Already configured, PostgreSQL integration |
| Character classes | 7 classes (WARRIOR, MAGE, ROGUE, BARD, DRUID, CLERIC, NECROMANCER) | Full RPG class diversity; each maps to a life domain |
| Stats approach | 5 allocatable stats + 1 derived (Vitality) | Player agency in build without overwhelming complexity |
| Stat points per level | 3 points | Meaningful choice each level without being overwhelming |
| Ability count | 42 (7 classes × 6 abilities, 3 tiers) | Rich customization; 2 per tier keeps choices meaningful |
| Equipment slots | 6 slots (HEAD, CHEST, HANDS, FEET, WEAPON, ACCESSORY) | Full RPG feel without inventory micromanagement |
| Equipment class sets | 7 sets with 3-piece and 6-piece bonuses | Incentivizes class identity in gear choices |
| Gold economy | In-game only (no real money) | Keeps game fair; Gold earned through play |
| Difficulty tiers | Casual / Balanced / Hardcore | Users control complexity; Casual removes punishment, Hardcore adds stakes |
| Daily quests | User habits + AI suggestions | Flexibility + engagement |
| Quest types | MAIN_QUEST / DAILY_QUEST / SIDE_QUEST | Maps to real productivity concepts (projects, habits, tasks) |
| Avatars | Deferred to Phase 10 | Nice-to-have, not core; class outfits as first avatar feature |
| Guild naming | "Guild" (not "Party") | Scales from family to large teams |
| Guild projects | Opt-in per project | Users control what's shared |
| Boss escape penalty | HP damage (not instant death) | Fair punishment without game-breaking consequences |
| Stat reset | 1 free lifetime, then 500 Gold | Allows experimentation; Gold cost prevents frivolous resets |

---

## Conventions

### API Routes
- Use `requireAuth()` helper for all protected routes — it throws on unauthenticated; route handlers must ensure this results in an HTTP 401 response
- Alternatively, use `getAuthenticatedUser()` and return a `NextResponse` with `{ status: 401 }` when unauthenticated
- For unauthenticated requests, always return HTTP 401 Unauthorized (do not rely on a generic thrown `Error` automatically mapping to 401)
- Include character/game state updates in transaction
- For guild routes, verify membership and role permissions

### Game Mechanics
- All XP/HP/Energy changes go through centralized functions in `lib/game/`
- Create StoryEntry for significant events
- Check achievements after state changes
- For shared bosses, distribute rewards proportionally or equally (TBD)
- All new stats/ability effects should be implemented in `lib/game/` (not scattered in API routes)

### UI Patterns
- Use shadcn/ui components from `src/components/ui/`
- Game-related components in `src/components/game/`
- Guild-related components in `src/components/guild/`
- Pages use App Router conventions

---

## Current Task

**Phase 1, Task 1.5**: Add Session Provider

See `docs/tasks/CURRENT.md` for detailed requirements.
