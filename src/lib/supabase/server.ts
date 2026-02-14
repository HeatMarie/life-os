import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { User, Character } from "@prisma/client";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Type for user with character included
export type AuthenticatedUser = User & {
  character: Character | null;
};

/**
 * Get the currently authenticated user from Supabase session.
 * Returns the database User with Character relation, or null if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient();
    
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
    
    if (error || !supabaseUser) {
      return null;
    }
    
    // Look up the user in our database by Supabase ID
    const user = await db.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { character: true },
    });
    
    return user;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

/**
 * Require authentication - throws if user is not authenticated.
 * Use in API routes that require auth.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}

/**
 * Get the Supabase user directly (for cases where we only need Supabase data).
 * Returns null if not authenticated.
 */
export async function getSupabaseUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("Error getting Supabase user:", error);
    return null;
  }
}
