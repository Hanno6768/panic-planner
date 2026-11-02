import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { subjects, users } from "../src/lib/db/schema";
import { credentials } from "../src/lib/validation";
async function main() {
  const env = z
    .object({
      DATABASE_URL: z.string().min(1),
      ADMIN_USERNAME: z.string(),
      ADMIN_PASSWORD: z.string(),
    })
    .parse(process.env);
  const admin = credentials.parse({
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD,
  });
  const client = postgres(env.DATABASE_URL, { max: 1, prepare: false });
  const database = drizzle(client);
  try {
    await database.transaction(async (tx) => {
      await tx
        .insert(subjects)
        .values([
          { name: "English for Academic Purposes", color: "purple" },
          { name: "Mathematics", color: "blue" },
          { name: "Personal Development and Study Skills", color: "amber" },
          { name: "Digital Communication and Collaboration", color: "green" },
        ])
        .onConflictDoNothing();
      const existing = await tx
        .select()
        .from(users)
        .where(eq(users.role, "super_admin"));
      if (!existing.length)
        await tx
          .insert(users)
          .values({
            username: admin.username,
            displayName: "Muhaned Muaz",
            passwordHash: await bcrypt.hash(admin.password, 12),
            role: "super_admin",
          });
      else if (existing[0].username === admin.username)
        await tx.update(users).set({ displayName: "Muhaned Muaz" }).where(eq(users.id, existing[0].id));
    });
    console.log(
      "Seed complete. Four subjects and the super admin ensured. No demo users, groups or tasks are created; existing admin credentials are never overwritten.",
    );
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error(
    "Seed failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
