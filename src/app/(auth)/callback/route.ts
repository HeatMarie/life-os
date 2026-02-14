import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    if (user) {
      // Check if user exists in our database
      let dbUser = await db.user.findUnique({
        where: { supabaseId: user.id },
        include: { character: true },
      });

      // If user doesn't exist, create them
      if (!dbUser) {
        dbUser = await db.user.create({
          data: {
            supabaseId: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
          },
          include: { character: true },
        });
      }

      // If user has no character, redirect to character creation
      if (!dbUser.character) {
        return NextResponse.redirect(`${origin}/character/create`);
      }
    }
  }

  // Redirect to home page after successful auth
  return NextResponse.redirect(origin);
}
