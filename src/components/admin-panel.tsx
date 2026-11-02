"use client";
import { copy } from "@/lib/copy";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, KeyRound } from "lucide-react";
import type { AppData } from "@/lib/data";
import { mutate, FilterSelect, type Task } from "./planner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
type Modal =
  | { kind: "user" }
  | { kind: "reset"; id: string; name: string }
  | { kind: "group"; id?: string; name?: string; subjectId: string };
export function AdminPanel({
  data,
  onEdit,
  onDelete,
}: {
  data: AppData;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState(data.subjects[0]?.id ?? "");
  const [taskSubject, setTaskSubject] = useState("all");
  const [taskScope, setTaskScope] = useState("all");
  const [modal, setModal] = useState<Modal | null>(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<{
    action: "deleteUser" | "deleteGroup";
    id: string;
    name: string;
  } | null>(null);
  function run(input: unknown, close?: () => void) {
    start(async () => {
      try {
        await mutate(input);
        router.refresh();
        close?.();
        toast.success(copy.ui.adminSaved);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Please retry.";
        setError(message);
        toast.error(message);
      }
    });
  }
  const participants = data.participants.filter((p) =>
    `${p.displayName} ${p.username}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <Tabs defaultValue="participants" onValueChange={() => setSearch("")}>
        <TabsList className="mb-6">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="participants">
          <div className="flex flex-col sm:flex-row gap-3 justify-between mb-5">
            <Input
              className="sm:max-w-xs"
              aria-label="Search participants"
              placeholder="Search name or username…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              onClick={() => {
                setError("");
                setModal({ kind: "user" });
              }}
            >
              <Plus />
              Add participant
            </Button>
          </div>
          <Card className="py-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / username</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">
                        {p.displayName}{" "}
                        {p.role === "super_admin" && (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{p.username}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-60 whitespace-normal text-xs">
                      {data.memberships
                        .filter((m) => m.userId === p.id)
                        .map(
                          (m) =>
                            `${data.subjects.find((s) => s.id === m.subjectId)?.name}: ${data.groups.find((g) => g.id === m.groupId)?.name}`,
                        )
                        .join(" · ") || "No groups yet"}
                    </TableCell>
                    <TableCell>{String(p.createdAt).slice(0, 10)}</TableCell>
                    <TableCell>{p.completed}</TableCell>
                    <TableCell>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Reset password for ${p.displayName}`}
                          onClick={() => {
                            setError("");
                            setModal({
                              kind: "reset",
                              id: p.id,
                              name: p.displayName,
                            });
                          }}
                        >
                          <KeyRound className="size-4" />
                        </Button>
                        {p.role !== "super_admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${p.displayName}`}
                            onClick={() =>
                              setConfirm({
                                action: "deleteUser",
                                id: p.id,
                                name: p.displayName,
                              })
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!participants.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      No participants match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
          <p className="text-xs text-muted-foreground mt-3">
            Completed counts current completion records attributed to each
            person, including shared group checkmarks. Joined dates are UTC.
          </p>
        </TabsContent>
        <TabsContent value="groups">
          <div className="flex flex-col sm:flex-row gap-3 justify-between mb-5">
            <FilterSelect
              label="Group subject"
              value={subject}
              onChange={setSubject}
              options={data.subjects.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
            />
            <Button
              onClick={() => {
                setError("");
                setModal({ kind: "group", subjectId: subject });
              }}
            >
              <Plus />
              Create group
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {data.groups
              .filter((g) => g.subjectId === subject)
              .map((g) => (
                <Card key={g.id}>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{g.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {
                          data.memberships.filter((m) => m.groupId === g.id)
                            .length
                        }{" "}
                        members
                      </p>
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Rename ${g.name}`}
                        onClick={() => {
                          setError("");
                          setModal({
                            kind: "group",
                            id: g.id,
                            name: g.name,
                            subjectId: subject,
                          });
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${g.name}`}
                        onClick={() =>
                          setConfirm({
                            action: "deleteGroup",
                            id: g.id,
                            name: g.name,
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          <h3 className="font-semibold mb-2">Assign your academic squads</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose a group beside each person. Choosing another group moves
            them; “No group” removes them.
          </p>
          <Input
            aria-label="Search group members"
            className="sm:max-w-xs mb-4"
            placeholder="Find a student…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Card>
            <CardContent className="space-y-4">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-medium">{p.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      @{p.username}
                    </p>
                  </div>
                  <fieldset disabled={pending}>
                    <FilterSelect
                      label={`Group for ${p.displayName}`}
                      value={
                        data.memberships.find(
                          (m) => m.userId === p.id && m.subjectId === subject,
                        )?.groupId ?? "none"
                      }
                      onChange={(g) =>
                        run({
                          action: "membership",
                          userId: p.id,
                          subjectId: subject,
                          groupId: g === "none" ? null : g,
                        })
                      }
                      options={[
                        { value: "none", label: "No group" },
                        ...data.groups
                          .filter((g) => g.subjectId === subject)
                          .map((g) => ({ value: g.id, label: g.name })),
                      ]}
                    />
                  </fieldset>
                </div>
              ))}
              {!participants.length && (
                <p className="text-muted-foreground text-sm">
                  No matching students.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tasks">
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              className="sm:max-w-xs"
              aria-label="Search tasks"
              value={search}
              placeholder="Search every task…"
              onChange={(e) => setSearch(e.target.value)}
            />
            <FilterSelect
              label="Filter task subject"
              value={taskSubject}
              onChange={setTaskSubject}
              options={[
                { value: "all", label: "All subjects" },
                ...data.subjects.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <FilterSelect
              label="Filter task scope"
              value={taskScope}
              onChange={setTaskScope}
              options={["all", "personal", "group", "batch"].map((s) => ({
                value: s,
                label: s === "all" ? "All scopes" : s,
              }))}
            />
          </div>
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Due (local)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tasks
                  .filter(
                    (t) =>
                      t.title.toLowerCase().includes(search.toLowerCase()) &&
                      (taskSubject === "all" || t.subjectId === taskSubject) &&
                      (taskScope === "all" || t.scope === taskScope),
                  )
                  .map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="max-w-72 whitespace-normal">
                        <p className="font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {
                            data.subjects.find((s) => s.id === t.subjectId)
                              ?.name
                          }
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.scope}</Badge>
                      </TableCell>
                      <TableCell>{t.creator}</TableCell>
                      <TableCell>
                        <LocalDate value={t.dueAt} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${t.title}`}
                          onClick={() => onEdit(t)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${t.title}`}
                          onClick={() => onDelete(t)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {!data.tasks.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">{copy.ui.adminEmpty}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog
        open={!!modal}
        onOpenChange={(open) => !open && !pending && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modal?.kind === "user"
                ? copy.ui.participantHeading
                : modal?.kind === "reset"
                  ? `Reset password: ${modal.name}`
                  : modal?.id
                    ? "Rename group"
                    : copy.ui.groupHeading}
            </DialogTitle>
            <DialogDescription>
              {modal?.kind === "reset"
                ? "This logs them out on every device. Share the new password privately."
                : modal?.kind === "user"
                  ? "Share the username and temporary password privately with the student."
                  : "Groups belong to one subject. Membership is managed below."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const values = Object.fromEntries(new FormData(e.currentTarget));
              if (!modal) return;
              if (modal.kind === "user")
                run({ action: "addUser", data: values }, () => setModal(null));
              else if (modal.kind === "reset")
                run(
                  {
                    action: "resetPassword",
                    id: modal.id,
                    password: values.password,
                  },
                  () => setModal(null),
                );
              else
                run(
                  {
                    action: "saveGroup",
                    id: modal.id,
                    subjectId: modal.subjectId,
                    name: values.name,
                  },
                  () => setModal(null),
                );
            }}
          >
            {modal?.kind === "user" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newName">Display name</Label>
                  <Input
                    id="newName"
                    name="displayName"
                    required
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUsername">Username</Label>
                  <Input
                    id="newUsername"
                    name="username"
                    required
                    minLength={3}
                    maxLength={32}
                    pattern="[A-Za-z0-9_]+"
                  />
                </div>
              </>
            )}
            {(modal?.kind === "user" || modal?.kind === "reset") && (
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  {modal.kind === "user"
                    ? "Temporary password"
                    : "New password"}
                </Label>
                <Input
                  id="newPassword"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={72}
                  required
                />
              </div>
            )}
            {modal?.kind === "group" && (
              <div className="space-y-2">
                <Label htmlFor="groupName">Group name</Label>
                <Input
                  key={modal.id ?? "new"}
                  id="groupName"
                  name="name"
                  defaultValue={modal.name}
                  required
                  maxLength={80}
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <Button disabled={pending} type="submit" className="w-full">
              {pending ? "Saving…" : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => !open && !pending && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirm?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "deleteGroup"
                ? "This permanently deletes the group, its memberships, all its shared tasks and their completion records."
                : "This permanently deletes the account and sessions. Authored tasks stay and show “Deleted user”. Their private tasks remain visible only to the admin. Individual batch progress is removed; shared task progress is kept."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                if (confirm)
                  run({ action: confirm.action, id: confirm.id }, () =>
                    setConfirm(null),
                  );
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
import { useEffect } from "react";
function LocalDate({ value }: { value: Date }) {
  const [label, setLabel] = useState("…");
  useEffect(() => setLabel(new Date(value).toLocaleString()), [value]);
  return <span>{label}</span>;
}
