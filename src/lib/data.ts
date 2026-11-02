import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  subjects,
  groups,
  groupMembers,
  tasks,
  taskCompletions,
} from "./db/schema";
export type User = typeof users.$inferSelect;
export { visible } from "./permissions";
import { visible } from "./permissions";
export async function loadData(user: User, admin = false) {
  if (admin && user.role !== "super_admin") throw new Error("Not allowed.");
  const database = db();
  const taskRows = await database
    .select({ task: tasks, creator: users.displayName })
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.createdBy))
    .where(visible(user))
    .orderBy(tasks.dueAt);
  const ids = taskRows.map((r) => r.task.id);
  const completions = ids.length
    ? await database
        .select({
          taskId: taskCompletions.taskId,
          slot: taskCompletions.slot,
          completedAt: taskCompletions.completedAt,
          completedBy: taskCompletions.completedBy,
          name: users.displayName,
          role: users.role,
        })
        .from(taskCompletions)
        .leftJoin(users, eq(users.id, taskCompletions.completedBy))
        .where(inArray(taskCompletions.taskId, ids))
    : [];
  const [count] = await database
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "student"));
  const memberships = await database
    .select()
    .from(groupMembers)
    .where(admin ? sql`true` : eq(groupMembers.userId, user.id));
  return {
    user: {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      role: user.role,
    },
    subjects: await database.select().from(subjects),
    groups: await database
      .select()
      .from(groups)
      .where(
        admin
          ? sql`true`
          : inArray(
              groups.id,
              memberships.map((m) => m.groupId),
            ),
      ),
    memberships,
    tasks: taskRows.map(({ task, creator }) => {
      const records = completions.filter((c) => c.taskId === task.id);
      const completion = records.find(
        (c) => c.slot === (task.scope === "batch" ? user.id : "shared"),
      );
      return {
        ...task,
        creator: creator ?? "Deleted user",
        done: !!completion,
        completedAt: completion?.completedAt ?? null,
        completedBy: completion?.name ?? "Deleted user",
        doneCount: records.filter((c) => c.role === "student").length,
        studentCount: count.total,
      };
    }),
    participants: admin
      ? await database
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            role: users.role,
            createdAt: users.createdAt,
            completed: sql<number>`(select count(*)::int from task_completions where completed_by = ${users.id})`,
          })
          .from(users)
          .orderBy(users.displayName)
      : [],
  };
}
export type AppData = Awaited<ReturnType<typeof loadData>>;
