import type { NextRequest } from "next/server";

/**
 * CSRF defense-in-depth for state-changing API routes. SameSite=strict
 * cookies already block classic CSRF; this additionally rejects any request
 * that presents an Origin which doesn't match our own host — the signature
 * of a cross-site attacker-driven POST/PUT/DELETE.
 *
 * Requests without an Origin header (curl, server-to-server) are allowed so
 * health checks and tooling keep working.
 */
export function hasAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host =
    forwardedHost ?? request.headers.get("host") ?? request.nextUrl.host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
