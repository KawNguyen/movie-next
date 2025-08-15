import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check multiple possible cookie names for better-auth
  const sessionToken =
    req.cookies.get("better-auth.session_token")?.value ||
    req.cookies.get("better-auth.session-token")?.value ||
    req.cookies.get("session-token")?.value ||
    req.cookies.get("better_auth_session")?.value;

  const isAuthenticated = !!sessionToken;

  const isProtectedPage =
    pathname.startsWith("/lich-su-xem") ||
    pathname.startsWith("/phim-yeu-thich") ||
    pathname.startsWith("/profile");

  // Debug trong cả development và production để troubleshoot
  const shouldLog =
    process.env.NODE_ENV === "development" ||
    (isProtectedPage && !isAuthenticated);

  if (shouldLog) {
    console.log("Middleware debug:", {
      pathname,
      isAuthenticated,
      environment: process.env.NODE_ENV,
      url: req.url,
      cookies: Object.fromEntries(
        req.cookies
          .getAll()
          .map((c) => [c.name, `${c.value.substring(0, 20)}...`])
      ),
      sessionToken: sessionToken
        ? `exists: ${sessionToken.substring(0, 20)}...`
        : "missing",
    });
  }

  const isAuthPage = ["/login"].includes(pathname);

  // Redirect to login if trying to access protected pages without auth
  if (isProtectedPage && !isAuthenticated) {
    console.log(`Redirecting to login: ${pathname} (no auth)`);

    // Add a debug query param to help troubleshoot
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("debug", "no-session");

    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if trying to access auth pages while authenticated
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
