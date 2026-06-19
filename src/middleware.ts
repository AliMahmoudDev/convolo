import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/features",
    "/pricing",
    "/faq",
    "/about",
    "/blog",
    "/careers",
    "/contact",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
  ];

  // Auth routes (redirect to dashboard if already logged in)
  const authRoutes = ["/login", "/signup"];

  // API auth routes should pass through
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route)) && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Allow public routes
  if (publicRoutes.some((route) => pathname === route || pathname === route + "/")) {
    return NextResponse.next();
  }

  // Allow marketing sub-routes (blog posts, etc.)
  if (pathname.startsWith("/legal/") || pathname.startsWith("/blog/")) {
    return NextResponse.next();
  }

  // Protect app routes — redirect to login if not authenticated
  const protectedPrefixes = [
    "/dashboard",
    "/learn",
    "/review",
    "/vocabulary",
    "/progress",
    "/settings",
  ];
  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // TODO: Check admin role when admin system is implemented
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|images|audio).*)",
  ],
};
