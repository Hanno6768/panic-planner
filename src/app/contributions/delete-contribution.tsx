"use client";
import {useTransition} from "react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {AlertDialog,AlertDialogTrigger,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from "@/components/ui/alert-dialog";
export function DeleteContribution({id,remove}:{id:string;remove:(id:string)=>Promise<void>}){
  const [pending,startTransition]=useTransition();
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" disabled={pending}>{pending?"Deleting…":"Delete my contribution"}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete your contribution?</AlertDialogTitle><AlertDialogDescription>This removes the entry from your group’s contribution record.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>startTransition(async()=>{try{await remove(id);toast.success("Contribution deleted");}catch{toast.error("Could not delete the contribution.");}})}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
