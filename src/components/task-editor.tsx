"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {wallTime,utcFromWall} from "@/lib/timezone";
import {Plus,Trash2} from "lucide-react";
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
  const browserZone=Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [zone,setZone]=useState(task?.dueTimezone || browserZone);
  const [checklist,setChecklist]=useState<{id?:string;title:string}[]>(task?.subtasks.map(item=>({id:item.id,title:item.title})) || []);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      subjectId: task?.subjectId ?? data.currentSubjectIds[0] ?? "",
      scope: task?.scope ?? "personal",
      priority: task?.priority ?? "medium",
      dueAt: task ? wallTime(task.dueAt,zone) : "",
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
                    dueAt: utcFromWall(values.dueAt,zone),
                    dueTimezone:zone,
                    subtasks:checklist,
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
                      options={data.subjects.filter(s=>task || data.currentSubjectIds.includes(s.id)).map((s) => ({
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
            <div className="space-y-2"><label className="text-sm font-medium">Deadline timezone</label><FilterSelect label="Deadline timezone" value={zone} onChange={setZone} options={[...new Set([zone,browserZone,"Africa/Cairo","Asia/Riyadh","Asia/Kuwait","Asia/Kuala_Lumpur","UTC"])].map(value=>({value,label:value}))}/><p className="text-xs text-muted-foreground">Enter the assignment deadline in this timezone. Everyone sees this reference time alongside their own local time.</p></div>
            <fieldset className="space-y-3"><legend className="text-sm font-medium mb-2">Checklist (optional)</legend>{checklist.map((item,index)=><div className="flex gap-2" key={item.id || index}><Input aria-label={"Subtask "+(index+1)} value={item.title} maxLength={180} onChange={event=>setChecklist(checklist.map((row,i)=>i===index?{...row,title:event.target.value}:row))}/><Button type="button" size="icon" variant="ghost" aria-label={"Remove subtask "+(index+1)} onClick={()=>setChecklist(checklist.filter((_,i)=>i!==index))}><Trash2/></Button></div>)}<Button type="button" variant="outline" disabled={checklist.length>=30} onClick={()=>setChecklist([...checklist,{title:""}])}><Plus/>Add subtask</Button></fieldset>
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
