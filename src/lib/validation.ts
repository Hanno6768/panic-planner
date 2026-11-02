import { z } from "zod";
export const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9_]+$/, "Use 3–32 letters, numbers or underscores.");
export const password = z
  .string()
  .min(6)
  .max(72)
  .refine(
    (v) => Buffer.byteLength(v, "utf8") <= 72,
    "Password must fit within 72 UTF-8 bytes.",
  );
export const credentials = z.object({ username, password });
export const registration = credentials.extend({
  displayName: z.string().trim().min(1).max(80),
  joinCode: z.string().max(200).optional(),
});
export const taskInput = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).default(""),
  subjectId: z.uuid(),
  scope: z.enum(["personal", "group", "batch"]),
  dueAt: z.iso.datetime({ offset: true }),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});
export const mutation = z.discriminatedUnion("action", [
  z.object({ action: z.literal("createTask"), data: taskInput }),
  z.object({ action: z.literal("editTask"), id: z.uuid(), data: taskInput }),
  z.object({ action: z.literal("deleteTask"), id: z.uuid() }),
  z.object({ action: z.literal("complete"), id: z.uuid(), done: z.boolean() }),
  z.object({
    action: z.literal("addUser"),
    data: registration.omit({ joinCode: true }),
  }),
  z.object({ action: z.literal("deleteUser"), id: z.uuid() }),
  z.object({ action: z.literal("resetPassword"), id: z.uuid(), password }),
  z.object({
    action: z.literal("saveGroup"),
    id: z.uuid().optional(),
    name: z.string().trim().min(1).max(80),
    subjectId: z.uuid(),
  }),
  z.object({ action: z.literal("deleteGroup"), id: z.uuid() }),
  z.object({
    action: z.literal("membership"),
    userId: z.uuid(),
    subjectId: z.uuid(),
    groupId: z.uuid().nullable(),
  }),
]);
