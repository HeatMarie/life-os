# Life-OS Development Roadmap

## Phase 1: Authentication & Multi-User Foundation

### Task 1.1: Supabase Auth Helpers ⬅️ CURRENT
- [x] Create `getAuthenticatedUser()` in `src/lib/supabase/server.ts`
- [x] Return user with character data or null
- [x] Handle token refresh
- [x] Create `requireAuth()` helper that throws on unauthenticated

### Task 1.2: Auth Pages
- [ ] Create `src/app/(auth)/layout.tsx` - centered card layout
- [ ] Create `src/app/(auth)/login/page.tsx` - email/password form + Google button
- [ ] Create `src/app/(auth)/register/page.tsx` - registration form
- [ ] Create `src/app/(auth)/callback/route.ts` - OAuth callback handler

### Task 1.3: Auth Middleware
- [ ] Create middleware to protect routes
- [ ] Redirect unauthenticated users to /login
- [ ] Allow public access to auth pages

### Task 1.4: Migrate API Routes
- [ ] Update `src/app/api/character/route.ts`
- [ ] Update `src/app/api/tasks/route.ts` and nested routes
- [ ] Update `src/app/api/bosses/route.ts` and nested routes
- [ ] Update `src/app/api/projects/route.ts`
- [ ] Update `src/app/api/achievements/route.ts`
- [ ] Update `src/app/api/areas/route.ts`
- [ ] Update `src/app/api/buckets/route.ts`
- [ ] Update `src/app/api/events/route.ts`
- [ ] Update `src/app/api/story/route.ts`
- [ ] Update `src/app/api/health/route.ts`
- [ ] Update `src/app/api/writings/route.ts`
- [ ] Update AI routes

### Task 1.5: Session Provider
- [ ] Add Supabase session provider to `src/app/layout.tsx`
- [ ] Create client-side auth context hook
- [ ] Add user menu to sidebar with logout

---

## Phase 2: Character Stats & Equipment System

### Task 2.1: Database Schema Updates
- [ ] Add `Stats` model to schema
- [ ] Add `statPoints` field to Character
- [ ] Add `Equipment` model (equipped items)
- [ ] Add `EquipmentItem` model (item definitions)
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

### Task 2.4: Level Up UI
- [ ] Create level up modal component
- [ ] Stat point allocation interface
- [ ] Show stat effect previews
- [ ] Trigger on level up

### Task 2.5: Equipment UI
- [ ] Create equipment panel component
- [ ] Show equipped items per slot
- [ ] Inventory view for unequipped items
- [ ] Equip/compare interface

---

## Phase 3: Quest Type System

### Task 3.1: Quest Type Schema
- [ ] Add `QuestType` enum to schema
- [ ] Add `questType` field to Task
- [ ] Migrate existing tasks (default to SIDE_QUEST)

### Task 3.2: Daily Habits Model
- [ ] Create `DailyHabit` model
- [ ] Fields: title, frequency, timeOfDay, xpReward, hpRestore, currentStreak
- [ ] Create API routes

### Task 3.3: Habits UI
- [ ] Create `/habits` page or section in health page
- [ ] Habit creation form
- [ ] Daily checklist view
- [ ] Streak display

### Task 3.4: AI Daily Suggestions
- [ ] Extend AI client for challenge generation
- [ ] Analyze user patterns for suggestions
- [ ] Accept/dismiss suggestion UI

### Task 3.5: Quest Type UI
- [ ] Add quest type selector to task form
- [ ] Visual distinction per type (icons, colors)
- [ ] Filter tasks by quest type

---

## Phase 4: Boss Attack & Stakes

### Task 4.1: Deadline Monitor
- [ ] Create cron job or check endpoint
- [ ] Query overdue MAIN_QUEST tasks
- [ ] Calculate accumulated damage

### Task 4.2: Boss Attack Execution
- [ ] Deduct HP from character
- [ ] Create dramatic StoryEntry
- [ ] Update boss "last attack" timestamp

### Task 4.3: Attack Notifications
- [ ] Toast notification on attack
- [ ] Real-time HP bar update
- [ ] Sound effect (optional)

### Task 4.4: Death Experience
- [ ] Full-screen "Game Over" display
- [ ] Run statistics summary
- [ ] Revive options (token, wait timer)
- [ ] Respawn flow

---

## Phase 5: Game Depth Settings

### Task 5.1: Settings Schema
- [ ] Create `GameSettings` model
- [ ] Boolean flags for each feature
- [ ] Default values (all enabled)

### Task 5.2: Settings UI
- [ ] Create `/settings` page
- [ ] Toggle switches per feature
- [ ] Preset buttons (Casual/Balanced/Hardcore)
- [ ] Save to database

