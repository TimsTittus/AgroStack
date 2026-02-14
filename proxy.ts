import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const authRoutes = ["/login", "/register"];

const protectedRoutes = ["/farmer", "buyer"];

export async function proxy(request: NextRequest, response: NextResponse) {
  const session = getSessionCookie(request, {
    cookiePrefix: "agroo",
  });

  if (session) {
    if (authRoutes.some((route) => request.nextUrl.pathname === route)) return NextResponse.redirect(new URL(`/dashboard`, request.url));
  } else {
    if (protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route)))
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};