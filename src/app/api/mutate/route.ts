import { after, NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, inArray, notInArray } from "drizzle-orm";
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
  subjects, subtasks, subtaskCompletions, taskEvents, plannerSettings, semesterSubjects,
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
      const [settings]=await tx.select().from(plannerSettings).where(eq(plannerSettings.id,1)).for("share");
      if (input.action === "createTask") {
        const [membership] = await tx
          .select()
          .from(groupMembers)
          .where(
            and(
              eq(groupMembers.userId, user.id),
              eq(groupMembers.subjectId, input.data.subjectId),eq(groupMembers.semesterId,settings.currentSemesterId),
            ),
          )
          .for("update");
        if (input.data.scope === "group" && !membership)
          throw new Error("Join a group for this subject first.");
        
        const [allowedSubject]=await tx.select().from(semesterSubjects).where(and(eq(semesterSubjects.semesterId,settings.currentSemesterId),eq(semesterSubjects.subjectId,input.data.subjectId)));
        if(!allowedSubject) throw Error("Choose a subject in the current semester.");
        const {subtasks:checklist,...taskData}=input.data;
        const [created]=await tx
          .insert(tasks)
          .values({
            ...taskData,
            semesterId:settings.currentSemesterId,
            dueAt: new Date(input.data.dueAt),
            createdBy: user.id,
            groupId: input.data.scope === "group" ? membership.groupId : null,
          }).returning({id:tasks.id});
        if(checklist?.length) await tx.insert(subtasks).values(checklist.map((item,position)=>({taskId:created.id,title:item.title,position})));
        const [subject]=await tx.select({name:subjects.name}).from(subjects).where(eq(subjects.id,input.data.subjectId));
        notice={title:input.data.title,body:[subject.name,input.data.scope,input.data.priority+" priority",user.displayName].join(" · "),dueAt:new Date(input.data.dueAt).toISOString(),url:"/",personalId:input.data.scope==="personal"?user.id:undefined,groupId:input.data.scope==="group"?membership.groupId:undefined};
        return;
      }
      if (
        ["editTask", "deleteTask", "restoreTask", "complete", "completeSubtask"].includes(input.action) &&
        "id" in input &&
        input.id
      ) {
        const [task] = await tx
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, input.id), visible(user)))
          .for("update");
        if (!task) throw new Error("Task not found.");
        if(task.deletedAt && input.action!=="restoreTask") throw Error("Task is archived.");
        if (input.action === "complete" || input.action === "completeSubtask") {
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
          if(input.action==="completeSubtask"){
            const [item]=await tx.select().from(subtasks).where(and(eq(subtasks.id,input.subtaskId),eq(subtasks.taskId,task.id)));
            if(!item) throw Error("Subtask not found.");
            if(input.done) await tx.insert(subtaskCompletions).values({subtaskId:item.id,slot,completedBy:user.id}).onConflictDoNothing();
            else await tx.delete(subtaskCompletions).where(and(eq(subtaskCompletions.subtaskId,item.id),eq(subtaskCompletions.slot,slot)));
            return;
          }
          const [previous]=await tx.select().from(taskCompletions).where(and(eq(taskCompletions.taskId,task.id),eq(taskCompletions.slot,slot)));
          if(Boolean(previous)!==input.done) await tx.insert(taskEvents).values({taskId:task.id,actorId:user.id,action:input.done?"completed":"reopened"});
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
          if (input.action === "deleteTask" || input.action==="restoreTask"){
            const deleting=input.action==="deleteTask";
            if(Boolean(task.deletedAt)!==deleting) {
              await tx.update(tasks).set({deletedAt:deleting?new Date():null,deletedBy:deleting?user.id:null,updatedAt:new Date()}).where(eq(tasks.id,task.id));
              await tx.insert(taskEvents).values({taskId:task.id,actorId:user.id,action:deleting?"deleted":"restored"});
            }
          }
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
                dueTimezone: input.data.dueTimezone ?? task.dueTimezone,
                updatedAt: new Date(),
              })
              .where(eq(tasks.id, task.id));
            if(input.data.subtasks){
              const existing=await tx.select().from(subtasks).where(eq(subtasks.taskId,task.id));
              const kept=input.data.subtasks.flatMap(item=>item.id?[item.id]:[]);
              if(new Set(kept).size!==kept.length || kept.some(id=>!existing.some(item=>item.id===id))) throw Error("Invalid checklist.");
              const removed=existing.filter(item=>!kept.includes(item.id)).map(item=>item.id);
              if(removed.length) await tx.delete(subtasks).where(inArray(subtasks.id,removed));
              for(const [position,item] of input.data.subtasks.entries()){
                if(item.id) await tx.update(subtasks).set({title:item.title,position}).where(eq(subtasks.id,item.id));
                else await tx.insert(subtasks).values({taskId:task.id,title:item.title,position});
              }
            }
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
        const [offered]=await tx.select().from(semesterSubjects).where(and(eq(semesterSubjects.semesterId,settings.currentSemesterId),eq(semesterSubjects.subjectId,input.subjectId)));
        if(!offered) throw Error("Choose a subject in the current semester.");
        if (input.id)
          await tx
            .update(groups)
            .set({ name: input.name })
            .where(
              and(
                eq(groups.id, input.id),
                eq(groups.subjectId, input.subjectId),eq(groups.semesterId,settings.currentSemesterId),
              ),
            );
        else
          await tx
            .insert(groups)
            .values({ name: input.name, subjectId: input.subjectId, semesterId:settings.currentSemesterId });
      }
      if (input.action === "deleteGroup")
        await tx.delete(groups).where(and(eq(groups.id,input.id),eq(groups.semesterId,settings.currentSemesterId)));
      if (input.action === "membership") {
        if (input.groupId) {
          const [group] = await tx
            .select()
            .from(groups)
            .where(
              and(
                eq(groups.id, input.groupId),
                eq(groups.subjectId, input.subjectId),eq(groups.semesterId,settings.currentSemesterId),
              ),
            )
            .for("update");
          if (!group) throw new Error("Group not found.");
          await tx
            .insert(groupMembers)
            .values({
              userId: input.userId,
              subjectId: input.subjectId,
              groupId: input.groupId,semesterId:settings.currentSemesterId,
            })
            .onConflictDoUpdate({
              target: [groupMembers.userId, groupMembers.subjectId,groupMembers.semesterId],
              set: { groupId: input.groupId },
            });
        } else
          await tx
            .delete(groupMembers)
            .where(
              and(
                eq(groupMembers.userId, input.userId),
                eq(groupMembers.subjectId, input.subjectId),eq(groupMembers.semesterId,settings.currentSemesterId),
              ),
            );
      }
    });
    if(notice) { const queuedNotice=notice; after(() => notify(queuedNotice)); }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
