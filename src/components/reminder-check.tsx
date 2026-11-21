"use client";
import {useState} from "react";
import {Button} from "./ui/button";
export function ReminderCheck(){
  const [busy,setBusy]=useState(false),[result,setResult]=useState("");
  return <section className="log-panel"><h2 className="text-xl font-semibold">Deadline reminders</h2><p className="text-sm text-muted-foreground">A daily check notifies subscribed devices about unfinished tasks due in the next 24 hours. Completed and deleted tasks are excluded. Each person receives one reminder per task deadline.</p><Button disabled={busy} onClick={async()=>{
    setBusy(true);setResult("");
    try{const response=await fetch("/api/reminders",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});const data=await response.json();if(!response.ok) throw Error(data.error);setResult(data.eligible+" eligible task/user pairs · "+data.sent+" device notifications sent · "+data.failed+" failed. Already-sent reminders are skipped.");}catch{setResult("Reminder check failed. Please retry.");}finally{setBusy(false);}
  }}>{busy?"Checking deadlines…":"Check reminders now"}</Button><p role="status" className="text-sm">{result}</p></section>;
}