### Task 5.3: Conditional Features
- [ ] Wrap stat displays in setting checks
- [ ] Conditionally process boss attacks
- [ ] Hide equipment when disabled
- [ ] Simplify XP display option

---

## Phase 6: Character Creation

### Task 6.1: Creation Wizard
- [ ] Multi-step form component
- [ ] Step 1: Character name
- [ ] Step 2: Class selection with previews
- [ ] Step 3: Game depth preset
- [ ] Step 4: Initial focus areas (optional)

### Task 6.2: Onboarding Tutorial
- [ ] Tutorial overlay component
- [ ] Highlight key features
- [ ] Guide first task creation
- [ ] Explain core mechanics

---

## Phase 7: Guilds & Social Features

### Task 7.1: Guild Schema
- [ ] Create `Guild` model (name, level, xp, inviteCode, maxMembers)
- [ ] Create `GuildMember` model (userId, guildId, role)
- [ ] Create `GuildRole` enum (LEADER, OFFICER, MEMBER)
- [ ] Create `GuildProject` model (links project to guild)
- [ ] Create `GuildChallenge` model
- [ ] Create `GuildActivity` model
- [ ] Add guild relations to User and Project
- [ ] Run migration

### Task 7.2: Guild CRUD API
- [ ] `POST /api/guilds` - Create guild (user becomes LEADER)
- [ ] `GET /api/guilds` - List user's guilds
- [ ] `GET /api/guilds/[id]` - Guild details
- [ ] `PUT /api/guilds/[id]` - Update guild settings
- [ ] `DELETE /api/guilds/[id]` - Disband guild (LEADER only)

### Task 7.3: Guild Membership API
- [ ] `POST /api/guilds/[id]/invite` - Generate/refresh invite code
- [ ] `POST /api/guilds/join` - Join via invite code
- [ ] `PUT /api/guilds/[id]/members/[userId]` - Update role
- [ ] `DELETE /api/guilds/[id]/members/[userId]` - Remove/leave
- [ ] `POST /api/guilds/[id]/transfer` - Transfer leadership

### Task 7.4: Shared Projects & Bosses
- [ ] `POST /api/guilds/[id]/projects` - Add project to guild
- [ ] `DELETE /api/guilds/[id]/projects/[projectId]` - Remove
- [ ] Update task completion to deal damage to shared bosses
- [ ] Scale shared boss HP by member count
- [ ] Distribute rewards on shared boss defeat

### Task 7.5: Guild XP & Leveling
- [ ] Add guild XP on member task completion
- [ ] Add guild XP on shared boss defeat
- [ ] Guild level up logic
- [ ] Increase maxMembers on level up
- [ ] Define and apply guild perks

### Task 7.6: Guild Challenges
- [ ] Challenge generation logic (weekly/daily)
- [ ] Track collective progress
- [ ] Reward distribution on completion
- [ ] Challenge creation UI for officers

### Task 7.7: Guild Activity Feed
- [ ] Create activity entries on key events
- [ ] `GET /api/guilds/[id]/activity` - Paginated feed
- [ ] Real-time updates (Supabase Realtime or polling)

### Task 7.8: Guild UI - Dashboard
- [ ] Create `src/app/guild/page.tsx` - Guild home (list or create)
- [ ] Create `src/app/guild/create/page.tsx` - Creation form
- [ ] Create `src/app/guild/join/page.tsx` - Join via code

### Task 7.9: Guild UI - Guild View
- [ ] Create `src/app/guild/[id]/page.tsx` - Main dashboard
- [ ] Member list with roles and stats
- [ ] Shared projects and bosses display
- [ ] Activity feed component
- [ ] Guild level and XP progress

### Task 7.10: Guild UI - Management
- [ ] Create `src/app/guild/[id]/members/page.tsx`
- [ ] Role management (promote/demote)
- [ ] Kick/invite controls
- [ ] Create `src/app/guild/[id]/settings/page.tsx`
- [ ] Guild name, description editing
- [ ] Invite code regeneration

### Task 7.11: Guild Components
- [ ] `src/components/guild/guild-card.tsx` - Guild preview card
- [ ] `src/components/guild/member-list.tsx` - Member display
- [ ] `src/components/guild/activity-feed.tsx` - Activity stream
- [ ] `src/components/guild/challenge-card.tsx` - Challenge display
- [ ] `src/components/guild/shared-boss.tsx` - Shared boss with contributors

---

## Phase 8: Avatar Builder (Future)

### Task 8.1: Avatar System
- [ ] Avatar data model (or JSON in Character)
- [ ] Preset appearance assets (faces, hair, outfits)
- [ ] Builder UI component
- [ ] Equipment visual reflection
- [ ] Guild emblems/colors on avatar
