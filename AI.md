# Life-OS: AI Development Guide

> Last Updated: February 9, 2026

## Project Vision

Life-OS is a **gamified life/project management application** that transforms productivity into an RPG experience. Users complete real-life tasks to earn XP, level up their character, fight bosses (projects), and collect loot—keeping them engaged and motivated.

**Social Layer**: Guilds (parties) allow families, teams, or friend groups to collaborate on shared projects, tackle guild bosses together, and compete/cooperate for collective rewards.

---

## Current State

The application has a **solid foundation** with most core game mechanics implemented:

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

### ⚠️ Partially Implemented
- **Authentication**: Supabase configured but API routes use hardcoded user lookup
- **Daily challenges**: Model exists, generation logic defined, not fully integrated
- **Inventory usage**: Items collected but no "use item" mechanics
- **Character death UI**: Logic exists, limited user-facing experience

### ❌ Not Yet Implemented
- User registration/login flow
- Equipment system (slots, stat bonuses)
- Stat points allocation on level up
- Quest type classification (Main/Daily/Side)
- Boss attack mechanics on missed deadlines
- Game depth settings (feature toggles)
- Character creation wizard
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
- `src/lib/supabase/server.ts` - Server-side Supabase client + auth helpers
- `src/lib/supabase/client.ts` - Client-side Supabase client
- `src/middleware.ts` - Route protection
- `src/app/(auth)/` - Login/register pages

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
- **User** → owns everything, linked to Supabase auth
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

### Planned Models (Guilds)
- **Guild** → name, description, level, xp, inviteCode, settings
- **GuildMember** → userId, guildId, role (LEADER/OFFICER/MEMBER), joinedAt
- **GuildProject** → projectId, guildId (shared projects)
- **GuildChallenge** → guild-wide objectives with collective progress
- **GuildActivity** → activity feed for guild actions

### Enums
- `CharacterClass`: WARRIOR, MAGE, ROGUE, BARD
- `Priority`: URGENT, HIGH, MEDIUM, LOW, NONE
- `TaskType`: DEEP_WORK, MEETING, APPOINTMENT, SOCIAL, ERRAND, ROUTINE, ADMIN, CREATIVE, LEARNING, OTHER
- `ItemType`: XP_SHARD, XP_CRYSTAL, STREAK_SHIELD, ENERGY_POTION, DOUBLE_XP_TOKEN, BOSS_BANE, HEALTH_POTION, REVIVE_TOKEN
- `Rarity`: COMMON, RARE, EPIC, LEGENDARY
- `GuildRole`: LEADER, OFFICER, MEMBER (planned)

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

### Planned Guild Constants
```typescript
// Guild XP per member task completion
GUILD_XP_PER_TASK: 10

// Guild level formula
guildXpForLevel = 1000 × level^1.8

// Guild size limits by level
GUILD_SIZE_BASE: 5
GUILD_SIZE_PER_LEVEL: 2  // +2 max members per guild level

// Guild perks by level
Level 2: +5% XP bonus for all members
Level 5: Shared loot pool unlocked
Level 10: Guild challenges unlocked
Level 15: +10% XP bonus, guild achievements
Level 20: Custom guild cosmetics
```

---

## Implementation Phases

### Phase 1: Authentication & Multi-User ⬅️ CURRENT
1. Complete Supabase auth helpers (getUser from session)
2. Create login/register pages
3. Build auth middleware for API routes
4. Migrate all API routes from hardcoded user
5. Add session provider to layout

### Phase 2: Character Stats & Equipment
1. Add Stats model (focus, vitality, discipline, charisma)
2. Add statPoints to Character (3 per level up)
3. Create Equipment and EquipmentItem models
4. Define stat effect calculations
5. Build stat allocation UI
6. Implement equipment drops and equip mechanics

### Phase 3: Quest Type System
1. Add questType enum to Task (MAIN_QUEST, DAILY_QUEST, SIDE_QUEST)
2. Create DailyHabit model for recurring habits
3. Build habits API and UI
4. Implement AI-suggested daily challenges
5. Update task creation with quest type selector

### Phase 4: Boss Attack & Stakes
1. Create deadline monitoring system
2. Implement boss attack on overdue tasks
3. Add attack notifications with drama
4. Enhance death/respawn UI experience

### Phase 5: Game Depth Settings
1. Create GameSettings model with feature toggles
2. Build settings page UI
3. Apply conditional logic throughout app
4. Add presets (Casual, Balanced, Hardcore)

### Phase 6: Character Creation Wizard
1. Build multi-step character creation flow
2. Class selection with bonus preview
3. Game depth preset during onboarding
4. Initial goals setup

### Phase 7: Guilds & Social Features
1. Create Guild, GuildMember, GuildProject models
2. Guild creation and invite system
3. Shared project/boss mechanics
4. Guild challenges and XP
5. Guild activity feed
6. Guild management UI

### Phase 8: Avatar Builder (Future)
1. Preset appearance options
2. Class-themed outfits
3. Equipment reflected on avatar
4. Guild emblems/colors

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
| Stats approach | Gameplay-affecting with toggles | User can choose depth |
| Daily quests | User habits + AI suggestions | Flexibility + engagement |
| Equipment slots | 6 slots | Full RPG feel |
| Game depth | Granular toggles | Users control complexity |
| Avatars | Deferred to Phase 8 | Nice-to-have, not core |
| Guild naming | "Guild" (not "Party") | Scales from family to large teams |
| Guild projects | Opt-in per project | Users control what's shared |

---

## Conventions

### API Routes
- Use `getAuthenticatedUser()` helper for user lookup
- Return proper HTTP status codes
- Include character/game state updates in transaction
- For guild routes, verify membership and role permissions

### Game Mechanics
- All XP/HP/Energy changes go through centralized functions in `lib/game/`
- Create StoryEntry for significant events
- Check achievements after state changes
- For shared bosses, distribute rewards proportionally or equally (TBD)

### UI Patterns
- Use shadcn/ui components from `src/components/ui/`
- Game-related components in `src/components/game/`
- Guild-related components in `src/components/guild/`
- Pages use App Router conventions

---

## Current Task

**Phase 1, Task 1.1**: Complete Supabase auth helpers

See `docs/tasks/CURRENT.md` for detailed requirements.
