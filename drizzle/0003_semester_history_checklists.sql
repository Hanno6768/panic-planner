CREATE TABLE "planner_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"current_semester_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_deliveries" (
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminder_deliveries_task_id_user_id_due_at_pk" PRIMARY KEY("task_id","user_id","due_at")
);
--> statement-breakpoint
CREATE TABLE "semester_subjects" (
	"semester_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	CONSTRAINT "semester_subjects_semester_id_subject_id_pk" PRIMARY KEY("semester_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "semesters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "semesters_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "subtask_completions" (
	"subtask_id" uuid NOT NULL,
	"slot" text NOT NULL,
	"completed_by" uuid,
	CONSTRAINT "subtask_completions_subtask_id_slot_pk" PRIMARY KEY("subtask_id","slot")
);
--> statement-breakpoint
CREATE TABLE "subtasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "due_timezone" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "semester_id" uuid;--> statement-breakpoint
ALTER TABLE "planner_settings" ADD CONSTRAINT "planner_settings_current_semester_id_semesters_id_fk" FOREIGN KEY ("current_semester_id") REFERENCES "public"."semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_subjects" ADD CONSTRAINT "semester_subjects_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_subjects" ADD CONSTRAINT "semester_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtask_completions" ADD CONSTRAINT "subtask_completions_subtask_id_subtasks_id_fk" FOREIGN KEY ("subtask_id") REFERENCES "public"."subtasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtask_completions" ADD CONSTRAINT "subtask_completions_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_events" ADD CONSTRAINT "task_events_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_events" ADD CONSTRAINT "task_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subtasks_task" ON "subtasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_events_task" ON "task_events" USING btree ("task_id","created_at");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO semesters (id,name) VALUES ('00000000-0000-4000-8000-000000000001','Semester 1') ON CONFLICT DO NOTHING;
INSERT INTO planner_settings (id,current_semester_id) VALUES (1,'00000000-0000-4000-8000-000000000001') ON CONFLICT DO NOTHING;
INSERT INTO semester_subjects (semester_id,subject_id) SELECT '00000000-0000-4000-8000-000000000001',id FROM subjects ON CONFLICT DO NOTHING;
UPDATE tasks SET semester_id='00000000-0000-4000-8000-000000000001' WHERE semester_id IS NULL;
INSERT INTO task_events (task_id,actor_id,action,created_at) SELECT task_id,completed_by,'completed',completed_at FROM task_completions;
