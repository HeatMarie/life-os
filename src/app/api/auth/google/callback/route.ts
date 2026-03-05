import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGoogleTokensFromCode } from "@/lib/google/calendar";
import { google } from "googleapis";
import { getGoogleOAuthClient } from "@/lib/google/calendar";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// GET /api/auth/google/callback - Handle OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/calendar?error=${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/calendar?error=no_code", request.url)
      );
    }

    // Parse state
    let redirectTo = "/calendar";
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, "base64").toString());
        redirectTo = stateData.redirectTo || "/calendar";
      } catch {
        // Ignore state parse errors
      }
    }

    // Exchange code for tokens
    const tokens = await getGoogleTokensFromCode(code);

    // Get user info from Google
    const oauth2Client = getGoogleOAuthClient();
    oauth2Client.setCredentials({ access_token: tokens.access_token });
    
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Get the authenticated user from Supabase session
    const user = await getAuthenticatedUser();
    
    if (!user) {
      // Fallback: if session auth fails, try to find the user by their Google email
      const fallbackUser = await db.user.findFirst({
        where: { email: userInfo.data.email || undefined },
      });
      
      if (!fallbackUser) {
        console.error("Google callback: no authenticated user and no matching user by email");
        return NextResponse.redirect(
          new URL("/calendar?error=no_user", request.url)
        );
      }
      
      // Use the fallback user
      await storeCalendarSync(fallbackUser.id, tokens, userInfo.data.email);
      return NextResponse.redirect(
        new URL(`${redirectTo}?connected=true`, request.url)
      );
    }

    await storeCalendarSync(user.id, tokens, userInfo.data.email);

    // Redirect back to calendar with success
    return NextResponse.redirect(
      new URL(`${redirectTo}?connected=true`, request.url)
    );
  } catch (error) {
    console.error("Error handling Google callback:", error);
    return NextResponse.redirect(
      new URL("/calendar?error=callback_failed", request.url)
    );
  }
}

// Helper to store or update CalendarSync record for a user
async function storeCalendarSync(
  userId: string,
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null },
  email: string | null | undefined
) {
  const existingSync = await db.calendarSync.findFirst({
    where: {
      userId,
      provider: "GOOGLE",
      email: email || undefined,
    },
  });

  if (existingSync) {
    await db.calendarSync.update({
      where: { id: existingSync.id },
      data: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || existingSync.refreshToken,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        isActive: true,
      },
    });
  } else {
    await db.calendarSync.create({
      data: {
        userId,
        provider: "GOOGLE",
        email: email || undefined,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        isActive: true,
      },
    });
  }
}
