import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
// Lazy connection: builds do not require production credentials.
const globalDb = globalThis as unknown as {
  panicDb?: ReturnType<typeof postgres>;
  panicPreviewDb?: ReturnType<typeof postgres>;
};
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is missing. Follow README setup.");
  // PGlite's local preview has one backend; named statements avoid multiplexing collisions.
  const localPreview =
    process.env.NODE_ENV !== "production" &&
    process.env.DATABASE_URL.includes("127.0.0.1:5439/");
  const key = localPreview ? "panicPreviewDb" : "panicDb";
  globalDb[key] ??= postgres(process.env.DATABASE_URL, {
    max: localPreview ? 1 : 3,
    idle_timeout: 20,
    prepare: localPreview,
  });
  return drizzle(globalDb[key], { schema });
}
