CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('student', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."scope" AS ENUM('personal', 'group', 'batch');--> statement-breakpoint
CREATE TABLE "auth_attempts" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_user_id_subject_id_pk" PRIMARY KEY("user_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_subject_pair" UNIQUE("id","subject_id"),
	CONSTRAINT "group_subject_name" UNIQUE("subject_id","name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "task_completions" (
	"task_id" uuid NOT NULL,
	"slot" text NOT NULL,
	"completed_by" uuid,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_completions_task_id_slot_pk" PRIMARY KEY("task_id","slot")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"subject_id" uuid NOT NULL,
	"scope" "scope" NOT NULL,
	"group_id" uuid,
	"due_at" timestamp with time zone NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_group_scope" CHECK (("tasks"."scope" = 'group' AND "tasks"."group_id" IS NOT NULL) OR ("tasks"."scope" <> 'group' AND "tasks"."group_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'student' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "username_lowercase" CHECK ("users"."username" = lower("users"."username"))
);
--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_subject_id_groups_id_subject_id_fk" FOREIGN KEY ("group_id","subject_id") REFERENCES "public"."groups"("id","subject_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_group_id_subject_id_groups_id_subject_id_fk" FOREIGN KEY ("group_id","subject_id") REFERENCES "public"."groups"("id","subject_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "members_group" ON "group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expiry" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "completions_user" ON "task_completions" USING btree ("completed_by");--> statement-breakpoint
CREATE INDEX "tasks_due" ON "tasks" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "tasks_creator" ON "tasks" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "tasks_group" ON "tasks" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "tasks_scope" ON "tasks" USING btree ("scope");--> statement-breakpoint
CREATE UNIQUE INDEX "one_super_admin" ON "users" USING btree ("role") WHERE "users"."role" = 'super_admin';