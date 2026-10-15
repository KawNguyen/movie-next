import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/lich-su-xem") ||
    pathname.startsWith("/phim-yeu-thich");

  const isAuthPage = ["/login"].includes(pathname);
  const session = await auth.api.getSession({ headers: req.headers });
  const isAuthenticated = !!session?.user;

  // Redirect to login if trying to access protected pages without auth
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set(
      "redirect",
      `${pathname}${req.nextUrl.search}`,
    );

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
