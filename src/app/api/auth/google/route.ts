import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google/calendar";

// GET /api/auth/google - Redirect to Google OAuth
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get("redirectTo") || "/calendar";
    
    // Generate state with redirect info
    const state = Buffer.from(JSON.stringify({ redirectTo })).toString("base64");
    
    const authUrl = getGoogleAuthUrl(state);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Google auth:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google authentication" },
      { status: 500 }
    );
  }
}
