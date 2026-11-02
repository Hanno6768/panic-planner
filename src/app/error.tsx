"use client";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen grid place-content-center gap-5 p-8 text-center">
      <h1 className="text-2xl font-semibold">{copy.ui.errorTitle}</h1>
      <p>We couldn’t load your planner. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
      <a href="/login" className="underline">
        Back to login
      </a>
    </main>
  );
}
