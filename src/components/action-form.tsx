"use client";
import {useState,useTransition} from "react";
import {Button} from "./ui/button";
import {toast} from "sonner";
export function ActionForm({action,children,label="Save",className=""}:{action:(data:FormData)=>Promise<{error?:string}|void>;children:React.ReactNode;label?:string;className?:string}){
  const [pending,start]=useTransition();
  const [error,setError]=useState("");
  return <form className={"space-y-3 "+className} onSubmit={event=>{
    event.preventDefault();const form=event.currentTarget;const data=new FormData(form);setError("");
    start(async()=>{try{const result=await action(data);if(result?.error){setError(result.error);return;}toast.success("Saved");}catch{setError("Could not save. Please retry.");}});
  }}><fieldset disabled={pending} className="space-y-3">{children}</fieldset>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={pending} type="submit">{pending?"Saving…":label}</Button></form>;
}
