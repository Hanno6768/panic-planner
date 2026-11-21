"use client";
import {useEffect,useState} from "react";
import {deadlineLabel} from "@/lib/timezone";
export function Deadline({dueAt,zone}:{dueAt:Date|string;zone:string|null}){
  const [local,setLocal]=useState<string>();
  useEffect(()=>setLocal(Intl.DateTimeFormat().resolvedOptions().timeZone),[]);
  const reference=zone || "UTC";
  return <span className="block text-xs leading-relaxed"><span className="block font-medium">{deadlineLabel(dueAt,reference)}{!zone?" (original zone unavailable)":""}</span>{local && local!==reference && <span className="block text-muted-foreground">Your time · {deadlineLabel(dueAt,local)}</span>}</span>;
}
