import { cache } from "react";
import { cookies, headers } from "next/headers";
import type { UserDto } from "@/types/user";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-bingewise.com";

/**
 * Server-side user fetch for SSR + generateMetadata. Returns null on any
 * failure so the client component can fall back to its own fetch.
 */
export const fetchUserForRender = cache(
  async (username: string): Promise<UserDto | null> => {
    if (!username || username === "undefined") return null;

    const accessToken = cookies().get("accessToken")?.value;
    const requestHeaders = headers();

    const fetchHeaders: Record<string, string> = {
      Accept: "application/json",
    };
    if (accessToken) fetchHeaders.Authorization = `Bearer ${accessToken}`;

    const clientIp =
      requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip");
    if (clientIp) fetchHeaders["X-Forwarded-For"] = clientIp;

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/users/username?username=${encodeURIComponent(username)}`,
        {
          headers: fetchHeaders,
          next: { revalidate: 3600 },
        }
      );
      if (!res.ok) return null;
      return (await res.json()) as UserDto;
    } catch {
      return null;
    }
  }
);
