import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check multiple possible cookie names for better-auth (including production secure cookies)
  const sessionTokens = {
    secureToken: req.cookies.get("__Secure-better-auth.session_token")?.value,
    secureData: req.cookies.get("__Secure-better-auth.session_data")?.value,
    token: req.cookies.get("better-auth.session_token")?.value,
    tokenAlt: req.cookies.get("better-auth.session-token")?.value,
    simple: req.cookies.get("session-token")?.value,
    legacy: req.cookies.get("better_auth_session")?.value,
  };

  const sessionToken =
    sessionTokens.secureToken ||
    sessionTokens.secureData ||
    sessionTokens.token ||
    sessionTokens.tokenAlt ||
    sessionTokens.simple ||
    sessionTokens.legacy;

  const isAuthenticated = !!sessionToken;

  const isProtectedPage =
    pathname.startsWith("/lich-su-xem") ||
    pathname.startsWith("/phim-yeu-thich") ||
    pathname.startsWith("/profile");

  const isAuthPage = ["/login"].includes(pathname);

  // Redirect to login if trying to access protected pages without auth
  if (isProtectedPage && !isAuthenticated) {
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
