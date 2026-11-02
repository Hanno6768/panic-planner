import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { credentials, registration } from "@/lib/validation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  currentUser,
  newSession,
  logout,
  renewSession,
  throttle,
  digest,
} from "@/lib/auth";
import { failure, sameOrigin } from "@/lib/http";
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("login"), data: credentials }),
  z.object({ action: z.literal("signup"), data: registration }),
  z.object({ action: z.literal("logout") }),
  z.object({ action: z.literal("renew") }),
]);
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const body = input.parse(await req.json());
    if (body.action === "logout") {
      await logout();
      return NextResponse.json({ ok: true });
    }
    if (body.action === "renew") {
      if (!(await currentUser())) throw new Error("Please log in.");
      await renewSession();
      return NextResponse.json({ ok: true });
    }
    // Vercel overwrites x-vercel-forwarded-for; do not trust arbitrary forwarded headers.
    const ip = req.headers.get("x-vercel-forwarded-for") ?? "local";
    await throttle(`ip:${ip}`, 60);
    await throttle(`username:${body.data.username}`, 10);
    if (body.action === "signup") {
      if (
        process.env.BATCH_JOIN_CODE &&
        digest(body.data.joinCode ?? "") !== digest(process.env.BATCH_JOIN_CODE)
      )
        throw new Error("Join code is incorrect.");
      const [user] = await db()
        .insert(users)
        .values({
          username: body.data.username,
          displayName: body.data.displayName,
          passwordHash: await bcrypt.hash(body.data.password, 12),
          role: "student",
        })
        .returning({ id: users.id });
      await newSession(user.id);
    } else {
      const [user] = await db()
        .select()
        .from(users)
        .where(eq(users.username, body.data.username));
      const valid = await bcrypt.compare(
        body.data.password,
        user?.passwordHash ??
          "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW",
      );
      if (!user || !valid)
        throw new Error("Username or password is incorrect.");
      await newSession(user.id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
