import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "./lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "./lib/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let session = null;

  if (token) {
    session = await decrypt(token);
  }

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isLandingRoute = pathname === "/";

  if (isDashboardRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && (isAuthRoute || isLandingRoute)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - next.svg, vercel.svg (logo files in public/)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)",
  ],
};
