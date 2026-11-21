"use client";
import {useState,useEffect} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {Checkbox} from "./ui/checkbox";
import {mutate,type Task} from "./planner";
export function TaskChecklist({task}:{task:Task}){
  const router=useRouter();
  const [items,setItems]=useState(task.subtasks);
  const [busy,setBusy]=useState(false);
  useEffect(()=>setItems(task.subtasks),[task.subtasks]);
  if(!items.length) return null;
  return <details className="mt-3 rounded-lg border p-3"><summary className="cursor-pointer text-sm font-medium">Checklist · {items.filter(item=>item.done).length}/{items.length}</summary><div className="space-y-3 pt-3">{items.map(item=><label key={item.id} className="flex gap-3 text-sm items-start"><Checkbox checked={item.done} disabled={busy} onCheckedChange={async checked=>{
    const previous=items;setBusy(true);setItems(items.map(row=>row.id===item.id?{...row,done:checked===true}:row));
    try{await mutate({action:"completeSubtask",id:task.id,subtaskId:item.id,done:checked===true});router.refresh();}catch(error){setItems(previous);toast.error(error instanceof Error?error.message:"Please retry.");}finally{setBusy(false);}
  }}/><span className={item.done?"line-through text-muted-foreground":""}>{item.title}</span></label>)}</div></details>;
}
