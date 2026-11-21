import "server-only";
import { and, eq, inArray, sql, isNull } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  subjects,
  groups,
  groupMembers,
  tasks,
  taskCompletions, subtasks, subtaskCompletions, semesters, plannerSettings, semesterSubjects,
} from "./db/schema";
export type User = typeof users.$inferSelect;
export { visible } from "./permissions";
import { visible } from "./permissions";
export async function loadData(user: User, admin = false, history = false) {
  if (admin && user.role !== "super_admin") throw new Error("Not allowed.");
  const database = db();
  const [settings]=await database.select({id:semesters.id,name:semesters.name}).from(plannerSettings).innerJoin(semesters,eq(semesters.id,plannerSettings.currentSemesterId)).where(eq(plannerSettings.id,1));
  const taskRows = await database
    .select({ task: tasks, creator: users.displayName })
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.createdBy))
    .where(and(visible(user),history?undefined:isNull(tasks.deletedAt),history?undefined:eq(tasks.semesterId,settings.id)))
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
  const checklist=ids.length?await database.select().from(subtasks).where(inArray(subtasks.taskId,ids)).orderBy(subtasks.position):[];
  const checklistDone=checklist.length?await database.select().from(subtaskCompletions).where(inArray(subtaskCompletions.subtaskId,checklist.map(item=>item.id))):[];
  const [count] = await database
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "student"));
  const memberships = await database
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.semesterId,settings.id),admin ? undefined : eq(groupMembers.userId,user.id)));
  return {
    semester:settings,
    user: {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      role: user.role,
    },
    subjects: await database.select().from(subjects),
    currentSubjectIds: (await database.select({id:semesterSubjects.subjectId}).from(semesterSubjects).where(eq(semesterSubjects.semesterId,settings.id))).map(row=>row.id),
    groups: await database
      .select()
      .from(groups)
      .where(
        admin
          ? eq(groups.semesterId,settings.id)
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
        subtasks:checklist.filter(item=>item.taskId===task.id).map(item=>({...item,done:checklistDone.some(done=>done.subtaskId===item.id && done.slot===(task.scope==="batch"?user.id:"shared"))})),
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
