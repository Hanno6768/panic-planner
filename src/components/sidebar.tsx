"use client";
import { copy } from "@/lib/copy";
import Link from "next/link";
import {
  BookOpen,
  Check,
  LayoutDashboard,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { AppData } from "@/lib/data";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
export function Sidebar({
  data,
  admin,
  scope,
  onScope,
  collapsed,
}: {
  data: AppData;
  admin: boolean;
  scope: string;
  collapsed: boolean;
  onScope: (value: string) => void;
}) {
  return (
    <aside
      className={`planner-sidebar hidden lg:flex ${collapsed ? "is-collapsed" : ""}`}
    >
      <Brand />
      <div className="sidebar-scroll">
        <div className="sidebar-person">
          <Avatar className="size-12">
            <AvatarFallback className="bg-[#d7e9c7] text-[#283425]">
              {data.user.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="sidebar-label">
            <p className="font-semibold truncate max-w-36">
              {data.user.displayName}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{copy.ui.sidebarHint}</p>
          </div>
        </div>
        <p className="sidebar-label eyebrow mb-3 px-3">Your workspace</p>
        <nav className="space-y-2">
          <Button
            className="w-full justify-start"
            variant={!admin && scope === "all" ? "secondary" : "ghost"}
            onClick={() => !admin && onScope("all")}
            asChild
          >
            <Link href="/" aria-label="Overview">
              <LayoutDashboard />
              <span className="sidebar-label">Overview</span>
            </Link>
          </Button>
          {!admin &&
            ["personal", "group", "batch"].map((s) => (
              <Button
                key={s}
                aria-label={
                  s === "personal"
                    ? "My Tasks"
                    : s === "group"
                      ? "My Groups"
                      : "Batch"
                }
                title={
                  s === "personal"
                    ? "My Tasks"
                    : s === "group"
                      ? "My Groups"
                      : "Batch"
                }
                className="w-full justify-start"
                variant={scope === s ? "secondary" : "ghost"}
                onClick={() => onScope(s)}
              >
                {s === "group" ? (
                  <Users />
                ) : s === "batch" ? (
                  <BookOpen />
                ) : (
                  <Check />
                )}
                <span className="sidebar-label">
                  {s === "personal"
                    ? "My Tasks"
                    : s === "group"
                      ? "My Groups"
                      : "Batch"}
                </span>
              </Button>
            ))}
          {data.user.role === "super_admin" && (
            <Button
              className="w-full justify-start"
              variant={admin ? "secondary" : "ghost"}
              asChild
            >
              <Link href="/admin" aria-label="Admin">
                <Shield />
                <span className="sidebar-label">Admin</span>
              </Link>
            </Button>
          )}
        </nav>
        <div className="sidebar-label mt-9">
          <p className="eyebrow mb-4 px-3">This semester</p>
          {data.subjects.map((s) => (
            <div className="flex items-start gap-2.5 px-3 py-2.5" key={s.id}>
              <span
                className={`subject-${s.color} mt-1 size-2 rounded-sm shrink-0`}
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Button
        aria-label="Log out"
        title="Log out"
        variant="ghost"
        className="sidebar-logout mt-auto justify-start shrink-0"
        onClick={async () => {
          try {
            const r = await fetch("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "logout" }),
            });
            if (!r.ok) throw new Error();
            window.location.assign("/login");
          } catch {
            toast.error("Could not log out. Please retry.");
          }
        }}
      >
        <LogOut />
        <span className="sidebar-label">Log out</span>
      </Button>
    </aside>
  );
}
