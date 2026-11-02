"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
export function AuthForm({
  signup = false,
  joinCode = false,
}: {
  signup?: boolean;
  joinCode?: boolean;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <main className="auth-layout min-h-screen p-5 bg-background">
      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>
      <section className="auth-story hidden lg:flex">
        <Brand />
        <div className="relative z-10">
          <p className="eyebrow text-white/60 mb-5">{copy.ui.heroEyebrow}</p>
          <h1 className="text-6xl font-medium tracking-[-.06em] leading-[1.05]">
            Big deadlines.
            <br />
            Small steps.
          </h1>
          <p className="text-white/65 max-w-sm text-lg leading-relaxed mt-6">{copy.ui.heroCaption}</p>
          <div className="flex gap-2 mt-9">
            <span className="rounded-full border border-white/20 px-4 py-2 text-xs">
              Just you
            </span>
            <span className="rounded-full border border-white/20 px-4 py-2 text-xs">
              Your group
            </span>
            <span className="rounded-full border border-white/20 px-4 py-2 text-xs">
              The whole batch
            </span>
          </div>
        </div>
        <p className="relative z-10 text-sm text-white/50">{copy.ui.heroFooter}</p>
      </section>
      <div className="auth-form-wrap w-full max-w-md">
        <div className="lg:hidden mb-9 flex justify-center">
          <Brand />
        </div>
        <Card className="auth-card shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">
              {signup ? copy.ui.signupTitle : copy.ui.loginTitle}
            </CardTitle>
            <CardDescription>{copy.auth[signup ? 2 : 0]}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setPending(true);
                setError("");
                const data = Object.fromEntries(new FormData(e.currentTarget));
                try {
                  const res = await fetch("/api/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: signup ? "signup" : "login",
                      data,
                    }),
                  });
                  const body = await res.json();
                  if (!res.ok) throw new Error(body.error);
                  window.location.assign("/");
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Connection lost. Please retry.",
                  );
                  setPending(false);
                }
              }}
            >
              {signup && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Your name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    required
                    maxLength={80}
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  required
                  minLength={3}
                  maxLength={32}
                  pattern="[A-Za-z0-9_]+"
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="deadline_survivor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  maxLength={72}
                  autoComplete={signup ? "new-password" : "current-password"}
                />
              </div>
              {signup && joinCode && (
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Batch join code</Label>
                  <Input
                    id="joinCode"
                    name="joinCode"
                    required
                    maxLength={200}
                  />
                </div>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button className="w-full" disabled={pending}>
                {pending
                  ? copy.ui.waiting
                  : signup
                    ? copy.ui.signupAction
                    : copy.ui.loginAction}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {signup ? "Already part of the batch?" : "New to the batch?"}{" "}
                <Link
                  className="text-primary underline underline-offset-4"
                  href={signup ? "/login" : "/sign-up"}
                >
                  {signup ? "Log in" : "Sign up"}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-6">{copy.ui.authFooter}</p>
      </div>
    </main>
  );
}
