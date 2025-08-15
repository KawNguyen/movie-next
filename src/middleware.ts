import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Simple cookie-based authentication check
  // Better Auth stores session information in cookies
  const sessionCookie = req.cookies.get("better-auth.session_token");
  const isAuthenticated = !!sessionCookie?.value;

  const isProtectedPage =
    pathname.startsWith("/lich-su-xem") ||
    pathname.startsWith("/yeu-thich") ||
    pathname.startsWith("/profile");

  const isAuthPage = ["/login"].includes(pathname);

  // Redirect to login if trying to access protected pages without auth
  if (isProtectedPage && !isAuthenticated) {
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
