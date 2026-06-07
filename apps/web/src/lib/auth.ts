import type { AuthUser } from "@tignal/shared";

export const TOKEN_COOKIE = "tignal_token";
export const USER_COOKIE = "tignal_user";
const MAX_AGE = 60 * 60 * 8; // 8 saat

/** Tarayıcı çerezinden değer okur. */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function setSession(token: string, user: AuthUser): void {
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${MAX_AGE}; samesite=lax`;
  document.cookie = `${USER_COOKIE}=${encodeURIComponent(
    JSON.stringify(user),
  )}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

export function clearSession(): void {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${USER_COOKIE}=; path=/; max-age=0`;
}

export function getToken(): string | null {
  return readCookie(TOKEN_COOKIE);
}

export function getUser(): AuthUser | null {
  const raw = readCookie(USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
