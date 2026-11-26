import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  isDefinitiveRefreshFailure,
} from "@/lib/session";

const publicPaths = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];

/**
 * Paths browsable without an account (guest mode). Everything else still redirects
 * to login. Keep this list to read-only discovery surfaces — any page that renders
 * personal data must stay behind auth.
 */
const guestPaths = ["/", "/feed", "/explore", "/post", "/legal", "/watchlists", "/watchlist", "/user", "/search", "/following", "/activity/item", "/blog", "/onboarding"];

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

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge,
    path: "/",
  };
}

function setAccessToken(response: NextResponse, token: string) {
  response.cookies.set("accessToken", token, cookieOptions(ACCESS_TOKEN_MAX_AGE));
}

function setRefreshToken(response: NextResponse, token: string) {
  response.cookies.set("refreshToken", token, cookieOptions(REFRESH_TOKEN_MAX_AGE));
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set("accessToken", "", { maxAge: 0, path: "/" });
  response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });
}

function copyCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      maxAge: cookie.maxAge,
      path: cookie.path,
    });
  }
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
  const feedUrl = new URL("/feed", request.url);
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("from", pathname);

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    if (accessToken) {
      const response = NextResponse.redirect(feedUrl);
      if (refreshToken) setRefreshToken(response, refreshToken);
      return response;
    }
    // A stale access cookie must not leave a signed-in user staring at Login.
    if (refreshToken) {
      const attempt = await tryRefresh(request, refreshToken);
      if (attempt.response) {
        const response = NextResponse.redirect(feedUrl);
        copyCookies(attempt.response, response);
        return response;
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (accessToken) {
    const shouldRedirect =
      pathname === "/" || pathname.startsWith("/onboarding");
    const response = shouldRedirect
      ? NextResponse.redirect(feedUrl)
      : NextResponse.next();
    // Activity rolls the refresh window forward while the user is active.
    if (refreshToken) setRefreshToken(response, refreshToken);
    return response;
  }

  // Access token expired — try refreshing with the refresh token
  if (refreshToken) {
    const attempt = await tryRefresh(request, refreshToken);
    if (attempt.response) {
      if (pathname === "/" || pathname.startsWith("/onboarding")) {
        const response = NextResponse.redirect(feedUrl);
        copyCookies(attempt.response, response);
        return response;
      }
      return attempt.response;
    }
    if (attempt.definitiveFailure) {
      const response = isGuestAllowed(pathname)
        ? NextResponse.next()
        : NextResponse.redirect(loginUrl);
      clearAuthCookies(response);
      return response;
    }
  }

  // Guest mode: no usable session — still allow read-only discovery surfaces.
  if (isGuestAllowed(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(loginUrl);
}

async function tryRefresh(
  request: NextRequest,
  refreshToken: string
): Promise<{ response: NextResponse | null; definitiveFailure: boolean }> {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://api-bingewise.com";
    const res = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      return {
        response: null,
        definitiveFailure: isDefinitiveRefreshFailure(res.status),
      };
    }

    const data = await res.json();
    if (!data.accessToken) {
      return { response: null, definitiveFailure: true };
    }

    const nextRefreshToken = data.refreshToken ?? refreshToken;

    // Make the new tokens visible to downstream handlers for this request
    request.cookies.set("accessToken", data.accessToken);
    request.cookies.set("refreshToken", nextRefreshToken);
    const response = NextResponse.next({ request: { headers: request.headers } });

    // Persist the new tokens in the browser
    setAccessToken(response, data.accessToken);
    setRefreshToken(response, nextRefreshToken);
    return { response, definitiveFailure: false };
  } catch {
    return { response: null, definitiveFailure: false };
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
