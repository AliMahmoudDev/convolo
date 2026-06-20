import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // If Supabase env vars are not set, skip auth checks (build-time / CI)
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session so it doesn't expire
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes — no auth needed
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

  // Auth routes — redirect logged-in users to dashboard
  const authRoutes = ["/login", "/signup"];

  // API routes pass through
  if (pathname.startsWith("/api")) {
    return supabaseResponse;
  }

  // Redirect logged-in users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route)) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Allow public routes
  if (publicRoutes.some((route) => pathname === route || pathname === route + "/")) {
    return supabaseResponse;
  }

  // Allow marketing sub-routes
  if (pathname.startsWith("/legal/") || pathname.startsWith("/blog/")) {
    return supabaseResponse;
  }

  // Protect app routes
  const protectedPrefixes = [
    "/dashboard",
    "/learn",
    "/review",
    "/vocabulary",
    "/progress",
    "/profile",
    "/settings",
  ];
  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
