"use client";
import {useEffect,useState} from "react";
import {Bell,BellRing} from "lucide-react";
import {toast} from "sonner";
import {Button} from "./ui/button";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "./ui/alert-dialog";

const promptKey = "panic-notification-prompt-seen";
export function PushToggle(){
  const [key,setKey]=useState("");
  const [active,setActive]=useState(false);
  const [busy,setBusy]=useState(false);
  const [showPrompt,setShowPrompt]=useState(false);
  useEffect(()=>{
    let mounted=true;
    if(!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    async function load(){
      const response=await fetch("/api/push");
      if(!response.ok) return;
      const config=await response.json();
      setKey(config.key || "");
      const registration=await navigator.serviceWorker.register("/planner-sw.js");
      const subscription=await registration.pushManager.getSubscription();
      if(!mounted) return;
      const enabled=Boolean(subscription && subscription.endpoint===config.endpoint);
      setActive(enabled);
      if(config.key && !enabled && Notification.permission!=="denied" && !localStorage.getItem(promptKey)){
        localStorage.setItem(promptKey,"1");
        setShowPrompt(true);
      }
    }
    load().catch(()=>{});
    return ()=>{mounted=false;};
  },[]);
  async function toggle(){
    if(!key){toast.info("Push is unavailable here. On iPhone, open the planner from your Home Screen.");return;}
    setBusy(true);
    try{
      if(!active && await Notification.requestPermission()!=="granted") throw Error("Allow notifications in your browser settings to enable alerts.");
      const registration=await navigator.serviceWorker.ready;
      const subscription=await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
      const response=await fetch("/api/push",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(active?{endpoint:subscription.endpoint}:subscription.toJSON())});
      if(!response.ok) throw Error("Could not save this device. Try again.");
      if(active) await subscription.unsubscribe();
      setActive(!active);toast.success(active?"Notifications off":"Device notifications enabled");
    }catch(error){toast.error(error instanceof Error?error.message:"Could not update notifications");}
    finally{setBusy(false);}
  }
  const label=active?"Turn off device notifications":"Enable device notifications";
  return <><Button size="icon" variant="ghost" disabled={busy} aria-label={label} title={label} aria-pressed={active} onClick={toggle}>{active?<BellRing/>:<Bell/>}</Button>
    <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Get notified when a task is added?</AlertDialogTitle>
          <AlertDialogDescription>Receive alerts on this device for new tasks that apply to you, plus roadmap updates and contributions from your groups. You can change this later using the bell.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={toggle}>Enable notifications</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
