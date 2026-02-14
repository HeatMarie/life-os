# Current Development Task

## Phase 1, Task 1.1: Supabase Auth Helpers ✅ COMPLETE

### Objective
Create authentication helper functions that retrieve the authenticated user from Supabase session and return corresponding database user with character data.

### Files Modified
- `src/lib/supabase/server.ts` - Added `getAuthenticatedUser()` and `requireAuth()` functions

### Implementation
```typescript
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()
  
  if (error || !supabaseUser) return null
  
  const user = await db.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { character: true }
  })
  
  return user
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
```

### Acceptance Criteria
- [x] Function returns null when not authenticated
- [x] Function returns User with Character when authenticated
- [x] Handles missing database user gracefully
- [x] TypeScript types are correct
- [x] `requireAuth()` helper throws on unauthenticated

---

## Next Task: Phase 1, Task 1.2 - Auth Pages

### Objective
Create authentication pages for login and registration with email/password and Google OAuth support.

### Files to Create
- `src/app/(auth)/layout.tsx` - Centered card layout for auth pages
- `src/app/(auth)/login/page.tsx` - Login form with email/password + Google
- `src/app/(auth)/register/page.tsx` - Registration form
- `src/app/(auth)/callback/route.ts` - OAuth callback handler

### Requirements
1. Clean, minimal auth UI using shadcn/ui Card component
2. Email/password login with validation
3. Google OAuth button
4. Links between login/register pages
5. Error handling and loading states
6. Redirect to dashboard on success

### Acceptance Criteria
- [ ] Users can register with email/password
- [ ] Users can login with email/password
- [ ] Users can login with Google OAuth
- [ ] Appropriate error messages shown
- [ ] Loading states during auth operations
- [ ] Redirects work correctly
