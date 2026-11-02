"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import type { AppData } from "@/lib/data";
import { copy } from "@/lib/copy";
import { mutate, FilterSelect, type Task } from "./planner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
const schema = z.object({
  title: z.string().trim().min(1, "Give this task a title.").max(160),
  description: z.string().max(4000),
  subjectId: z.uuid(),
  scope: z.enum(["personal", "group", "batch"]),
  dueAt: z
    .string()
    .min(1, "Choose a deadline.")
    .refine(
      (v) => !Number.isNaN(new Date(v).getTime()),
      "Choose a valid date.",
    ),
  priority: z.enum(["low", "medium", "high"]),
});
export function TaskEditor({
  data,
  task,
  onClose,
}: {
  data: AppData;
  task?: Task;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      subjectId: task?.subjectId ?? data.subjects[0]?.id ?? "",
      scope: task?.scope ?? "personal",
      priority: task?.priority ?? "medium",
      dueAt: task ? format(new Date(task.dueAt), "yyyy-MM-dd'T'HH:mm") : "",
    },
  });
  const group = data.memberships.find(
    (m) => m.userId === data.user.id && m.subjectId === form.watch("subjectId"),
  );
  return (
    <Dialog
      open
      onOpenChange={(open) =>
        !open && !form.formState.isSubmitting && onClose()
      }
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {task ? copy.ui.editTitle : copy.ui.newTaskTitle}
          </DialogTitle>
          <DialogDescription>{copy.ui.taskIntro}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              setError("");
              try {
                await mutate({
                  action: task ? "editTask" : "createTask",
                  ...(task ? { id: task.id } : {}),
                  data: {
                    ...values,
                    dueAt: new Date(values.dueAt).toISOString(),
                  },
                });
                toast.success(copy.saved);
                router.refresh();
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Please retry.");
              }
            })}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={160}
                      placeholder={copy.ui.taskTitlePlaceholder}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      maxLength={4000}
                      placeholder={copy.ui.descriptionPlaceholder}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <fieldset
              disabled={!!task}
              className="space-y-4 disabled:opacity-70"
            >
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FilterSelect
                      label="Subject"
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        form.setValue("scope", "personal");
                      }}
                      options={data.subjects.map((s) => ({
                        value: s.id,
                        label: s.name,
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who is this for?</FormLabel>
                    <FilterSelect
                      label="Task scope"
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "personal", label: "Just me" },
                        {
                          value: "group",
                          label: "My subject group",
                          disabled: !group && !task,
                        },
                        { value: "batch", label: "The whole batch" },
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>
            {!group && !task && (
              <p className="text-xs text-muted-foreground">{copy.group[0]}</p>
            )}
            {task && (
              <p className="text-xs text-muted-foreground">
                Subject and scope stay fixed to preserve privacy and progress.
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date & time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FilterSelect
                      label="Priority"
                      value={field.value}
                      onChange={field.onChange}
                      options={["low", "medium", "high"].map((v) => ({
                        value: v,
                        label: v[0].toUpperCase() + v.slice(1),
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Saving…"
                : task
                  ? "Save changes"
                  : "Add to the plan"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
