import { apiClient } from "./api-client";
import { clearScrollMemory } from "@/hooks/use-scroll-restoration";
import { getRefreshResult } from "./token-refresh";
import { DEFAULT_TOKEN_TTL_SECONDS } from "./session";
import type { AuthResponse, AuthUserInfo, LoginRequest, RegisterRequest } from "@/types/auth";
import type { UserDto } from "@/types/user";

function authUserToDto(user: AuthUserInfo): UserDto {
  return {
    userId: user.id,
    name: user.name || user.username,
    username: user.username,
    email: user.email,
    isPrivate: false,
    createdAt: new Date().toISOString(),
  };
}

function tokenExpiryFrom(auth: AuthResponse): number {
  return Date.now() + (auth.expiresIn ?? DEFAULT_TOKEN_TTL_SECONDS) * 1000;
}

export async function login(data: LoginRequest): Promise<{ user: UserDto; tokenExpiresAt: number }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Login failed" }));
    throw new Error(error.message || `Login failed: ${res.status}`);
  }
  const auth: AuthResponse = await res.json();
  const tokenExpiresAt = tokenExpiryFrom(auth);

  // Fresh session: never restore scroll from a previous session.
  clearScrollMemory();

  if (auth.user) {
    return { user: authUserToDto(auth.user), tokenExpiresAt };
  }

  return {
    user: {
      userId: 0,
      name: "Unknown",
      username: "",
      email: "",
      isPrivate: false,
      createdAt: new Date().toISOString(),
    },
    tokenExpiresAt,
  };
}

export async function register(data: RegisterRequest): Promise<{ user: UserDto; tokenExpiresAt: number }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Registration failed" }));
    throw new Error(error.message || `Registration failed: ${res.status}`);
  }
  const auth: AuthResponse = await res.json();
  const tokenExpiresAt = tokenExpiryFrom(auth);

  // Fresh session: never restore scroll from a previous session.
  clearScrollMemory();

  if (auth.user) {
    return { user: authUserToDto(auth.user), tokenExpiresAt };
  }

  return {
    user: {
      userId: 0,
      name: data.name,
      username: data.username,
      email: data.email,
      isPrivate: false,
      createdAt: new Date().toISOString(),
    },
    tokenExpiresAt,
  };
}

export async function logout(): Promise<void> {
  clearScrollMemory();
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function refreshSession(): Promise<{ user: UserDto; tokenExpiresAt: number } | null> {
  try {
    const result = await getRefreshResult();
    if (result.status !== "ok" || !result.user) return null;
    return {
      user: result.user,
      tokenExpiresAt: Date.now() + (result.expiresIn ?? DEFAULT_TOKEN_TTL_SECONDS) * 1000,
    };
  } catch {
    return null;
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiClient("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }
}

export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<void> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Reset failed" }));
    throw new Error(error.message || "Reset failed");
  }
}
