import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, signSession, verifySession } from "./session";

export type AppUser = { username: string; name: string };

/** APP_USERS="rishav:password1,partner:password2" */
function configuredUsers() {
  return (process.env.APP_USERS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const i = entry.indexOf(":");
      const username = entry.slice(0, i).trim().toLowerCase();
      return { username, password: entry.slice(i + 1), name: displayName(username) };
    })
    .filter((u) => u.username && u.password);
}

export function displayName(username: string) {
  return username.charAt(0).toUpperCase() + username.slice(1);
}

export function listUsers(): AppUser[] {
  return configuredUsers().map(({ username, name }) => ({ username, name }));
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkCredentials(username: string, password: string): AppUser | null {
  const user = configuredUsers().find((u) => u.username === username.trim().toLowerCase());
  if (!user || !safeEqual(user.password, password)) return null;
  return { username: user.username, name: user.name };
}

export async function startSession(user: AppUser) {
  const token = await signSession(user.username);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getUser(): Promise<AppUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const username = token ? await verifySession(token) : null;
  if (!username) return null;
  const user = listUsers().find((u) => u.username === username);
  return user ?? null;
}

/** Use in every page and Server Action: proxy.ts is only an optimistic check. */
export async function requireUser(): Promise<AppUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export function checkApiToken(request: Request) {
  const expected = process.env.API_TOKEN;
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  return Boolean(expected && token && safeEqual(token, expected));
}
