const colors=["purple","blue","amber","green","rose","teal","indigo","orange","cyan","pink","lime","slate"] as const;
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {eq,and} from "drizzle-orm";
import {z} from "zod";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {semesters,subjects,semesterSubjects,plannerSettings} from "@/lib/db/schema";
import {loadData} from "@/lib/data";
import {Planner} from "@/components/planner";
import {ActionForm} from "@/components/action-form";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
const schema=z.discriminatedUnion("action",[
  z.object({action:z.literal("create"),name:z.string().trim().min(1).max(80)}),
  z.object({action:z.literal("activate"),id:z.uuid()}),
  z.object({action:z.literal("subject"),semesterId:z.uuid(),name:z.string().trim().min(1).max(120),color:z.enum(colors)}),
]);
async function save(form:FormData){
  "use server";
  const user=await currentUser();
  if(user?.role!=="super_admin") return {error:"Admin access required."};
  const parsed=schema.safeParse(Object.fromEntries(form));
  if(!parsed.success) return {error:parsed.error.issues[0].message};
  const input=parsed.data;
  try{
    await db().transaction(async tx=>{
      if(input.action==="create") await tx.insert(semesters).values({name:input.name});
      if(input.action==="activate"){
        const [exists]=await tx.select().from(semesters).where(eq(semesters.id,input.id));
        if(!exists) throw Error("Semester not found.");
        await tx.update(plannerSettings).set({currentSemesterId:input.id}).where(eq(plannerSettings.id,1));
      }
      if(input.action==="subject"){
        const [semester]=await tx.select().from(semesters).where(eq(semesters.id,input.semesterId));
        if(!semester) throw Error("Semester not found.");
        const [subject]=await tx.insert(subjects).values({name:input.name,color:input.color}).onConflictDoUpdate({target:subjects.name,set:{name:input.name}}).returning();
        await tx.insert(semesterSubjects).values({semesterId:input.semesterId,subjectId:subject.id}).onConflictDoNothing();
      }
    });
  }catch{return {error:"Could not save. Semester names must be unique."};}
  revalidatePath("/","layout");
}
export default async function Settings(){
  const user=await currentUser();
  if(!user) redirect("/login");
  if(user.role!=="super_admin") redirect("/");
  const [data,terms,links]=await Promise.all([loadData(user,true),db().select().from(semesters).orderBy(semesters.createdAt),db().select().from(semesterSubjects)]);
  return <Planner admin data={JSON.parse(JSON.stringify(data))}><div className="space-y-6"><h1 className="text-3xl font-semibold">Semester settings</h1><p className="text-muted-foreground">Current semester: {data.semester.name}. Switching updates the batch dashboard. Each semester has its own groups. After activating a new semester, create its groups and assign members in Admin. Earlier tasks stay in History.</p><section className="log-panel"><h2 className="text-xl font-semibold">Create a semester</h2><ActionForm action={save} label="Create semester"><input type="hidden" name="action" value="create"/><label>Name<Input required name="name" placeholder="Semester 2" maxLength={80}/></label></ActionForm></section>
  {terms.map(term=><section className="log-panel" key={term.id}><h2 className="text-xl font-semibold">{term.name}{term.id===data.semester.id&&<Badge>Current</Badge>}</h2><div className="flex flex-wrap gap-2">{links.filter(link=>link.semesterId===term.id).map(link=>{const subject=data.subjects.find(s=>s.id===link.subjectId)!;return <Badge className={"subject-"+subject.color} key={link.subjectId}>{subject.name}</Badge>;})}</div>
  {term.id!==data.semester.id&&<ActionForm action={save} label="Make current semester"><input type="hidden" name="action" value="activate"/><input type="hidden" name="id" value={term.id}/><p className="text-sm">This changes the semester for everyone immediately.</p></ActionForm>}
  <ActionForm action={save} label="Add subject"><input type="hidden" name="action" value="subject"/><input type="hidden" name="semesterId" value={term.id}/><label>Subject name<Input name="name" required maxLength={120}/></label><label>Badge color<select name="color" className="block rounded-md border bg-background p-2">{colors.map(color=><option key={color}>{color}</option>)}</select></label></ActionForm></section>)}</div></Planner>;
}
