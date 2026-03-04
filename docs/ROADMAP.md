# Life-OS Development Roadmap

> See `docs/GAME_DESIGN.md` for the full game design document and mechanic specifications.

---

## Phase 1: Authentication & Multi-User Foundation ✅ MOSTLY COMPLETE

### Task 1.1: Supabase Auth Helpers ✅ COMPLETE
- [x] Create `getAuthenticatedUser()` in `src/lib/supabase/server.ts`
- [x] Return user with character data or null
- [x] Handle token refresh
- [x] Create `requireAuth()` helper that throws on unauthenticated

### Task 1.2: Auth Pages ✅ COMPLETE
- [x] Create `src/app/(auth)/layout.tsx` - centered card layout
- [x] Create `src/app/(auth)/login/page.tsx` - email/password form + Google button
- [x] Create `src/app/(auth)/register/page.tsx` - registration form
- [x] Create `src/app/(auth)/callback/route.ts` - OAuth callback handler

### Task 1.3: Auth Middleware ✅ COMPLETE
- [x] Create middleware to protect routes
- [x] Redirect unauthenticated users to /login
- [x] Allow public access to auth pages

### Task 1.4: Migrate API Routes ✅ COMPLETE
- [x] Update `src/app/api/character/route.ts`
- [x] Update `src/app/api/tasks/route.ts` and nested routes
- [x] Update `src/app/api/bosses/route.ts` and nested routes
- [x] Update `src/app/api/projects/route.ts`
- [x] Update `src/app/api/achievements/route.ts`
- [x] Update `src/app/api/buckets/route.ts`
- [x] Update `src/app/api/events/route.ts`
- [x] Update `src/app/api/story/route.ts`
- [x] Update `src/app/api/health/route.ts`
- [x] Update `src/app/api/writings/route.ts`
- [x] Update AI routes

### Task 1.5: Session Provider ⬅️ CURRENT
- [ ] Add Supabase session provider to `src/app/layout.tsx`
- [ ] Create client-side auth context hook
- [ ] Add user menu to sidebar with logout

---

## Phase 2: Character Stats & Equipment System

### Task 2.1: Database Schema Updates
- [ ] Add `Stats` model to schema (STR, FOC, DIS, CHA, LCK fields)
- [ ] Add `statPoints` field to Character (awarded 3 per level-up)
- [ ] Add `Equipment` model (6 slots: HEAD, CHEST, HANDS, FEET, WEAPON, ACCESSORY)
- [ ] Add `EquipmentItem` model (item definitions with rarity and stat bonuses)
- [ ] Update `CharacterClass` enum to include all 7 classes (add DRUID, CLERIC, NECROMANCER)
- [ ] Run migration

### Task 2.2: Stat Effect System
- [ ] Define stat bonuses in `src/lib/game/constants.ts`
- [ ] Create `calculateEffectiveStats()` function
- [ ] Integrate with XP/HP/Energy calculations

### Task 2.3: Equipment System
- [ ] Create equipment loot tables
- [ ] Add equipment drops to boss defeat
- [ ] Create equip/unequip API routes
- [ ] Calculate equipment stat bonuses
- [ ] Define class set bonuses (3-piece and 6-piece)

### Task 2.4: Level Up UI
- [ ] Create level up modal component
- [ ] Stat point allocation interface (STR/FOC/DIS/CHA/LCK)
- [ ] Show stat effect previews
- [ ] Trigger on level up

### Task 2.5: Equipment UI
- [ ] Create equipment panel component
- [ ] Show equipped items per slot (6 slots)
- [ ] Inventory view for unequipped items
- [ ] Equip/compare interface

---

## Phase 3: Ability System

### Task 3.1: Ability Schema
- [ ] Add `Ability` model (class, tier, name, description, effectDefinition JSON)
- [ ] Add `CharacterAbility` junction model (active abilities per character)
- [ ] Seed all 42 ability definitions (7 classes × 6 abilities)

### Task 3.2: Ability Effects
- [ ] Create `src/lib/game/abilities.ts` with all 42 effect functions
- [ ] Integrate passive effects into XP calculations
- [ ] Integrate passive effects into HP/energy calculations
- [ ] Handle triggered effects (e.g., Berserker Mode, Battle Hymn)

### Task 3.3: Ability Unlock UI
- [ ] Create ability selection screen (shown at levels 5, 10, 15, 20, 25, 30)
- [ ] Display both tier options with effect previews
- [ ] Save selection to CharacterAbility model
- [ ] Add ability display to character sheet

---

## Phase 4: Quest Type System

