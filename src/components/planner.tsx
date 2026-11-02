"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { format, formatDistanceToNow, isSameDay, endOfWeek } from "date-fns";
import {
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  ListTodo,
  LogOut,
  ArrowUpRight,
  Check,
  Clock3,
  Flame,
  MoreHorizontal,
  LayoutDashboard,
  Shield,
  Users,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import type { AppData } from "@/lib/data";
import { copy, pick } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TaskEditor } from "./task-editor";
import { AdminPanel } from "./admin-panel";
import { Brand } from "./brand";
import { Sidebar } from "./sidebar";
export type Task = AppData["tasks"][number];
export async function mutate(input: unknown) {
  const res = await fetch("/api/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error);
}
export function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: { value: string; label: string; disabled?: boolean }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className="w-full min-w-0 max-w-full sm:w-auto sm:min-w-36 sm:max-w-64 bg-card [&_[data-slot=select-value]]:truncate"
      >
        <SelectValue placeholder={label}>
          {options.find((o) => o.value === value)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function Planner({
  data,
  admin = false,
}: {
  data: AppData;
  admin?: boolean;
}) {
  const router = useRouter();
  const [mobilePane, setMobilePane] = useState<"overview" | "tasks">("tasks");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => {
      setPageSize(media.matches ? 3 : 5);
      setPage(1);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem("panic-sidebar") === "collapsed");
    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "overview") setMobilePane("overview");
    if (view === "groups") {
      setMobilePane("tasks");
      setScope("group");
    }
  }, []);
  const changeSidebar = () => {
    setSidebarCollapsed((v) => {
      localStorage.setItem("panic-sidebar", v ? "open" : "collapsed");
      return !v;
    });
  };
  const [scope, setScope] = useState("all");
  const [subject, setSubject] = useState("all");
  const [status, setStatus] = useState("todo");
  const [editor, setEditor] = useState<Task | "new" | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState<Date | null>(null);
  const [greeting, setGreeting] = useState(copy.greetings[0]);
  useEffect(() => {
    setNow(new Date());
    setGreeting(pick(copy.greetings));
    const timer = setInterval(() => setNow(new Date()), 60_000);
    const renew = () => {
      fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "renew" }),
      })
        .then((r) => {
          if (r.status === 401) window.location.assign("/login");
        })
        .catch(() => {});
    };
    renew();
    const heartbeat = setInterval(renew, 3600_000);
    return () => {
      clearInterval(timer);
      clearInterval(heartbeat);
    };
  }, []);
  useEffect(() => {
    setOverrides({});
  }, [data]);
  const tasks = data.tasks.map((t) => ({
    ...t,
    done: overrides[t.id] ?? t.done,
  }));
  useEffect(() => {
    setPage(1);
  }, [scope, subject, status]);
  const done = tasks.filter((t) => t.done).length;
  const overdue = (t: Task) => !t.done && !!now && new Date(t.dueAt) < now;
  const stats = [
    {
      label: "Overdue",
      value: tasks.filter(overdue).length,
      icon: Flame,
      tone: "text-rose-700 dark:text-rose-300",
      hint: copy.ui.overdueHint,
    },
    {
      label: "Due today",
      value: tasks.filter(
        (t) => !t.done && now && isSameDay(new Date(t.dueAt), now),
      ).length,
      icon: Clock3,
      tone: "text-amber-700 dark:text-amber-300",
      hint: copy.ui.todayHint,
    },
    {
      label: "This week",
      value: tasks.filter(
        (t) =>
          !t.done &&
          now &&
          new Date(t.dueAt) >= now &&
          new Date(t.dueAt) <= endOfWeek(now, { weekStartsOn: 1 }),
      ).length,
      icon: BookOpen,
      tone: "text-indigo-700 dark:text-indigo-300",
      hint: copy.ui.weekHint,
    },
    {
      label: "Done & dusted",
      value: done,
      icon: Check,
      tone: "text-emerald-700 dark:text-emerald-300",
      hint: copy.ui.doneHint,
    },
  ];
  const filtered = tasks.filter(
    (t) =>
      (scope === "all" || t.scope === scope) &&
      (subject === "all" || t.subjectId === subject) &&
      (status === "all" ||
        (status === "done" && t.done) ||
        (status === "todo" && !t.done) ||
        (status === "overdue" && overdue(t))),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pageTasks = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  async function toggle(task: Task) {
    if (busy.has(task.id)) return;
    setBusy((prev) => new Set(prev).add(task.id));
    setOverrides((prev) => ({ ...prev, [task.id]: !task.done }));
    try {
      await mutate({ action: "complete", id: task.id, done: !task.done });
      toast.success(
        task.done ? copy.ui.undone : pick(copy.complete),
      );
      startTransition(() => router.refresh());
    } catch (error) {
      setOverrides((prev) => ({ ...prev, [task.id]: task.done }));
      toast.error(error instanceof Error ? error.message : "Please retry.");
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  }
  return (
    <div
      className={`planner-shell min-h-screen pb-24 md:pb-8 ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}
    >
      <Sidebar
        data={data}
        admin={admin}
        scope={scope}
        collapsed={sidebarCollapsed}
        onScope={(s) => {
          setScope(s);
          setMobilePane("tasks");
        }}
      />
      <header className="planner-topbar">
        <div className="max-w-6xl mx-auto h-20 px-5 md:px-8 flex items-center justify-between gap-4">
          <div className="lg:hidden">
            <Brand />
          </div>
          <span className="hidden lg:flex items-center gap-3 text-sm font-medium">
            <Button
              variant="ghost"
              size="icon"
              onClick={changeSidebar}
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              aria-expanded={!sidebarCollapsed}
            >
              {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
            {admin ? "Batch control" : "Your daily plan"}
            <span className="text-muted-foreground font-normal ml-3">
              {now ? format(now, "EEEE, MMMM d") : ""}
            </span>
          </span>
          <nav className="hidden md:flex lg:hidden gap-2">
            <Button variant={!admin ? "secondary" : "ghost"} asChild>
              <Link href="/">
                <LayoutDashboard className="size-4" />
                My Panic
              </Link>
            </Button>
            {data.user.role === "super_admin" && (
              <Button variant={admin ? "secondary" : "ghost"} asChild>
                <Link href="/admin">
                  <Shield className="size-4" />
                  Admin
                </Link>
              </Button>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-1" aria-label="User menu">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {data.user.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline max-w-32 truncate">
                    {data.user.displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
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
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="planner-main max-w-6xl mx-auto px-5 md:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <div>
            <p className="eyebrow">
              {admin
                ? copy.ui.adminEyebrow
                : copy.ui.dashboardEyebrow}
            </p>
            <h1 className="text-3xl md:text-[2.6rem] font-semibold tracking-[-.045em] mt-3 leading-tight">
              {admin ? (
                "Batch control."
              ) : (
                <>
                  Hey, {data.user.displayName.split(" ")[0]}{" "}
                  <span className="greeting-spark" aria-hidden="true">
                    ✳
                  </span>
                </>
              )}
            </h1>
            <p className="text-muted-foreground mt-3">
              {admin
                ? copy.ui.adminIntro
                : greeting}
            </p>
          </div>
          <Button size="lg" onClick={() => setEditor("new")}>
            <Plus className="size-4" />
            Add task
          </Button>
        </div>
        {admin ? (
          <AdminPanel data={data} onEdit={setEditor} onDelete={setDeleting} />
        ) : (
          <>
            <section
              aria-label="Panic meter"
              className={mobilePane === "overview" ? "" : "hidden md:block"}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm">Your panic meter</h2>
                <Badge variant="outline" className="bg-card">
                  ●{" "}
                  {stats[0].value
                    ? copy.levels[3]
                    : stats[1].value
                      ? copy.levels[1]
                      : copy.levels[0]}
                </Badge>
              </div>
              <div className="panic-stats grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
                {stats.map((s) => (
                  <Card key={s.label} className="shadow-none">
                    <CardContent className="p-5">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        {s.label}
                        <s.icon className={`size-4 ${s.tone}`} />
                      </div>
                      <p className="text-4xl font-semibold tracking-tight my-3">
                        {s.value.toString().padStart(2, "0")}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.hint}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="rounded-xl border bg-primary/5 p-5 my-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="shrink-0">
                  <p className="text-sm font-medium">{copy.ui.progressHeading}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {done} of {tasks.length} tasks complete. Keep your own pace.
                  </p>
                </div>
                <Progress
                  aria-label="Completed tasks"
                  value={tasks.length ? (done / tasks.length) * 100 : 0}
                  className="sm:ml-auto sm:max-w-72 h-2"
                />
                <span className="font-semibold text-sm">
                  {tasks.length ? Math.round((done / tasks.length) * 100) : 0}%
                </span>
              </div>
            </section>
            <section
              className={`task-section mt-4 md:mt-8 ${mobilePane === "tasks" ? "" : "hidden md:block"}`}
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold">
                  The to-do situation{" "}
                  <span className="text-muted-foreground text-sm font-normal ml-2">
                    {filtered.length}
                  </span>
                </h2>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Closest deadlines first ↓
                </span>
              </div>
              <div className="flex flex-col xl:flex-row gap-3 justify-between mb-5">
                <Tabs value={scope} onValueChange={setScope}>
                  <TabsList className="w-full sm:w-auto">
                    {["all", "personal", "group", "batch"].map((s) => (
                      <TabsTrigger
                        className="capitalize flex-1"
                        key={s}
                        value={s}
                        aria-controls="task-results"
                      >
                        {
                          {
                            all: "All",
                            personal: "My Tasks",
                            group: "My Groups",
                            batch: "Batch",
                          }[s]
                        }
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="grid grid-cols-2 sm:flex gap-2 min-w-0">
                  <FilterSelect
                    label="Subject"
                    value={subject}
                    onChange={setSubject}
                    options={[
                      { value: "all", label: "All subjects" },
                      ...data.subjects.map((s) => ({
                        value: s.id,
                        label: s.name,
                      })),
                    ]}
                  />
                  <FilterSelect
                    label="Status"
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: "todo", label: "To do" },
                      { value: "done", label: "Done" },
                      { value: "overdue", label: "Overdue" },
                      { value: "all", label: "All statuses" },
                    ]}
                  />
                </div>
              </div>
              {scope !== "all" && (
                <div className="rounded-xl bg-primary/5 border p-4 mb-4">
                  <h3 className="font-medium">
                    {scope === "personal"
                      ? "Just for you."
                      : scope === "group"
                        ? "Your groups. One shared plan."
                        : "The whole batch, your own progress."}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {scope === "personal"
                      ? "Only you and the batch admin can see these tasks."
                      : scope === "group"
                        ? "Check a task off once and it’s done for everyone in that group."
                        : "Everyone sees these deadlines. Checking one off only marks it done for you."}
                  </p>
                  {scope === "group" && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {data.groups.map((g) => (
                        <Badge variant="outline" key={g.id}>
                          {g.name} ·{" "}
                          {
                            data.subjects.find((s) => s.id === g.subjectId)
                              ?.name
                          }
                        </Badge>
                      ))}
                      {!data.groups.length && (
                        <p className="text-xs">{copy.group[0]}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div
                id="task-results"
                role="tabpanel"
                aria-label={`${scope} tasks`}
                tabIndex={0}
                className="space-y-3"
              >
                {filtered.length === 0 && (
                  <Card className="shadow-none border-dashed">
                    <CardContent className="text-center py-14">
                      <span className="text-4xl text-primary">✳</span>
                      <h3 className="font-medium mt-4">{copy.empty[0]}</h3>
                      <p className="text-muted-foreground text-sm mt-2 mb-5">
                        Try a different filter, or give your next deadline a
                        home.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setEditor("new")}
                      >
                        <Plus />
                        Add a task
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {pageTasks.map((task) => {
                  const sub = data.subjects.find(
                    (s) => s.id === task.subjectId,
                  );
                  const days = now
                    ? (new Date(task.dueAt).getTime() - now.getTime()) /
                      86400_000
                    : 10;
                  const level = task.done
                    ? 4
                    : days < 0
                      ? 3
                      : days < 1
                        ? 2
                        : days < 3
                          ? 1
                          : 0;
                  return (
                    <Card
                      key={task.id}
                      className={`task-card shadow-none ${task.done ? "opacity-70" : ""}`}
                    >
                      <CardContent className="p-5 flex gap-4">
                        <Checkbox
                          aria-label={`Mark ${task.title} ${task.done ? "undone" : "done"}`}
                          checked={task.done}
                          disabled={busy.has(task.id) || pending}
                          onCheckedChange={() => toggle(task)}
                          className="mt-2 size-5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge
                              variant="secondary"
                              className={`subject-${sub?.color} whitespace-normal text-left break-words max-w-full`}
                            >
                              {sub?.name}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="capitalize font-normal"
                            >
                              {task.scope === "group" && (
                                <Users className="size-3" />
                              )}
                              {task.scope === "group"
                                ? (data.groups.find(
                                    (g) => g.id === task.groupId,
                                  )?.name ?? "Group")
                                : task.scope}
                            </Badge>
                            {task.priority === "high" && (
                              <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                                ↑ High priority
                              </span>
                            )}
                          </div>
                          <h3
                            className={`font-semibold text-base break-words [overflow-wrap:anywhere] ${task.done ? "line-through" : ""}`}
                          >
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 break-words">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs text-muted-foreground">
                            <span
                              className={
                                level === 3
                                  ? "text-rose-700 dark:text-rose-300"
                                  : ""
                              }
                            >
                              <Clock3 className="inline size-3 mr-1" />
                              {now
                                ? `${format(new Date(task.dueAt), "MMM d, h:mm a")} · ${formatDistanceToNow(new Date(task.dueAt), { addSuffix: true })}`
                                : "Loading local time…"}
                            </span>
                            <span className="capitalize">
                              {task.priority} priority
                            </span>
                            {task.scope === "batch" && (
                              <span>
                                {task.doneCount} of {task.studentCount} students
                                done
                              </span>
                            )}
                            {task.scope === "group" && task.done && (
                              <span>
                                Done by {task.completedBy}
                                {task.completedAt && now
                                  ? ` · ${format(new Date(task.completedAt), "MMM d, h:mm a")}`
                                  : ""}
                              </span>
                            )}
                          </div>
                          {level === 3 && (
                            <p className="text-xs mt-2 text-muted-foreground">
                              {copy.overdue[0]}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end justify-between gap-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Actions for ${task.title}`}
                              >
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem disabled>
                                {task.creator}
                              </DropdownMenuItem>
                              {(task.createdBy === data.user.id ||
                                data.user.role === "super_admin") && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => setEditor(task)}
                                  >
                                    Edit task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeleting(task)}
                                  >
                                    Delete task
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <span
                            className={`text-[10px] whitespace-nowrap font-medium ${level > 1 && level < 4 ? "text-rose-700 dark:text-rose-300" : "text-primary"}`}
                          >
                            ●{" "}
                            <span className="hidden sm:inline">
                              {copy.levels[level]}
                            </span>
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {pages > 1 && (
                <div className="flex items-center justify-between gap-3 mt-5">
                  <span className="text-xs text-muted-foreground">
                    Page {currentPage} of {pages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === pages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </section>
            <Separator className="mt-10" />
            <p className="text-xs text-muted-foreground text-center mt-6">
              Made for your batch. Powered by small victories.{" "}
              <ArrowUpRight className="inline size-3" />
            </p>
          </>
        )}
      </main>
      <nav
        aria-label="Mobile sections"
        className="mobile-sections md:hidden fixed bottom-0 inset-x-0 z-20 border-t bg-card p-2 flex justify-around gap-1"
      >
        <Button
          className="mobile-section-button"
          variant={!admin && mobilePane === "overview" ? "secondary" : "ghost"}
          onClick={() => {
            if (admin) router.push("/?view=overview");
            else setMobilePane("overview");
          }}
        >
          <LayoutDashboard />
          <span>Overview</span>
        </Button>
        <Button
          className="mobile-section-button"
          variant={
            !admin && mobilePane === "tasks" && scope !== "group"
              ? "secondary"
              : "ghost"
          }
          onClick={() => {
            if (admin) router.push("/");
            else {
              setMobilePane("tasks");
              setScope("all");
            }
          }}
        >
          <ListTodo />
          <span>Tasks</span>
        </Button>
        <Button
          className="mobile-section-button"
          variant={
            !admin && mobilePane === "tasks" && scope === "group"
              ? "secondary"
              : "ghost"
          }
          onClick={() => {
            if (admin) router.push("/?view=groups");
            else {
              setMobilePane("tasks");
              setScope("group");
            }
          }}
        >
          <Users />
          <span>My Groups</span>
        </Button>
        {data.user.role === "super_admin" && (
          <Button
            className="mobile-section-button"
            variant={admin ? "secondary" : "ghost"}
            asChild
          >
            <Link href="/admin">
              <Shield />
              <span>Admin</span>
            </Link>
          </Button>
        )}
      </nav>
      {editor && (
        <TaskEditor
          data={data}
          task={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” and its completion records will be permanently
              deleted for everyone who can see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                if (!deleting) return;
                startTransition(async () => {
                  try {
                    await mutate({ action: "deleteTask", id: deleting.id });
                    setDeleting(null);
                    router.refresh();
                    toast.success("Task deleted.");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Please retry.",
                    );
                  }
                });
              }}
            >
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
