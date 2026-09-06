import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/lib/session";

const publicPaths = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];

/**
 * Paths browsable without an account (guest mode). Everything else still redirects
 * to login. Keep this list to read-only discovery surfaces — any page that renders
 * personal data must stay behind auth.
 */
const guestPaths = ["/", "/feed", "/explore", "/post", "/legal", "/watchlists", "/watchlist", "/user", "/search", "/following", "/activity/item"];

function isGuestAllowed(pathname: string): boolean {
  return guestPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Public assets must never be auth-gated: the web manifest and PWA icons,
// robots.txt/sitemap.xml, ads.txt, llms.txt, the FCM service worker and any
// .well-known files are fetched by browsers/crawlers before tokens exist.
// Matching by extension here (full-syntax regex) keeps anything new dropped
// into /public reachable too. The matcher below still short-circuits the
// hot paths (_next, favicon, images) before middleware even runs.
const staticAssetPath =
  /\.(?:png|jpe?g|gif|svg|webp|ico|css|js|mjs|map|woff2?|ttf|otf|txt|xml|json|html|pdf)$/;
export function isStaticAsset(pathname: string): boolean {
  return (
    staticAssetPath.test(pathname) ||
    pathname.startsWith("/.well-known/") ||
    pathname === "/site.webmanifest" ||
    pathname === "/manifest.webmanifest"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.toLowerCase().split(":")[0] ?? "";

  // 1) Static/public asset passthrough (no auth, no redirects).
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Vercel is configured to redirect the apex (bingewise.net) to
  // www.bingewise.net, so www is the canonical host. We intentionally avoid an
  // app-level host redirect here (it would conflict with Vercel's edge redirect);
  // we only keep Vercel preview/production subdomains out of search indexes.

  // 2) Auth / guest routing.
  const response = await handleRequest(request, pathname);

  // 3) Keep Vercel preview/production subdomains out of search indexes; the
  //    apex (bingewise.net) is the only host we want crawled.
  if (process.env.NODE_ENV === "production" && host.endsWith(".vercel.app")) {
    response.headers.set("X-Robots-Tag", "noindex");
  }

  return response;
}

async function handleRequest(
  request: NextRequest,
  pathname: string
): Promise<NextResponse> {
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    if (accessToken) {
      return NextResponse.redirect(new URL("/feed", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (accessToken) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/feed", request.url));
    }
    return NextResponse.next();
  }

  // Access token expired — try refreshing with the refresh token
  if (refreshToken) {
    const refreshed = await tryRefresh(request, refreshToken);
    if (refreshed) {
      return refreshed;
    }
  }

  // Guest mode: no tokens at all — still allow read-only discovery surfaces
  if (isGuestAllowed(pathname)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

async function tryRefresh(
  request: NextRequest,
  refreshToken: string
): Promise<NextResponse | null> {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://api-bingewise.com";
    const res = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.accessToken) return null;

    // Make the new tokens visible to downstream handlers for this request
    request.cookies.set("accessToken", data.accessToken);
    if (data.refreshToken) {
      request.cookies.set("refreshToken", data.refreshToken);
    }
    const response = NextResponse.next({ request: { headers: request.headers } });

    // Persist the new tokens in the browser
    response.cookies.set("accessToken", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ACCESS_TOKEN_MAX_AGE,
      path: "/",
    });
    if (data.refreshToken) {
      response.cookies.set("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: "/",
      });
    }
    return response;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