### Task 4.1: Quest Type Schema
- [ ] Add `QuestType` enum to schema (MAIN_QUEST, DAILY_QUEST, SIDE_QUEST)
- [ ] Add `questType` field to Task
- [ ] Migrate existing tasks (default to SIDE_QUEST)

### Task 4.2: Daily Habits Model
- [ ] Create `DailyHabit` model
- [ ] Fields: title, frequency, timeOfDay, xpReward, hpRestore, currentStreak
- [ ] Create API routes

### Task 4.3: Habits UI
- [ ] Create `/habits` page or section in health page
- [ ] Habit creation form
- [ ] Daily checklist view
- [ ] Streak display

### Task 4.4: AI Daily Suggestions
- [ ] Extend AI client for challenge generation
- [ ] Analyze user patterns for suggestions
- [ ] Accept/dismiss suggestion UI

### Task 4.5: Quest Type UI
- [ ] Add quest type selector to task form
- [ ] Visual distinction per type (icons, colors)
- [ ] Filter tasks by quest type

---

## Phase 5: Boss Attack & Stakes

### Task 5.1: Deadline Monitor
- [ ] Create cron job or check endpoint
- [ ] Query overdue MAIN_QUEST tasks
- [ ] Calculate accumulated damage

### Task 5.2: Boss Attack Execution
- [ ] Deduct HP from character
- [ ] Create dramatic StoryEntry
- [ ] Update boss "last attack" timestamp

### Task 5.3: Attack Notifications
- [ ] Toast notification on attack
- [ ] Real-time HP bar update
- [ ] Sound effect (optional)

### Task 5.4: Death Experience
- [ ] Full-screen "Game Over" display
- [ ] Run statistics summary
- [ ] Revive options (token, wait timer)
- [ ] Respawn flow

---

## Phase 6: Game Depth Settings (Difficulty Tiers)

### Task 6.1: Settings Schema
- [ ] Create `GameSettings` model
- [ ] Add `difficultyTier` enum (CASUAL, BALANCED, HARDCORE)
- [ ] Boolean flags for individual feature toggles
- [ ] Default values (BALANCED with all features enabled)

### Task 6.2: Settings UI
- [ ] Create `/settings` page
- [ ] Difficulty tier preset buttons (Casual/Balanced/Hardcore)
- [ ] Individual toggle switches per feature
- [ ] Save to database

### Task 6.3: Conditional Features
- [ ] Wrap stat displays in setting checks
- [ ] Conditionally process boss attacks
- [ ] Hide equipment when disabled
- [ ] Simplify XP display option
- [ ] Apply Hardcore-specific rules (no free stat reset, increased damage)

---

## Phase 7: Character Creation

### Task 7.1: Creation Wizard
- [ ] Multi-step form component
- [ ] Step 1: Character name
- [ ] Step 2: Class selection with all 7 classes and bonus previews
- [ ] Step 3: Difficulty tier preset (Casual/Balanced/Hardcore)
- [ ] Step 4: Initial focus areas (optional)

### Task 7.2: Onboarding Tutorial
- [ ] Tutorial overlay component
- [ ] Highlight key features
- [ ] Guide first task creation
- [ ] Explain core mechanics

---

## Phase 8: Guilds & Social Features

### Task 8.1: Guild Schema
- [ ] Create `Guild` model (name, level, xp, inviteCode, maxMembers)
- [ ] Create `GuildMember` model (userId, guildId, role)
- [ ] Create `GuildRole` enum (LEADER, OFFICER, MEMBER)
- [ ] Create `GuildProject` model (links project to guild)
- [ ] Create `GuildChallenge` model
- [ ] Create `GuildActivity` model
- [ ] Add guild relations to User and Project
- [ ] Run migration

### Task 8.2: Guild CRUD API
- [ ] `POST /api/guilds` - Create guild (user becomes LEADER)
- [ ] `GET /api/guilds` - List user's guilds
- [ ] `GET /api/guilds/[id]` - Guild details
- [ ] `PUT /api/guilds/[id]` - Update guild settings
- [ ] `DELETE /api/guilds/[id]` - Disband guild (LEADER only)

### Task 8.3: Guild Membership API
- [ ] `POST /api/guilds/[id]/invite` - Generate/refresh invite code
- [ ] `POST /api/guilds/join` - Join via invite code
- [ ] `PUT /api/guilds/[id]/members/[userId]` - Update role
- [ ] `DELETE /api/guilds/[id]/members/[userId]` - Remove/leave
- [ ] `POST /api/guilds/[id]/transfer` - Transfer leadership

### Task 8.4: Shared Projects & Bosses
- [ ] `POST /api/guilds/[id]/projects` - Add project to guild
- [ ] `DELETE /api/guilds/[id]/projects/[projectId]` - Remove
- [ ] Update task completion to deal damage to shared bosses
- [ ] Scale shared boss HP by member count
- [ ] Distribute rewards on shared boss defeat

