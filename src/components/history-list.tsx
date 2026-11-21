"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import type {AppData} from "@/lib/data";
import {mutate,FilterSelect} from "./planner";
import {Button} from "./ui/button";
import {Badge} from "./ui/badge";
import {Deadline} from "./deadline";
import {toast} from "sonner";
export function HistoryList({data,events,terms}:{data:AppData;events:{taskId:string;action:string;name:string|null;createdAt:string;actorId:string|null}[];terms:{id:string;name:string}[]}){
  const [filter,setFilter]=useState("all");
  const [term,setTerm]=useState("all");
  const [pending,start]=useTransition();
  const router=useRouter();
  const tasks=data.tasks.filter(task=>(filter==="all" || (filter==="deleted"?!!task.deletedAt:task.done))&&(term==="all" || task.semesterId===term));
  return <div className="space-y-5"><h1 className="text-3xl font-semibold">Task history</h1><p className="text-muted-foreground">Review completed work, archived tasks and earlier semesters.</p><div className="flex flex-wrap gap-3"><FilterSelect label="History status" value={filter} onChange={setFilter} options={[{value:"all",label:"All recorded tasks"},{value:"done",label:"Completed"},{value:"deleted",label:"Deleted"}]}/><FilterSelect label="History semester" value={term} onChange={setTerm} options={[{value:"all",label:"All semesters"},...terms.map(term=>({value:term.id,label:term.name}))]}/></div>
  {!tasks.length&&<p className="log-panel">No tasks match these filters.</p>}
  {tasks.map(task=><article className="log-panel" key={task.id}><div className="flex justify-between gap-3"><h2 className="text-lg font-semibold">{task.title}</h2><Badge variant="secondary">{task.deletedAt?"Deleted":task.done?"Done":"To do"}</Badge></div><p className="text-sm text-muted-foreground">{data.subjects.find(s=>s.id===task.subjectId)?.name} · {terms.find(term=>term.id===task.semesterId)?.name} · {task.scope}</p><Deadline dueAt={task.dueAt}/>{task.description&&<p className="whitespace-pre-wrap break-words text-sm">{task.description}</p>}<ul className="space-y-2 text-sm">{events.filter(event=>event.taskId===task.id).map((event,index)=><li key={index}>{event.name||"Deleted user"} · {event.action} · {new Date(event.createdAt).toLocaleString()}</li>)}</ul>{task.deletedAt&&(task.createdBy===data.user.id||data.user.role==="super_admin")&&<Button disabled={pending} variant="outline" onClick={()=>start(async()=>{try{await mutate({action:"restoreTask",id:task.id});router.refresh();toast.success("Task restored");}catch(error){toast.error(error instanceof Error?error.message:"Please retry.");}})}>Restore task</Button>}</article>)}</div>;
}
