import { and, eq, or, sql } from "drizzle-orm";
import { tasks, groupMembers } from "./db/schema";
export function visible(user: { id: string; role: "student" | "super_admin" }) {
  if (user.role === "super_admin") return sql`true`;
  return or(
    and(eq(tasks.scope, "personal"), eq(tasks.createdBy, user.id)),
    eq(tasks.scope, "batch"),
    and(
      eq(tasks.scope, "group"),
      sql`exists (select 1 from ${groupMembers} where ${groupMembers.userId} = ${user.id} and ${groupMembers.groupId} = ${tasks.groupId})`,
    ),
  )!;
}
