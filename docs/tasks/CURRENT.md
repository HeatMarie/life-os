# Current Development Task

## Phase 1, Task 1.5: Session Provider ⬅️ CURRENT

### Objective
Add a client-side Supabase session provider to the app layout so that client components can access auth state without prop-drilling. Add a user menu to the sidebar with a logout button.

### Files to Modify / Create
- `src/app/layout.tsx` - Wrap app with session provider
- `src/components/providers/supabase-provider.tsx` - Client-side auth context provider
- `src/hooks/use-auth.ts` (or `src/lib/supabase/auth-context.tsx`) - Auth context hook
- `src/components/app-sidebar.tsx` - Add user menu with name, avatar, and logout button

### Requirements
1. Supabase session provider wraps all pages (client-side session access)
2. `useAuth()` hook returns `{ user, session, loading }` from any client component
3. User menu in sidebar shows: character name / email, avatar (if set), logout button
4. Logout clears Supabase session and redirects to `/login`
5. Loading state handled gracefully (skeleton or spinner until session resolves)

### Acceptance Criteria
- [ ] Session provider added to `src/app/layout.tsx`
- [ ] `useAuth()` hook works in any client component
- [ ] User menu visible in sidebar when authenticated
- [ ] Logout button signs out and redirects to `/login`
- [ ] No hydration errors (server/client auth state matches)
- [ ] TypeScript types are correct

---

## Recently Completed: Phase 1, Tasks 1.1–1.4

### Task 1.4: Migrate API Routes ✅
API routes currently use `getAuthenticatedUser()` with manual 401 handling; migration to `requireAuth()` from `src/lib/supabase/server.ts` is planned.

### Task 1.3: Auth Middleware ✅
`src/middleware.ts` protects all routes, redirects unauthenticated users to `/login`.

### Task 1.2: Auth Pages ✅
- `src/app/(auth)/layout.tsx` — centered card layout
- `src/app/(auth)/login/page.tsx` — email/password + Google OAuth
- `src/app/(auth)/register/page.tsx` — registration form
- `src/app/(auth)/callback/route.ts` — OAuth callback handler

### Task 1.1: Supabase Auth Helpers ✅
- `getAuthenticatedUser()` — returns User with Character, or null
- `requireAuth()` — throws 401 if not authenticated
