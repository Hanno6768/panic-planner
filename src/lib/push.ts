import "server-only";
import { sendNotification } from "web-push";
import { createECDH, createHash } from "node:crypto";
import { and,eq,gt,inArray } from "drizzle-orm";
import { db } from "./db";
import { pushDevices,sessions,groupMembers } from "./db/schema";

function keys(){
  const publicKey=process.env.VAPID_PUBLIC_KEY, privateKey=process.env.VAPID_PRIVATE_KEY;
  if(publicKey && privateKey) return {publicKey,privateKey};
  if(process.env.NODE_ENV==="development" && process.env.AUTH_SECRET){
    const key=createECDH("prime256v1");
    key.setPrivateKey(createHash("sha256").update("preview-push:"+process.env.AUTH_SECRET).digest());
    return {publicKey:key.getPublicKey().toString("base64url"),privateKey:key.getPrivateKey().toString("base64url")};
  }
}
export function applicationKey(){return keys()?.publicKey;}
export type Notice={title:string;body:string;url:string;dueAt?:string;groupId?:string;personalId?:string};
export async function notify({groupId,personalId,...message}:Notice){
  try {
    const vapid=keys();
    if(!vapid) return;
    const recipients=groupId ? inArray(sessions.userId,db().select({id:groupMembers.userId}).from(groupMembers).where(eq(groupMembers.groupId,groupId))) : personalId ? eq(sessions.userId,personalId) : undefined;
    const devices=await db().select({device:pushDevices}).from(pushDevices).innerJoin(sessions,eq(sessions.tokenHash,pushDevices.sessionHash)).where(and(gt(sessions.expiresAt,new Date()),recipients));
    await Promise.allSettled(devices.map(async ({device})=>{
      try{
        await sendNotification({endpoint:device.endpoint,keys:{auth:device.auth,p256dh:device.p256dh}},JSON.stringify(message),{TTL:3600,timeout:5000,vapidDetails:{...vapid,subject:process.env.VAPID_SUBJECT || "mailto:admin@example.com"}});
      }catch(error){
        if([404,410].includes((error as {statusCode:number}).statusCode)) await db().delete(pushDevices).where(eq(pushDevices.endpoint,device.endpoint));
      }
    }));
  }catch{console.error("Could not deliver planner notification");}
}
