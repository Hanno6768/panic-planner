export function wallTime(instant:Date|string,timeZone:string){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(instant));
  const get=(type:string)=>parts.find(part=>part.type===type)!.value;
  return get("year")+"-"+get("month")+"-"+get("day")+"T"+get("hour")+":"+get("minute");
}
export function utcFromWall(value:string,timeZone:string){
  const wall=new Date(value+"Z").getTime();
  if(!Number.isFinite(wall)) throw Error("Choose a valid deadline.");
  let candidate=wall;
  for(let i=0;i<4;i++){
    const displayed=new Date(wallTime(new Date(candidate),timeZone)+"Z").getTime();
    candidate+=wall-displayed;
  }
  if(wallTime(new Date(candidate),timeZone)!==value) throw Error("That clock time does not exist due to daylight saving. Choose another time.");
  return new Date(candidate).toISOString();
}
export function deadlineLabel(value:Date|string,timeZone:string){
  return new Intl.DateTimeFormat("en-GB",{timeZone,dateStyle:"medium",timeStyle:"short"}).format(new Date(value))+" · "+timeZone;
}
