import {redirect} from "next/navigation";
import {and,eq,inArray,or,ne} from "drizzle-orm";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {taskEvents,tasks,users,semesters} from "@/lib/db/schema";
import {loadData} from "@/lib/data";
import {Planner} from "@/components/planner";
import {HistoryList} from "@/components/history-list";
export default async function History(){
  const user=await currentUser();if(!user) redirect("/login");
  const data=await loadData(user,false,true);
  const events=data.tasks.length?await db().select({taskId:taskEvents.taskId,actorId:taskEvents.actorId,action:taskEvents.action,name:users.displayName,createdAt:taskEvents.createdAt}).from(taskEvents).innerJoin(tasks,eq(tasks.id,taskEvents.taskId)).leftJoin(users,eq(users.id,taskEvents.actorId)).where(and(inArray(taskEvents.taskId,data.tasks.map(task=>task.id)),user.role==="super_admin"?undefined:or(ne(tasks.scope,"batch"),eq(taskEvents.actorId,user.id),inArray(taskEvents.action,["deleted","restored"])))).orderBy(taskEvents.createdAt):[];
  const terms=await db().select().from(semesters);
  return <Planner data={JSON.parse(JSON.stringify(data))}><HistoryList data={JSON.parse(JSON.stringify(data))} events={JSON.parse(JSON.stringify(events))} terms={terms}/></Planner>;
}
