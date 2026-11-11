import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  sessions,
  tasks,
  groups,
  groupMembers,
  taskCompletions,
  subjects,
} from "@/lib/db/schema";
import {notify,type Notice} from "@/lib/push";
import { visible } from "@/lib/data";
import { mutation } from "@/lib/validation";
import { sameOrigin, failure } from "@/lib/http";
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const input = mutation.parse(await req.json());
    const user = await currentUser();
    if (!user) throw new Error("Please log in.");
    const database = db();
    let notice:Notice|undefined;
    await database.transaction(async (tx) => {
      if (input.action === "createTask") {
        const [membership] = await tx
          .select()
          .from(groupMembers)
          .where(
            and(
              eq(groupMembers.userId, user.id),
              eq(groupMembers.subjectId, input.data.subjectId),
            ),
          )
          .for("update");
        if (input.data.scope === "group" && !membership)
          throw new Error("Join a group for this subject first.");
        await tx
          .insert(tasks)
          .values({
            ...input.data,
            dueAt: new Date(input.data.dueAt),
            createdBy: user.id,
            groupId: input.data.scope === "group" ? membership.groupId : null,
          });
        const [subject]=await tx.select({name:subjects.name}).from(subjects).where(eq(subjects.id,input.data.subjectId));
        notice={title:input.data.title,body:[subject.name,input.data.scope,input.data.priority+" priority",user.displayName].join(" · "),dueAt:new Date(input.data.dueAt).toISOString(),url:"/",personalId:input.data.scope==="personal"?user.id:undefined,groupId:input.data.scope==="group"?membership.groupId:undefined};
        return;
      }
      if (
        ["editTask", "deleteTask", "complete"].includes(input.action) &&
        "id" in input &&
        input.id
      ) {
        const [task] = await tx
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, input.id), visible(user)))
          .for("update");
        if (!task) throw new Error("Task not found.");
        if (input.action === "complete") {
          if (user.role !== "super_admin") {
            if (task.scope === "personal" && task.createdBy !== user.id)
              throw new Error("Not allowed.");
            if (task.scope === "group") {
              const [member] = await tx
                .select()
                .from(groupMembers)
                .where(
                  and(
                    eq(groupMembers.userId, user.id),
                    eq(groupMembers.groupId, task.groupId!),
                  ),
                )
                .for("update");
              if (!member) throw new Error("Not allowed.");
            }
          }
          const slot = task.scope === "batch" ? user.id : "shared";
          if (input.done)
            await tx
              .insert(taskCompletions)
              .values({ taskId: task.id, slot, completedBy: user.id })
              .onConflictDoNothing();
          else
            await tx
              .delete(taskCompletions)
              .where(
                and(
                  eq(taskCompletions.taskId, task.id),
                  eq(taskCompletions.slot, slot),
                ),
              );
        } else {
          if (user.role !== "super_admin" && task.createdBy !== user.id)
            throw new Error("Not allowed.");
          if (input.action === "deleteTask")
            await tx.delete(tasks).where(eq(tasks.id, task.id));
          if (input.action === "editTask") {
            if (
              task.scope !== input.data.scope ||
              task.subjectId !== input.data.subjectId
            )
              throw new Error("Subject and scope cannot be changed.");
            await tx
              .update(tasks)
              .set({
                title: input.data.title,
                description: input.data.description,
                dueAt: new Date(input.data.dueAt),
                priority: input.data.priority,
                updatedAt: new Date(),
              })
              .where(eq(tasks.id, task.id));
          }
        }
        return;
      }
      if (user.role !== "super_admin") throw new Error("Not allowed.");
      if (input.action === "addUser")
        await tx
          .insert(users)
          .values({
            username: input.data.username,
            displayName: input.data.displayName,
            passwordHash: await bcrypt.hash(input.data.password, 12),
          });
      if (input.action === "deleteUser") {
        const [target] = await tx
          .select()
          .from(users)
          .where(eq(users.id, input.id))
          .for("update");
        if (target?.role === "super_admin")
          throw new Error("The super admin cannot be deleted.");
        // Remove personal batch progress; retain shared completion attribution as Deleted user.
        await tx
          .delete(taskCompletions)
          .where(eq(taskCompletions.slot, input.id));
        await tx.delete(users).where(eq(users.id, input.id));
      }
      if (input.action === "resetPassword") {
        await tx
          .update(users)
          .set({ passwordHash: await bcrypt.hash(input.password, 12) })
          .where(eq(users.id, input.id));
        await tx.delete(sessions).where(eq(sessions.userId, input.id));
      }
      if (input.action === "saveGroup") {
        if (input.id)
          await tx
            .update(groups)
            .set({ name: input.name })
            .where(
              and(
                eq(groups.id, input.id),
                eq(groups.subjectId, input.subjectId),
              ),
            );
        else
          await tx
            .insert(groups)
            .values({ name: input.name, subjectId: input.subjectId });
      }
      if (input.action === "deleteGroup")
        await tx.delete(groups).where(eq(groups.id, input.id));
      if (input.action === "membership") {
        if (input.groupId) {
          const [group] = await tx
            .select()
            .from(groups)
            .where(
              and(
                eq(groups.id, input.groupId),
                eq(groups.subjectId, input.subjectId),
              ),
            )
            .for("update");
          if (!group) throw new Error("Group not found.");
          await tx
            .insert(groupMembers)
            .values({
              userId: input.userId,
              subjectId: input.subjectId,
              groupId: input.groupId,
            })
            .onConflictDoUpdate({
              target: [groupMembers.userId, groupMembers.subjectId],
              set: { groupId: input.groupId },
            });
        } else
          await tx
            .delete(groupMembers)
            .where(
              and(
                eq(groupMembers.userId, input.userId),
                eq(groupMembers.subjectId, input.subjectId),
              ),
            );
      }
    });
    if(notice) await notify(notice);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
