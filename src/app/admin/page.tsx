import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { loadData } from "@/lib/data";
import { Planner } from "@/components/planner";
export const dynamic = "force-dynamic";
export default async function Admin() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/");
  return (
    <Planner
      admin
      data={JSON.parse(JSON.stringify(await loadData(user, true)))}
    />
  );
}
