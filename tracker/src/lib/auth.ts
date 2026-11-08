import "server-only";
import { timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, users, type User } from "@/db";
import { hashPassword, verifyPassword } from "./password";
import { SESSION_COOKIE, signSession, verifySession } from "./session";

export type AppUser = { username: string; name: string; role: string; active: boolean };

const MAX_ACTIVE_USERS = 10;
const MIN_PASSWORD_LENGTH = 9;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
// Compared against when the username is unknown, so a wrong username takes as long as a wrong password.
const NO_USER_HASH = hashPassword("no such user");

export function displayName(username: string) {
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function toAppUser({ username, name, role, active }: User): AppUser {
  return { username, name, role, active };
}

/** APP_USERS="rishav:password1,partner:password2" is read once, to fill an empty table. They become admins. */
async function importEnvUsers() {
  const entries = (process.env.APP_USERS ?? "")
    .split(",")
    .map((entry) => {
      const trimmed = entry.trim();
      const i = trimmed.indexOf(":");
      return { username: trimmed.slice(0, i).trim().toLowerCase(), password: trimmed.slice(i + 1) };
    })
    .filter((u) => u.username && u.password);
  if (!entries.length) return;
  const values = await Promise.all(
    entries.map(async ({ username, password }) => ({
      username,
      name: displayName(username),
      passwordHash: await hashPassword(password),
      role: "admin",
    })),
  );
  await db.insert(users).values(values).onConflictDoNothing();
}

async function userRows(): Promise<User[]> {
  const select = () => db.select().from(users).orderBy(users.id);
  const rows = await select();
  if (rows.length) return rows;
  await importEnvUsers();
  return select();
}

/** Includes disabled users, whose names still appear on old work. Filter on `active` for pickers. */
export async function listUsers(): Promise<AppUser[]> {
  return (await userRows()).map(toAppUser);
}

function checkPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`);
}

export async function createUser(input: { username: string; name: string; password: string; role: string }) {
  const username = input.username.trim().toLowerCase();
  // "claude" is the name the API and skill runs write under.
  if (!/^[a-z0-9_-]{2,20}$/.test(username) || username === "claude") {
    throw new Error("Usernames are 2 to 20 lowercase letters, numbers, - or _ (and not \"claude\").");
  }
  checkPassword(input.password);
  const rows = await userRows();
  if (rows.some((u) => u.username === username)) throw new Error(`The username "${username}" is already taken.`);
  if (rows.filter((u) => u.active).length >= MAX_ACTIVE_USERS) throw new Error(`The limit is ${MAX_ACTIVE_USERS} active users.`);
  await db.insert(users).values({
    username,
    name: input.name.trim() || displayName(username),
    passwordHash: await hashPassword(input.password),
    role: input.role === "admin" ? "admin" : "member",
  });
}

export async function updateUserAccess(actor: AppUser, username: string, input: { name: string; role: string; active: boolean }) {
  const rows = await userRows();
  const target = rows.find((u) => u.username === username);
  if (!target) throw new Error("No such user.");
  const role = input.role === "admin" ? "admin" : "member";
  if (username === actor.username && !input.active) throw new Error("You can't disable your own account.");
  if (target.role === "admin" && target.active && (role !== "admin" || !input.active)) {
    const otherAdmins = rows.filter((u) => u.role === "admin" && u.active && u.username !== username);
    if (!otherAdmins.length) throw new Error("There has to be at least one active admin.");
  }
  if (input.active && !target.active && rows.filter((u) => u.active).length >= MAX_ACTIVE_USERS) {
    throw new Error(`The limit is ${MAX_ACTIVE_USERS} active users.`);
  }
  await db
    .update(users)
    .set({
      name: input.name.trim() || target.name,
      role,
      active: input.active,
      // Re-enabling someone must not revive a cookie left on an old device.
      sessionVersion: input.active ? target.sessionVersion : target.sessionVersion + 1,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(users.username, username));
}

/** Signs the user out on every device. */
export async function resetPassword(username: string, password: string) {
  checkPassword(password);
  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(password),
      failedLogins: 0,
      lockedUntil: null,
      sessionVersion: sql`${users.sessionVersion} + 1`,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(users.username, username));
}

/** Keeps this device signed in. */
export async function changeOwnPassword(user: AppUser, current: string, next: string) {
  const row = (await userRows()).find((u) => u.username === user.username);
  if (!row || !(await verifyPassword(current, row.passwordHash))) throw new Error("Your current password is wrong.");
  await resetPassword(user.username, next);
  await startSession(user);
}

/** "locked" after too many wrong passwords in a row, until the lock runs out. */
export async function checkCredentials(username: string, password: string): Promise<AppUser | null | "locked"> {
  const row = (await userRows()).find((u) => u.username === username.trim().toLowerCase());
  if (row?.lockedUntil && row.lockedUntil > new Date().toISOString()) return "locked";
  const ok = await verifyPassword(password, row?.passwordHash ?? (await NO_USER_HASH));
  // shortcut: unknown usernames aren't counted or slowed down beyond the hash; add a per-IP limit if guessing shows up.
  if (!row) return null;
  if (ok) {
    if (row.failedLogins) await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, row.id));
    return row.active ? toAppUser(row) : null;
  }
  const failed = row.failedLogins + 1;
  const lock = failed >= MAX_FAILED_LOGINS;
  await db
    .update(users)
    .set({ failedLogins: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : row.lockedUntil })
    .where(eq(users.id, row.id));
  return lock ? "locked" : null;
}

export async function startSession(user: AppUser) {
  const [row] = await db.select({ version: users.sessionVersion }).from(users).where(eq(users.username, user.username));
  const token = await signSession(user.username, row.version);
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
  const session = token ? await verifySession(token) : null;
  if (!session) return null;
  const row = (await userRows()).find((u) => u.username === session.username);
  return row?.active && row.sessionVersion === session.version ? toAppUser(row) : null;
}

/** Use in every page and Server Action: proxy.ts is only an optimistic check. */
export async function requireUser(): Promise<AppUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Only an admin can do that.");
  return user;
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkApiToken(request: Request) {
  const expected = process.env.API_TOKEN;
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  return Boolean(expected && token && safeEqual(token, expected));
}
