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

  // Debug trong production
  if (process.env.NODE_ENV === "development") {
    console.log("Middleware debug:", {
      pathname,
      isAuthenticated,
      cookies: Object.fromEntries(
        req.cookies.getAll().map((c) => [c.name, c.value])
      ),
      sessionToken: sessionToken ? "exists" : "missing",
    });
  }

  const isProtectedPage =
    pathname.startsWith("/lich-su-xem") ||
    pathname.startsWith("/phim-yeu-thich") ||
    pathname.startsWith("/profile");

  const isAuthPage = ["/login"].includes(pathname);

  // Redirect to login if trying to access protected pages without auth
  if (isProtectedPage && !isAuthenticated) {
    console.log(`Redirecting to login: ${pathname} (no auth)`);
    return NextResponse.redirect(new URL("/login", req.url));
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
