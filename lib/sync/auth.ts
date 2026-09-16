import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

import { ensureRemoteSchema } from "@/lib/sync/turso";

const scrypt = promisify(scryptCallback);
const sessionCookieName = "tember-session";
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 90;

export type SessionAccount = { id: string; username: string };

function now(): string {
  return new Date().toISOString();
}

function expiresAt(): string {
  return new Date(Date.now() + sessionLifetimeMs).toISOString();
}

function validUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(username);
}

export function validateAccountInput(username: unknown, password: unknown): string | undefined {
  if (typeof username !== "string" || !validUsername(username.trim())) {
    return "Use 3 to 32 letters, numbers, hyphens, or underscores for the account name.";
  }
  if (typeof password !== "string" || password.length < 12) {
    return "Use a password with at least 12 characters.";
  }
  return undefined;
}

async function hashPassword(password: string, salt = randomBytes(16).toString("hex")): Promise<string> {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${Buffer.from(derived).toString("hex")}`;
}

async function passwordMatches(password: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = await hashPassword(password, salt);
  const actualHash = actual.split(":")[1];
  return timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expected, "hex"));
}

async function setSession(accountId: string): Promise<void> {
  const database = await ensureRemoteSchema();
  const id = randomBytes(32).toString("base64url");
  const expiration = expiresAt();
  await database.execute({
    sql: "INSERT INTO sessions (id, account_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    args: [id, accountId, expiration, now()],
  });
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiration),
    path: "/",
  });
}

export async function accountCount(): Promise<number> {
  const database = await ensureRemoteSchema();
  const result = await database.execute("SELECT COUNT(*) AS count FROM accounts");
  return Number(result.rows[0]?.count ?? 0);
}

export async function setupAccount(username: string, password: string): Promise<SessionAccount> {
  if ((await accountCount()) > 0) throw new Error("The shared account is already set up.");
  const account: SessionAccount = { id: crypto.randomUUID(), username: username.trim() };
  const database = await ensureRemoteSchema();
  await database.execute({
    sql: "INSERT INTO accounts (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
    args: [account.id, account.username, await hashPassword(password), now()],
  });
  await setSession(account.id);
  return account;
}

export async function loginAccount(username: string, password: string): Promise<SessionAccount | undefined> {
  const database = await ensureRemoteSchema();
  const result = await database.execute({
    sql: "SELECT id, username, password_hash FROM accounts WHERE username = ? LIMIT 1",
    args: [username.trim()],
  });
  const account = result.rows[0];
  if (!account || typeof account.password_hash !== "string" || !(await passwordMatches(password, account.password_hash))) {
    return undefined;
  }
  const session = { id: String(account.id), username: String(account.username) };
  await setSession(session.id);
  return session;
}

export async function getSessionAccount(): Promise<SessionAccount | undefined> {
  const cookieStore = await cookies();
  const id = cookieStore.get(sessionCookieName)?.value;
  if (!id) return undefined;
  const database = await ensureRemoteSchema();
  const result = await database.execute({
    sql: "SELECT accounts.id, accounts.username FROM sessions JOIN accounts ON accounts.id = sessions.account_id WHERE sessions.id = ? AND sessions.expires_at > ? LIMIT 1",
    args: [id, now()],
  });
  const account = result.rows[0];
  return account ? { id: String(account.id), username: String(account.username) } : undefined;
}

export async function logoutAccount(): Promise<void> {
  const cookieStore = await cookies();
  const id = cookieStore.get(sessionCookieName)?.value;
  if (id) {
    const database = await ensureRemoteSchema();
    await database.execute({ sql: "DELETE FROM sessions WHERE id = ?", args: [id] });
  }
  cookieStore.delete(sessionCookieName);
}
