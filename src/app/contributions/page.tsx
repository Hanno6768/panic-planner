import {notify} from "@/lib/push";
import {Planner} from "@/components/planner";
import {loadData} from "@/lib/data";
import {BookOpen,Map,MessageSquare} from "lucide-react";
import Link from "next/link";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {and,eq,asc} from "drizzle-orm";
import {z} from "zod";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {groups,groupMembers,groupNotes,subjects,users} from "@/lib/db/schema";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {ExportRows} from "./export";

async function workspaces(){
  const user=await currentUser();
  if(!user) redirect("/login");
  const query=db().select({id:groups.id,name:groups.name,subject:subjects.name}).from(groups).innerJoin(subjects,eq(subjects.id,groups.subjectId));
  const list=user.role==="super_admin" ? await query.orderBy(groups.name) : await query.innerJoin(groupMembers,eq(groupMembers.groupId,groups.id)).where(eq(groupMembers.userId,user.id)).orderBy(groups.name);
  return {user,list};
}
async function save(form:FormData){
  "use server";
  const {user,list}=await workspaces();
  const data=z.object({groupId:z.uuid(),id:z.uuid().optional(),kind:z.enum(["work","roadmap","comment"]),assignment:z.string().trim().max(160).default(""),role:z.string().trim().max(120).default(""),body:z.string().trim().min(1).max(8000)}).parse(Object.fromEntries(form));
  if(!list.some(g=>g.id===data.groupId)) throw Error("Group access required.");
  if(data.kind==="work" && (!data.role || !data.assignment)) throw Error("Enter the assignment and role.");
  const {id,...values}=data;
  if(id) await db().update(groupNotes).set(values).where(and(eq(groupNotes.id,id),eq(groupNotes.groupId,data.groupId),eq(groupNotes.authorId,user.id),eq(groupNotes.kind,data.kind)));
  else {
    await db().insert(groupNotes).values({...values,authorId:user.id});
    if(data.kind!=="comment"){
      const group=list.find(g=>g.id===data.groupId)!;
      await notify({groupId:group.id,title:(data.kind==="work"?"New contribution":"Roadmap update")+" · "+group.name,body:[group.subject,user.displayName,data.assignment,data.role,data.body.slice(0,180)].filter(Boolean).join(" · "),url:"/contributions?group="+group.id});
    }
  }
  revalidatePath("/contributions");
}
export default async function Contributions({searchParams}:{searchParams:Promise<{group?:string}>}){
  const {user,list}=await workspaces();
  const selected=(await searchParams).group;
  const group=list.find(g=>g.id===selected)??list[0];
  const rows=group?await db().select({note:groupNotes,name:users.displayName}).from(groupNotes).innerJoin(users,eq(users.id,groupNotes.authorId)).where(eq(groupNotes.groupId,group.id)).orderBy(asc(groupNotes.createdAt)): [];
  function editor(kind:"work"|"roadmap"|"comment",note?:typeof rows[number]["note"]){
    return <form action={save} className="grid gap-3 py-3">
      <input type="hidden" name="groupId" value={group.id}/><input type="hidden" name="kind" value={kind}/>{note&&<input type="hidden" name="id" value={note.id}/>}
      {kind==="work"&&<><label>Assignment<Input name="assignment" required maxLength={160} defaultValue={note?.assignment}/></label><label>Your role<Input name="role" required maxLength={120} defaultValue={note?.role}/></label></>}
      <label>{kind==="work"?"What you contributed":kind==="roadmap"?"Dates and next steps":"Comment"}<textarea className="block w-full mt-1 rounded-md border bg-background p-3" name="body" required maxLength={8000} defaultValue={note?.body}/></label><Button className="justify-self-start">Save</Button>
    </form>;
  }
  const work=rows.filter(r=>r.note.kind==="work");
  return <Planner data={JSON.parse(JSON.stringify(await loadData(user)))}><div className="space-y-5"><header><p className="eyebrow">Group workspace</p><h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Contributions</h1></header>
    {!group?<p>Your subject groups will appear here once your admin adds you.</p>:<><nav className="flex flex-wrap gap-2">{list.map(g=><Button key={g.id} asChild variant={g.id===group.id?"default":"outline"} className="max-w-full whitespace-normal h-auto"><Link href={"/contributions?group="+g.id}>{g.name} · {g.subject}</Link></Button>)}</nav>
    <section className="log-panel"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold"><BookOpen className="log-icon"/> {group.name}</h2><ExportRows rows={work.map(({name,note})=>[name,note.assignment,note.role,note.body])}/></div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Member","Assignment","Role","Contribution"].map(h=><th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{work.map(({note,name})=><tr key={note.id} className="border-t align-top"><td data-label="Member" className="p-2 font-semibold">{name}</td><td data-label="Assignment" className="p-2">{note.assignment}</td><td data-label="Role" className="p-2"><span className="log-role">{note.role}</span></td><td data-label="Contribution" className="p-2 whitespace-pre-wrap break-words">{note.body}{note.authorId===user.id&&<details><summary>Edit entry</summary>{editor("work",note)}</details>}</td></tr>)}</tbody></table></div>{!work.length&&<p>No contributions recorded yet.</p>}<details><summary>Add my contribution</summary>{editor("work")}</details></section>
    <div className="grid gap-5 xl:grid-cols-2">{(["roadmap","comment"] as const).map(kind=><section key={kind} className={"log-panel "+kind}><h2 className="text-xl font-semibold">{kind==="roadmap"?<Map className="log-icon"/>:<MessageSquare className="log-icon"/>}{kind==="roadmap"?"Group roadmap":"Group comments"}</h2>{rows.filter(r=>r.note.kind===kind).map(({name,note})=><article key={note.id} className="border-b pb-2"><strong>{name}</strong><p className="whitespace-pre-wrap break-words">{note.body}</p>{note.authorId===user.id&&<details><summary>Edit</summary>{editor(kind,note)}</details>}</article>)}<details><summary>{kind==="roadmap"?"Add roadmap update":"Add comment"}</summary>{editor(kind)}</details></section>)}</div></>}</div></Planner>;
}
