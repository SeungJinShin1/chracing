/**
 * Next.js Middleware — Protects /admin route.
 *
 * Simple password-based auth using a cookie.
 * Password is checked via query param ?pw=<ADMIN_PASSWORD>
 * and stored as a cookie for subsequent requests.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "chracing2026";
const COOKIE_NAME = "chracing_admin_auth";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Check if password is provided as query param
  const pw = searchParams.get("pw");
  if (pw === ADMIN_PASSWORD) {
    // Set auth cookie and redirect to clean URL
    const url = request.nextUrl.clone();
    url.searchParams.delete("pw");
    const response = NextResponse.redirect(url);
    response.cookies.set(COOKIE_NAME, "authenticated", {
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    return response;
  }

  // Check existing cookie
  const authCookie = request.cookies.get(COOKIE_NAME);
  if (authCookie?.value === "authenticated") {
    return NextResponse.next();
  }

  // Not authenticated — redirect to home
  const homeUrl = request.nextUrl.clone();
  homeUrl.pathname = "/";
  homeUrl.searchParams.set("auth", "required");
  return NextResponse.redirect(homeUrl);
}

export const config = {
  matcher: "/admin/:path*",
};
