import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {eq,and} from "drizzle-orm";
import {currentUser,COOKIE,digest} from "@/lib/auth";
import {db} from "@/lib/db";
import {pushDevices} from "@/lib/db/schema";
import {failure,sameOrigin} from "@/lib/http";
import {applicationKey} from "@/lib/push";
const endpoint=z.url().max(2048).refine(value=>{
  const u=new URL(value);
  return u.protocol==="https:" && !u.username && !u.password && !u.port && /^(fcm\.googleapis\.com|([a-z0-9-]+\.)*push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)$/.test(u.hostname);
},"Unsupported push provider.");
export async function GET(req:NextRequest){
  if(!await currentUser()) return new Response(null,{status:401});
  const [device]=await db().select({endpoint:pushDevices.endpoint}).from(pushDevices).where(eq(pushDevices.sessionHash,digest(req.cookies.get(COOKIE)!.value)));
  return NextResponse.json({key:applicationKey(),endpoint:device?.endpoint},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(req:NextRequest){
  try{
    sameOrigin(req);
    if(!await currentUser()) throw Error("Please log in.");
    const sessionHash=digest(req.cookies.get(COOKIE)!.value);
    const input=z.object({endpoint,keys:z.object({auth:z.string().regex(/^[\w-]{22}$/),p256dh:z.string().regex(/^[\w-]{87}$/)}).optional()}).parse(await req.json());
    if(input.keys) await db().insert(pushDevices).values({endpoint:input.endpoint,sessionHash,...input.keys}).onConflictDoUpdate({target:pushDevices.endpoint,set:{sessionHash,...input.keys}});
    else await db().delete(pushDevices).where(and(eq(pushDevices.endpoint,input.endpoint),eq(pushDevices.sessionHash,sessionHash)));
    return NextResponse.json({ok:true});
  }catch(error){return failure(error);}
}
