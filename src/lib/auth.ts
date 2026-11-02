import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { sessions, users, authAttempts } from "./db/schema";
export const COOKIE = "panic_session";
const YEAR = 365 * 86400;
export function digest(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const rows = await db()
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, digest(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    );
  return rows[0]?.user ?? null;
}
export async function newSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await db().delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await db()
    .insert(sessions)
    .values({
      tokenHash: digest(token),
      userId,
      expiresAt: new Date(Date.now() + YEAR * 1000),
    });
  await setCookie(token);
}
async function setCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: YEAR,
  });
}
export async function renewSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return;
  await db()
    .update(sessions)
    .set({ expiresAt: new Date(Date.now() + YEAR * 1000) })
    .where(eq(sessions.tokenHash, digest(token)));
  await setCookie(token);
}
export async function logout() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token)
    await db()
      .delete(sessions)
      .where(eq(sessions.tokenHash, digest(token)));
  (await cookies()).delete(COOKIE);
}
// Atomic DB counters work across serverless instances and include unknown usernames.
export async function throttle(key: string, limit: number) {
  const database = db();
  const now = new Date();
  const [row] = await database
    .insert(authAttempts)
    .values({
      key: digest(key),
      count: 1,
      expiresAt: new Date(Date.now() + 15 * 60_000),
    })
    .onConflictDoUpdate({
      target: authAttempts.key,
      set: {
        count: sql`CASE WHEN ${authAttempts.expiresAt} < ${now.toISOString()}::timestamptz THEN 1 ELSE ${authAttempts.count} + 1 END`,
        expiresAt: sql`CASE WHEN ${authAttempts.expiresAt} < ${now.toISOString()}::timestamptz THEN ${new Date(Date.now() + 15 * 60_000).toISOString()}::timestamptz ELSE ${authAttempts.expiresAt} END`,
      },
    })
    .returning();
  await database
    .delete(authAttempts)
    .where(lt(authAttempts.expiresAt, new Date(Date.now() - 86400_000)));
  if (row.count > limit)
    throw new Error(
      "Too many attempts. Take a breather and try again in 15 minutes.",
    );
}
