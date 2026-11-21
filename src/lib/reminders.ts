import "server-only";
import {and,eq,gt,lte,isNull,sql} from "drizzle-orm";
import {db} from "./db";
import {tasks,subjects,users,pushDevices,sessions,taskCompletions,reminderDeliveries} from "./db/schema";
import {visible} from "./permissions";
import {notify} from "./push";
export async function sendDueReminders(){
  const now=new Date(),until=new Date(now.getTime()+24*3600000);
  const recipients=await db().selectDistinct({id:users.id}).from(users).innerJoin(sessions,eq(sessions.userId,users.id)).innerJoin(pushDevices,eq(pushDevices.sessionHash,sessions.tokenHash)).where(gt(sessions.expiresAt,now));
  let eligible=0,sent=0,failed=0;
  for(const user of recipients){
    // Apply normal student scope even for admins: reminders concern their own work.
    const upcoming=await db().select({task:tasks,subject:subjects.name}).from(tasks).innerJoin(subjects,eq(subjects.id,tasks.subjectId)).where(and(visible({id:user.id,role:"student"}),isNull(tasks.deletedAt),gt(tasks.dueAt,now),lte(tasks.dueAt,until),sql`not exists(select 1 from ${taskCompletions} where ${taskCompletions.taskId}=${tasks.id} and ${taskCompletions.slot}=case when ${tasks.scope}='batch' then ${user.id} else 'shared' end)`));
    for(const {task,subject} of upcoming){
      eligible++;
      const claim={taskId:task.id,userId:user.id,dueAt:task.dueAt};
      const inserted=await db().insert(reminderDeliveries).values(claim).onConflictDoNothing().returning();
      if(!inserted.length) continue;
      const result=await notify({personalId:user.id,title:"Due soon · "+task.title,body:subject+" · "+task.priority+" priority · "+task.scope,dueAt:task.dueAt.toISOString(),url:"/"});
      sent+=result.sent;failed+=result.failed;
      if(result.sent===0) await db().delete(reminderDeliveries).where(and(eq(reminderDeliveries.taskId,task.id),eq(reminderDeliveries.userId,user.id),eq(reminderDeliveries.dueAt,task.dueAt)));
    }
  }
  return {eligible,sent,failed};
}
