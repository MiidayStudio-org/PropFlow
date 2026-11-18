import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  let token = request.cookies.get("propflow_token")?.value;
  const urlToken = searchParams.get("token");

  // If token is passed in URL (e.g. Google OAuth redirect callback), set cookie & allow access
  if (urlToken) {
    const response = NextResponse.next();
    response.cookies.set("propflow_token", urlToken, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
    return response;
  }

  // Protected dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and visiting /login without logout intent, send directly to dashboard
  if (pathname === "/login") {
    if (token && !searchParams.has("error") && !searchParams.has("logout")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
