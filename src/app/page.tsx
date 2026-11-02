import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { loadData } from "@/lib/data";
import { Planner } from "@/components/planner";
export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <Planner data={JSON.parse(JSON.stringify(await loadData(user)))} />;
}
