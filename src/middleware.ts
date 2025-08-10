import { NextRequest, NextResponse } from "next/server";

export const middleware = (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = req.cookies.get("accessToken");

  const isHistoryPage = pathname.startsWith("/lich-su-xem");
  const isAuthPage = ["/login"].includes(pathname);

  // if (!isAuthenticated) return redirectTo("/login", req);

  if (isHistoryPage && !isAuthenticated) {
    return redirectTo("/login", req);
  }

  if (isAuthPage && isAuthenticated) {
    return redirectTo("/", req);
  }

  return NextResponse.next();
};

function redirectTo(path: string, req: NextRequest) {
  return NextResponse.redirect(new URL(path, req.url));
}

export const config = {
  matcher: ["/lich-su-xem", "/login"],
};
