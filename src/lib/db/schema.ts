import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  primaryKey,
  unique,
  uniqueIndex,
  index,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
export const role = pgEnum("role", ["student", "super_admin"]);
export const scope = pgEnum("scope", ["personal", "group", "batch"]);
export const priority = pgEnum("priority", ["low", "medium", "high"]);
const time = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });
export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey(),
    username: text().notNull().unique(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: role().notNull().default("student"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("one_super_admin")
      .on(t.role)
      .where(sql`${t.role} = 'super_admin'`),
    check("username_lowercase", sql`${t.username} = lower(${t.username})`),
  ],
);
export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: time("expires_at").notNull(),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("sessions_user").on(t.userId),
    index("sessions_expiry").on(t.expiresAt),
  ],
);
export const authAttempts = pgTable("auth_attempts", {
  key: text().primaryKey(),
  count: integer().notNull().default(0),
  expiresAt: time("expires_at").notNull(),
});
export const subjects = pgTable("subjects", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull().unique(),
  color: text().notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const groups = pgTable(
  "groups",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("group_subject_pair").on(t.id, t.subjectId),
    unique("group_subject_name").on(t.subjectId, t.name),
  ],
);
export const groupMembers = pgTable(
  "group_members",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: uuid("group_id").notNull(),
    subjectId: uuid("subject_id").notNull(),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.subjectId] }),
    foreignKey({
      columns: [t.groupId, t.subjectId],
      foreignColumns: [groups.id, groups.subjectId],
    }).onDelete("cascade"),
    index("members_group").on(t.groupId),
  ],
);
export const tasks = pgTable(
  "tasks",
  {
    id: uuid().defaultRandom().primaryKey(),
    title: text().notNull(),
    description: text().notNull().default(""),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    scope: scope().notNull(),
    groupId: uuid("group_id"),
    dueAt: time("due_at").notNull(),
    priority: priority().notNull().default("medium"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.groupId, t.subjectId],
      foreignColumns: [groups.id, groups.subjectId],
    }).onDelete("cascade"),
    check(
      "task_group_scope",
      sql`(${t.scope} = 'group' AND ${t.groupId} IS NOT NULL) OR (${t.scope} <> 'group' AND ${t.groupId} IS NULL)`,
    ),
    index("tasks_due").on(t.dueAt),
    index("tasks_creator").on(t.createdBy),
    index("tasks_group").on(t.groupId),
    index("tasks_scope").on(t.scope),
  ],
);
// A shared slot for personal/group tasks; a user UUID slot for batch tasks.
export const taskCompletions = pgTable(
  "task_completions",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    slot: text().notNull(),
    completedBy: uuid("completed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    completedAt: time("completed_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.slot] }),
    index("completions_user").on(t.completedBy),
  ],
);
