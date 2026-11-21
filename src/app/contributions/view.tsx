import {DeleteContribution} from "./delete-contribution";
import {after} from "next/server";
import {notify} from "@/lib/push";
import {Planner} from "@/components/planner";
import {loadData} from "@/lib/data";
import {BookOpen,Map,MessageSquare} from "lucide-react";
import Link from "next/link";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {and,eq,asc,sql} from "drizzle-orm";
import {z} from "zod";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {groups,groupMembers,groupNotes,subjects,plannerSettings,users} from "@/lib/db/schema";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {ActionForm} from "@/components/action-form";
import {ExportRows} from "./export";

async function workspaces(adminView=false){
  const user=await currentUser();
  if(!user) redirect("/login");
  const query=db().select({id:groups.id,name:groups.name,subject:subjects.name}).from(groups).innerJoin(plannerSettings,eq(groups.semesterId,plannerSettings.currentSemesterId)).innerJoin(subjects,eq(subjects.id,groups.subjectId));
  if(adminView && user.role!=="super_admin") redirect("/");
  const list=adminView ? await query.orderBy(groups.name) : await query.innerJoin(groupMembers,eq(groupMembers.groupId,groups.id)).where(eq(groupMembers.userId,user.id)).orderBy(groups.name);
  return {user,list};
}
async function removeContribution(value:string){
  "use server";
  const id=z.uuid().parse(value);
  const {user,list}=await workspaces();
  const [entry]=await db().select().from(groupNotes).where(and(eq(groupNotes.id,id),eq(groupNotes.authorId,user.id),eq(groupNotes.kind,"work")));
  if(!entry || !list.some(group=>group.id===entry.groupId)) throw Error("Not allowed.");
  await db().delete(groupNotes).where(and(eq(groupNotes.id,id),eq(groupNotes.authorId,user.id)));
  revalidatePath("/contributions");
  revalidatePath("/admin/contributions");
}
async function save(form:FormData){
  "use server";
  const {user,list}=await workspaces();
  const parsed=z.object({groupId:z.uuid(),id:z.uuid().optional(),kind:z.enum(["work","roadmap","comment"]),assignment:z.string().trim().max(160).default(""),role:z.string().trim().max(120).default(""),body:z.string().trim().min(1).max(8000)}).safeParse(Object.fromEntries(form));
  if(!parsed.success) return {error:parsed.error.issues[0].message};
  const data=parsed.data;
  if(!list.some(g=>g.id===data.groupId)) throw Error("Group access required.");
  if(data.kind==="work" && (!data.role || !data.assignment)) return {error:"Enter the assignment and role."};
  const {id,...values}=data;
  let saved=false;
  try{
    await db().transaction(async tx=>{
      // Serialize writes by author and group, including concurrent submissions.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${user.id+":"+data.groupId}))`);
      const existing=await tx.select().from(groupNotes).where(and(eq(groupNotes.groupId,data.groupId),eq(groupNotes.authorId,user.id),eq(groupNotes.kind,data.kind)));
      const normalize=(value:string)=>value.trim().replace(/\s+/g," ").toLocaleLowerCase();
      if(data.kind==="work" && existing.some(note=>note.id!==id && ["assignment","role","body"].every(field=>normalize(note[field as "assignment"|"role"|"body"])===normalize(values[field as "assignment"|"role"|"body"])))) return;
      if(id){
        if(!existing.some(note=>note.id===id)) throw Error("Not allowed.");
        await tx.update(groupNotes).set(values).where(and(eq(groupNotes.id,id),eq(groupNotes.authorId,user.id)));
      }else await tx.insert(groupNotes).values({...values,authorId:user.id});
      saved=true;
    });
  }catch{return {error:"Could not save this entry. Please retry."};}
  if(!saved) return {error:"You already recorded this contribution with the same assignment, role and work."};
  if(!id) {
    if(data.kind!=="comment"){
      const group=list.find(g=>g.id===data.groupId)!;
      after(() => notify({groupId:group.id,title:(data.kind==="work"?"New contribution":"Roadmap update")+" · "+group.name,body:[group.subject,user.displayName,data.assignment,data.role,data.body.slice(0,180)].filter(Boolean).join(" · "),url:"/contributions?group="+group.id}));
    }
  }
  revalidatePath("/contributions");
  revalidatePath("/admin/contributions");
}
export default async function Contributions({searchParams,adminView=false}:{searchParams:Promise<{group?:string}>,adminView?:boolean}){
  const {user,list}=await workspaces(adminView);
  const selected=(await searchParams).group;
  const group=list.find(g=>g.id===selected)??list[0];
  const rows=group?await db().select({note:groupNotes,name:users.displayName}).from(groupNotes).innerJoin(users,eq(users.id,groupNotes.authorId)).where(eq(groupNotes.groupId,group.id)).orderBy(asc(groupNotes.createdAt)): [];
  function editor(kind:"work"|"roadmap"|"comment",note?:typeof rows[number]["note"]){
    return <ActionForm action={save} className="grid gap-3 py-3">
      <input type="hidden" name="groupId" value={group.id}/><input type="hidden" name="kind" value={kind}/>{note&&<input type="hidden" name="id" value={note.id}/>}
      {kind==="work"&&<><label>Assignment<Input name="assignment" required maxLength={160} defaultValue={note?.assignment}/></label><label>Your role<Input name="role" required maxLength={120} defaultValue={note?.role}/></label></>}
      <label>{kind==="work"?"What you contributed":kind==="roadmap"?"Dates and next steps":"Comment"}<textarea className="block w-full mt-1 rounded-md border bg-background p-3" name="body" required maxLength={8000} defaultValue={note?.body}/></label>
    </ActionForm>;
  }
  const canWrite=await db().select().from(groupMembers).where(and(eq(groupMembers.userId,user.id),eq(groupMembers.groupId,group?.id || "00000000-0000-4000-8000-000000000000")));
  const work=rows.filter(r=>r.note.kind==="work");
  return <Planner admin={adminView} data={JSON.parse(JSON.stringify(await loadData(user)))}><div className="space-y-5"><header><p className="eyebrow">Group workspace</p><h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Contributions</h1></header>
    {!group?<p>Your subject groups will appear here once your admin adds you.</p>:<><nav className="flex flex-wrap gap-2">{list.map(g=><Button key={g.id} asChild variant={g.id===group.id?"default":"outline"} className="max-w-full whitespace-normal h-auto"><Link href={(adminView?"/admin/contributions":"/contributions")+"?group="+g.id}>{g.name} · {g.subject}</Link></Button>)}</nav>
    <section className="log-panel"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold"><BookOpen className="log-icon"/> {group.name}</h2><ExportRows rows={work.map(({name,note})=>[name,note.assignment,note.role,note.body])}/></div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Member","Assignment","Role","Contribution"].map(h=><th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{work.map(({note,name})=><tr key={note.id} className="border-t align-top"><td data-label="Member" className="p-2 font-semibold">{name}</td><td data-label="Assignment" className="p-2">{note.assignment}</td><td data-label="Role" className="p-2"><span className="log-role">{note.role}</span></td><td data-label="Contribution" className="p-2 whitespace-pre-wrap break-words">{note.body}{note.authorId===user.id&&<details><summary>Edit entry</summary>{editor("work",note)}<DeleteContribution id={note.id} remove={removeContribution}/></details>}</td></tr>)}</tbody></table></div>{!work.length&&<p>No contributions recorded yet.</p>}{canWrite.length>0&&<details><summary>Add my contribution</summary>{editor("work")}</details>}</section>
    <div className="grid gap-5 xl:grid-cols-2">{(["roadmap","comment"] as const).map(kind=><section key={kind} className={"log-panel "+kind}><h2 className="text-xl font-semibold">{kind==="roadmap"?<Map className="log-icon"/>:<MessageSquare className="log-icon"/>}{kind==="roadmap"?"Group roadmap":"Group comments"}</h2>{rows.filter(r=>r.note.kind===kind).map(({name,note})=><article key={note.id} className="border-b pb-2"><strong>{name}</strong><p className="whitespace-pre-wrap break-words">{note.body}</p>{note.authorId===user.id&&<details><summary>Edit</summary>{editor(kind,note)}</details>}</article>)}{canWrite.length>0&&<details><summary>{kind==="roadmap"?"Add roadmap update":"Add comment"}</summary>{editor(kind)}</details>}</section>)}</div></>}</div></Planner>;
}
