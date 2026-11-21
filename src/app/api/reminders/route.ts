import {NextRequest,NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {z} from "zod";
import {failure} from "@/lib/http";
import {sendDueReminders} from "@/lib/reminders";
export const maxDuration=60;
export async function GET(req:NextRequest){
  const secret=process.env.CRON_SECRET;
  const supplied=Buffer.from(req.headers.get("authorization")||"");
  const expected=Buffer.from("Bearer "+secret);
  if(!secret || supplied.length!==expected.length || !timingSafeEqual(supplied,expected)) return new Response(null,{status:401});
  try{z.object({}).strict().parse(Object.fromEntries(req.nextUrl.searchParams));return NextResponse.json(await sendDueReminders());}catch(error){return failure(error);}
}
