import { AuthForm } from "@/components/auth-form";
export const dynamic = "force-dynamic";
export default function Signup() {
  return <AuthForm signup joinCode={!!process.env.BATCH_JOIN_CODE} />;
}