### Task 8.5: Guild XP & Leveling
- [ ] Add guild XP on member task completion
- [ ] Add guild XP on shared boss defeat
- [ ] Guild level up logic
- [ ] Increase maxMembers on level up: `maxMembers = 5 + (guildLevel × 2)`
- [ ] Define and apply guild perks

### Task 8.6: Guild Challenges
- [ ] Challenge generation logic (weekly/daily)
- [ ] Track collective progress
- [ ] Reward distribution on completion
- [ ] Challenge creation UI for officers

### Task 8.7: Guild Activity Feed
- [ ] Create activity entries on key events
- [ ] `GET /api/guilds/[id]/activity` - Paginated feed
- [ ] Real-time updates (Supabase Realtime or polling)

### Task 8.8: Guild UI - Dashboard
- [ ] Create `src/app/guild/page.tsx` - Guild home (list or create)
- [ ] Create `src/app/guild/create/page.tsx` - Creation form
- [ ] Create `src/app/guild/join/page.tsx` - Join via code

### Task 8.9: Guild UI - Guild View
- [ ] Create `src/app/guild/[id]/page.tsx` - Main dashboard
- [ ] Member list with roles and stats
- [ ] Shared projects and bosses display
- [ ] Activity feed component
- [ ] Guild level and XP progress

### Task 8.10: Guild UI - Management
- [ ] Create `src/app/guild/[id]/members/page.tsx`
- [ ] Role management (promote/demote)
- [ ] Kick/invite controls
- [ ] Create `src/app/guild/[id]/settings/page.tsx`
- [ ] Guild name, description editing
- [ ] Invite code regeneration

### Task 8.11: Guild Components
- [ ] `src/components/guild/guild-card.tsx` - Guild preview card
- [ ] `src/components/guild/member-list.tsx` - Member display
- [ ] `src/components/guild/activity-feed.tsx` - Activity stream
- [ ] `src/components/guild/challenge-card.tsx` - Challenge display
- [ ] `src/components/guild/shared-boss.tsx` - Shared boss with contributors

---

## Phase 9: Gold Economy & Shop

### Task 9.1: Gold Schema
- [ ] Add `gold` field to Character model (default 0)
- [ ] Create `ShopItem` model (name, description, cost, effectType, effectValue)
- [ ] Create `GoldTransaction` model (source, amount, timestamp) for ledger

### Task 9.2: Gold Rewards Integration
- [ ] Award Gold on level-up: `50 + (5 per 5 levels)` 
- [ ] Award Gold on boss defeat: 100–500 (scales with difficulty)
- [ ] Award Gold on achievement unlock (25–200 per rarity)
- [ ] Award Gold on streak milestones (7-day: 50, 30-day: 200)

### Task 9.3: Shop API
- [ ] `GET /api/shop` - List available shop items
- [ ] `POST /api/shop/purchase` - Purchase item (deduct Gold, apply effect)
- [ ] Validate Gold balance before purchase
- [ ] Apply item effects (stat reset, streak revive, potions, etc.)

### Task 9.4: Shop UI
- [ ] Create `/shop` page with item grid
- [ ] Display Gold balance in header/sidebar
- [ ] Item cards with cost, effect description, purchase button
- [ ] Purchase confirmation dialog
- [ ] Insufficient Gold error state

### Task 9.5: Shop Item Effects
- [ ] Health Potion (30 Gold) → +25 HP
- [ ] Energy Potion (30 Gold) → +25 Energy
- [ ] XP Crystal (50 Gold) → +75 XP
- [ ] Streak Shield 3-pack (75 Gold) → 3 days streak protection
- [ ] Double XP Token (100 Gold) → next task 2× XP
- [ ] Stat Reset (500 Gold) → reallocate all stat points
- [ ] Streak Revive (200 Gold) → restore broken 7+ day streak
- [ ] Equipment Slot Unlock (1000 Gold) → second accessory slot
- [ ] Name Change Token (150 Gold) → rename character

---

## Phase 10: Avatar Builder

### Task 10.1: Avatar System
- [ ] Avatar data model (JSON in Character or separate model)
- [ ] Preset appearance assets (faces, hair, body types, outfits)
- [ ] Class-themed outfit sets (one per each of 7 classes)
- [ ] Builder UI component
- [ ] Equipment visual reflection on avatar
- [ ] Guild emblems/colors on avatar

### Task 10.2: Avatar Integration
- [ ] Avatar display in sidebar
- [ ] Avatar display on character sheet
- [ ] Avatar display in guild member list
- [ ] Avatar display on leaderboards
