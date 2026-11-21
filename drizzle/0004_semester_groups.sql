ALTER TABLE "groups" DROP CONSTRAINT "group_subject_name";--> statement-breakpoint
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_user_id_subject_id_pk";--> statement-breakpoint
ALTER TABLE "group_members" ADD COLUMN "semester_id" uuid DEFAULT '00000000-0000-4000-8000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "semester_id" uuid DEFAULT '00000000-0000-4000-8000-000000000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_subject_id_semester_id_pk" PRIMARY KEY("user_id","subject_id","semester_id");--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "group_subject_name" UNIQUE("semester_id","subject_id","name");
