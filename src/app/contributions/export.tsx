"use client";
import {Button} from "@/components/ui/button";
export function ExportRows({rows}:{rows:string[][]}){
  function download(){
    const lines=rows.map(([name,assignment,role,body])=>name+" — "+assignment+" ("+role+"): "+body);
    const url=URL.createObjectURL(new Blob([lines.join("\n\n")],{type:"text/plain;charset=utf-8"}));
    const a=document.createElement("a"); a.href=url; a.download="group-contributions.txt"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <Button variant="outline" disabled={!rows.length} onClick={download}>Export contributions</Button>;
}
