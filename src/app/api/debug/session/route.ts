import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Get session using better-auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Get all cookies for debugging
    const allCookies = Object.fromEntries(
      request.cookies.getAll().map((cookie) => [cookie.name, cookie.value])
    );

    return NextResponse.json({
      success: true,
      isAuthenticated: !!session?.user,
      session: session
        ? {
            userId: session.user.id,
            email: session.user.email,
            name: session.user.name,
          }
        : null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        betterAuthUrl: process.env.BETTER_AUTH_URL,
        nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
        vercelUrl: process.env.VERCEL_URL,
      },
      cookies: {
        all: allCookies,
        sessionTokens: {
          "better-auth.session-token": allCookies["better-auth.session-token"],
          "session-token": allCookies["session-token"],
          "better-auth.session_token": allCookies["better-auth.session_token"],
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Session debug error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
