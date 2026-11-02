# Panic Planner — clean deployment source

No demo accounts, task data, database dumps or real secrets are included. Binary logo files and the lockfile are in the project archive.

## .env.example

````
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
AUTH_SECRET=replace-with-at-least-32-random-characters
ADMIN_USERNAME=muhaned_muaz
ADMIN_PASSWORD=replace-with-a-long-unique-password
# Leave empty for open registration.
BATCH_JOIN_CODE=
````

## .gitignore

````
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*
!.env.example

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
/artifacts/
````

## AGENTS.md

````
<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
````

## BRAND.md

````
# Panic Planner identity

The supplied UI references informed the warm neutral canvas, generous rounded surfaces, charcoal controls, restrained pastel summaries and uncluttered navigation. Typography is self-hosted **Geist Variable**, installed through `@fontsource-variable/geist`; there are no runtime font requests to Google or another service.

The original logo was generated with the **built-in image-generation tool** (not the API/CLI fallback). It combines a planner, a checkmark/lightning shape and coral urgency marks. The transparent PNG is stored at `public/panic-planner-logo.png`; `src/app/icon.png` is the application icon. `src/components/brand.tsx` adds a real text wordmark for crisp typography and accessibility.

## Exact generation prompt

> Use case: logo-brand. Create an original production-ready app icon for Panic Planner, a friendly university deadline task tracker. Single compact geometric symbol: a rounded charcoal-black planner/checklist silhouette, with a bold warm-white checkmark inside that subtly also reads as a lightning bolt, and one tiny coral-orange urgency spark above its upper-right corner. Clever, calm, slightly playful; polished Swiss software identity, clean thick shapes, highly legible at 32 pixels. Flat vector-like raster design, crisp edges, no gradients, no shadows, no 3D, no texture. Centered square composition, mark fills 85 percent of canvas, transparent background with genuine alpha. No text, no letters, no wordmark, no mockup, no border, no presentation sheet. This logo will sit next to live Geist typography in a warm off-white app with rounded white cards, charcoal buttons and restrained pale lime and butter yellow accents.

## Component provenance

Official shadcn CLI, `new-york` style, Radix primitives:

```sh
npx shadcn@latest add button card input label form select tabs dialog alert-dialog dropdown-menu badge checkbox table sheet skeleton avatar separator sonner progress textarea --yes --overwrite
```

The installed component source is in `src/components/ui/`. App-specific composition, spacing, colors and responsive behavior live in the surrounding components and global theme. Light and dark themes share the same primitives.
````

## components.json

````
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
````

## drizzle/0000_next_machine_man.sql

````
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
````

## drizzle/meta/0000_snapshot.json

````
{
  "id": "38132ae6-a148-41be-8c36-255c82aee355",
  "prevId": "00000000-0000-0000-0000-000000000000",
  "version": "7",
  "dialect": "postgresql",
  "tables": {
    "public.auth_attempts": {
      "name": "auth_attempts",
      "schema": "",
      "columns": {
        "key": {
          "name": "key",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "count": {
          "name": "count",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        }
      },
      "indexes": {},
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.group_members": {
      "name": "group_members",
      "schema": "",
      "columns": {
        "user_id": {
          "name": "user_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "group_id": {
          "name": "group_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "subject_id": {
          "name": "subject_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "members_group": {
          "name": "members_group",
          "columns": [
            {
              "expression": "group_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "group_members_user_id_users_id_fk": {
          "name": "group_members_user_id_users_id_fk",
          "tableFrom": "group_members",
          "tableTo": "users",
          "columnsFrom": [
            "user_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "group_members_group_id_subject_id_groups_id_subject_id_fk": {
          "name": "group_members_group_id_subject_id_groups_id_subject_id_fk",
          "tableFrom": "group_members",
          "tableTo": "groups",
          "columnsFrom": [
            "group_id",
            "subject_id"
          ],
          "columnsTo": [
            "id",
            "subject_id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {
        "group_members_user_id_subject_id_pk": {
          "name": "group_members_user_id_subject_id_pk",
          "columns": [
            "user_id",
            "subject_id"
          ]
        }
      },
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.groups": {
      "name": "groups",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "subject_id": {
          "name": "subject_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "groups_subject_id_subjects_id_fk": {
          "name": "groups_subject_id_subjects_id_fk",
          "tableFrom": "groups",
          "tableTo": "subjects",
          "columnsFrom": [
            "subject_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "group_subject_pair": {
          "name": "group_subject_pair",
          "nullsNotDistinct": false,
          "columns": [
            "id",
            "subject_id"
          ]
        },
        "group_subject_name": {
          "name": "group_subject_name",
          "nullsNotDistinct": false,
          "columns": [
            "subject_id",
            "name"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.sessions": {
      "name": "sessions",
      "schema": "",
      "columns": {
        "token_hash": {
          "name": "token_hash",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "user_id": {
          "name": "user_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "sessions_user": {
          "name": "sessions_user",
          "columns": [
            {
              "expression": "user_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "sessions_expiry": {
          "name": "sessions_expiry",
          "columns": [
            {
              "expression": "expires_at",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "sessions_user_id_users_id_fk": {
          "name": "sessions_user_id_users_id_fk",
          "tableFrom": "sessions",
          "tableTo": "users",
          "columnsFrom": [
            "user_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.subjects": {
      "name": "subjects",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "color": {
          "name": "color",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "subjects_name_unique": {
          "name": "subjects_name_unique",
          "nullsNotDistinct": false,
          "columns": [
            "name"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.task_completions": {
      "name": "task_completions",
      "schema": "",
      "columns": {
        "task_id": {
          "name": "task_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "slot": {
          "name": "slot",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "completed_by": {
          "name": "completed_by",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "completed_at": {
          "name": "completed_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "completions_user": {
          "name": "completions_user",
          "columns": [
            {
              "expression": "completed_by",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "task_completions_task_id_tasks_id_fk": {
          "name": "task_completions_task_id_tasks_id_fk",
          "tableFrom": "task_completions",
          "tableTo": "tasks",
          "columnsFrom": [
            "task_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        },
        "task_completions_completed_by_users_id_fk": {
          "name": "task_completions_completed_by_users_id_fk",
          "tableFrom": "task_completions",
          "tableTo": "users",
          "columnsFrom": [
            "completed_by"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "set null",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {
        "task_completions_task_id_slot_pk": {
          "name": "task_completions_task_id_slot_pk",
          "columns": [
            "task_id",
            "slot"
          ]
        }
      },
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.tasks": {
      "name": "tasks",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "''"
        },
        "subject_id": {
          "name": "subject_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "scope": {
          "name": "scope",
          "type": "scope",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "group_id": {
          "name": "group_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "due_at": {
          "name": "due_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "priority": {
          "name": "priority",
          "type": "priority",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'medium'"
        },
        "created_by": {
          "name": "created_by",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "tasks_due": {
          "name": "tasks_due",
          "columns": [
            {
              "expression": "due_at",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "tasks_creator": {
          "name": "tasks_creator",
          "columns": [
            {
              "expression": "created_by",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "tasks_group": {
          "name": "tasks_group",
          "columns": [
            {
              "expression": "group_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "tasks_scope": {
          "name": "tasks_scope",
          "columns": [
            {
              "expression": "scope",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "tasks_subject_id_subjects_id_fk": {
          "name": "tasks_subject_id_subjects_id_fk",
          "tableFrom": "tasks",
          "tableTo": "subjects",
          "columnsFrom": [
            "subject_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "tasks_created_by_users_id_fk": {
          "name": "tasks_created_by_users_id_fk",
          "tableFrom": "tasks",
          "tableTo": "users",
          "columnsFrom": [
            "created_by"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "set null",
          "onUpdate": "no action"
        },
        "tasks_group_id_subject_id_groups_id_subject_id_fk": {
          "name": "tasks_group_id_subject_id_groups_id_subject_id_fk",
          "tableFrom": "tasks",
          "tableTo": "groups",
          "columnsFrom": [
            "group_id",
            "subject_id"
          ],
          "columnsTo": [
            "id",
            "subject_id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {
        "task_group_scope": {
          "name": "task_group_scope",
          "value": "(\"tasks\".\"scope\" = 'group' AND \"tasks\".\"group_id\" IS NOT NULL) OR (\"tasks\".\"scope\" <> 'group' AND \"tasks\".\"group_id\" IS NULL)"
        }
      },
      "isRLSEnabled": false
    },
    "public.users": {
      "name": "users",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "username": {
          "name": "username",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "display_name": {
          "name": "display_name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "password_hash": {
          "name": "password_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "role": {
          "name": "role",
          "type": "role",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'student'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "one_super_admin": {
          "name": "one_super_admin",
          "columns": [
            {
              "expression": "role",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "where": "\"users\".\"role\" = 'super_admin'",
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "users_username_unique": {
          "name": "users_username_unique",
          "nullsNotDistinct": false,
          "columns": [
            "username"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {
        "username_lowercase": {
          "name": "username_lowercase",
          "value": "\"users\".\"username\" = lower(\"users\".\"username\")"
        }
      },
      "isRLSEnabled": false
    }
  },
  "enums": {
    "public.priority": {
      "name": "priority",
      "schema": "public",
      "values": [
        "low",
        "medium",
        "high"
      ]
    },
    "public.role": {
      "name": "role",
      "schema": "public",
      "values": [
        "student",
        "super_admin"
      ]
    },
    "public.scope": {
      "name": "scope",
      "schema": "public",
      "values": [
        "personal",
        "group",
        "batch"
      ]
    }
  },
  "schemas": {},
  "sequences": {},
  "roles": {},
  "policies": {},
  "views": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}
````

## drizzle/meta/_journal.json

````
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1793627641734,
      "tag": "0000_next_machine_man",
      "breakpoints": true
    }
  ]
}
````

## drizzle.config.ts

````
import "dotenv/config";
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
````

## eslint.config.mjs

````
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
````

## next.config.ts

````
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
````

## package.json

````
{
  "name": "panic-planner",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx scripts/seed.ts"
  },
  "dependencies": {
    "@fontsource-variable/geist": "^5.3.0",
    "@hookform/resolvers": "^7.0.1",
    "bcryptjs": "^3.0.3",
    "class-variance-authority": "^0.7.1",
    "cn": "^0.5.2",
    "date-fns": "^4.4.0",
    "dotenv": "^18.0.9",
    "drizzle-orm": "^0.45.4",
    "lucide-react": "^1.66.0",
    "next": "16.4.4",
    "next-themes": "^0.4.6",
    "postgres": "^4.0.0",
    "radix-ui": "^1.8.1",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "react-hook-form": "^7.91.0",
    "server-only": "^0.0.1",
    "sonner": "^2.0.8",
    "tw-animate-css": "^1.4.0",
    "zod": "^4.6.7"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "drizzle-kit": "^0.31.11",
    "eslint": "^9",
    "eslint-config-next": "16.4.4",
    "shadcn": "^4.23.0",
    "tailwindcss": "^4",
    "tsx": "^4.23.15",
    "typescript": "^5"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
````

## postcss.config.mjs

````
export default { plugins: { "@tailwindcss/postcss": {} } };
````

## README.md

````
# Panic Planner

A simple task tracker for one university batch. Students get **All**, **My Tasks**, **My Groups**, and **Batch** views, a panic meter, local-time deadlines, and one Add task button. The super admin manages participants and subject-specific groups.

## Your production account and clean database

The production seed creates **Muhaned Muaz** as the sole super admin. Set `ADMIN_USERNAME=muhaned_muaz` and choose your own strong `ADMIN_PASSWORD` in Vercel and in the environment used to run the seed. No password is embedded in the app.

On a fresh database, migration plus seed creates exactly four subjects and this one admin. There are **no sample students, groups, tasks, completion records or sessions**. The temporary localhost preview database is separate and is never exported to Vercel. Use the supplied `panic-planner-vercel.zip` deployment package; local demo/test helpers and their sample credentials are omitted from it.

Seeding is non-destructive: it does not erase data from an existing database. For a clean launch, connect a new empty Neon database through Vercel. If your matching admin already exists, the seed updates its display name but preserves its password and username; it never creates a second admin or promotes a student.

## What is included

- Next.js 16 App Router, TypeScript, Tailwind CSS 4, official CLI-installed shadcn/ui (Radix style).
- Postgres with Drizzle, checked-in SQL migrations, and an idempotent seed script.
- Username/password authentication, bcrypt (cost 12), database sessions, 1-year sliding cookies, and database-backed throttling.
- Personal, shared group, and per-student batch completion; optimistic checkboxes with error rollback.
- Responsive light/dark UI with locally bundled Geist fonts, original generated logo, accessible dialogs, loading/empty/error states, and a collapsible desktop sidebar. Phones have separate Overview / Tasks / My Groups sections with three tasks per page (five on desktop).
- Admin participant search, add/delete/reset password, group creation/rename/deletion and member moves, and all-task editing/deletion.

No email, notifications, uploads, chat, or external authentication provider.

## Decisions to know

- The proxy (`src/proxy.ts`, the current Next.js name for middleware) redirects visitors without a cookie. Every protected page and mutation independently checks the database session. A forged cookie does not grant access.
- Students only see their own personal tasks, their **current** subject groups’ tasks, and batch tasks. Moving out of a group removes access to its tasks, including tasks they originally created.
- The sole admin can see and edit every task, including personal tasks. The UI says this clearly.
- Subject and scope cannot change after creation: this prevents accidental privacy changes and preserves completion semantics. Other fields are editable.
- Group completion is one shared record. A second check is idempotent and preserves the first completer. Unchecking removes it. Batch completion is one record per user.
- Batch counters count current students, excluding the admin. Admins can track their own batch progress without changing the student counter.
- Deleting a user revokes sessions, removes memberships and individual batch progress, and retains authored tasks with “Deleted user”. Their personal tasks remain admin-only. Shared completion survives with anonymized attribution.
- Deleting a group deliberately deletes its group tasks and completion records. The confirmation spells this out.
- Password reset revokes all sessions for that user. Rerunning the seed does **not** reset the admin password or promote an existing student.
- Due dates are stored as `timestamptz` (UTC instants), entered/displayed in the device timezone. “This week” means the remaining calendar week through Sunday. Done means current completed records, not a lifetime activity log.
- The UI has a mobile bottom bar; task forms use a scrollable accessible dialog on all screen sizes.

## Requirements

Install Node.js **24 LTS** (22+ supported), npm, and Git. Use a Postgres database provisioned through **your Vercel project → Storage / Marketplace → Neon**. No separate service is required for app functionality. Neon is the database provider managed through Vercel, not a database physically operated by Vercel.

## Local setup

Open a terminal in this `panic-planner` directory (the directory containing `package.json`).

```sh
npm ci
```

Copy `.env.example` to `.env`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```sh
# macOS / Linux
cp .env.example .env
```

Edit `.env` in your editor. Do not post it in chat or commit it.

| Variable          | Value                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL`    | Neon pooled Postgres connection string from the Vercel integration; keep `sslmode=require` |
| `AUTH_SECRET`     | Random secret of at least 32 characters; generate with the command below                   |
| `ADMIN_USERNAME`  | 3–32 letters, numbers or underscores; normalized to lowercase                              |
| `ADMIN_PASSWORD`  | At least 6 characters; use a long unique password (bcrypt limit: 72 UTF-8 bytes)           |
| `BATCH_JOIN_CODE` | Optional shared batch code; leave blank for open sign-up                                   |

Generate a secret locally:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create the schema, seed the subjects/admin, and start:

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), log in using `ADMIN_USERNAME` and `ADMIN_PASSWORD`, and open Admin. Create subject groups, then add participants or let students sign up. Assign each student to a group separately for each subject. Each membership dropdown adds, removes, or moves the student.

Never share the admin password. Manually added students receive the temporary credentials from you privately; the app does not send them anywhere.

## Checks and useful commands

```sh
npm run typecheck
npm run build
npm start
```

After deliberately editing the Drizzle schema, generate and review a migration:

```sh
npm run db:generate
npm run db:migrate
```

Commit the generated SQL **and** `drizzle/meta`. Do not use `drizzle-kit push` on production. Do not put migrations or seeding in the Vercel build command: concurrent preview/production builds should never race to change the database.

## Beginner deployment guide: GitHub → Vercel → Neon

### 1. Put the code on GitHub

1. Create a GitHub account if needed and sign in.
2. Choose **New repository**, name it `panic-planner`, and make it private if desired. Do not add a README, license or gitignore there because these files already exist locally.
3. In a terminal opened **inside this panic-planner folder**, run:

```sh
git init
git add .
git status
```

4. Check that `.env` and `.env.local` are **not** listed. `.env.example` should be listed; it contains placeholders only.
5. Commit and push, replacing `YOUR_USERNAME`:

```sh
git commit -m "Build Panic Planner"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/panic-planner.git
git push -u origin main
```

If `origin` already exists, inspect it with `git remote -v` before changing it. Authenticate with GitHub when prompted; GitHub passwords cannot be used as Git HTTPS passwords, so use Git Credential Manager or GitHub CLI login.

### 2. Create the Vercel project

1. Sign into [Vercel](https://vercel.com) with GitHub.
2. Choose **Add New → Project** and import the `panic-planner` repository. Allow Vercel access to this repository when asked.
3. Framework preset: **Next.js**. Root Directory: `./` if you pushed this folder itself; **`panic-planner`** if you pushed its parent folder instead.
4. Keep the default install command (`npm install`/lockfile detection), build command (`npm run build`), and output directory. Choose Node.js 24.x in project settings if offered.
5. Deploy once to create the project. The build does not connect to the database. Login pages can load before database setup, but authentication/dashboard operations need the following steps.

### 3. Add Postgres from inside Vercel

1. In the project dashboard open **Storage** and choose **Create Database / Browse Marketplace** (labels may vary).
2. Select **Neon (Postgres)**. Use the free plan offered by the integration and choose a region near your students and Vercel functions.
3. Complete the integration flow inside Vercel and connect the database to your Panic Planner project.
4. Select the environments to connect. For a first deployment use Production and Development. Keep Preview on a separate Neon branch/database if you enable it; do not let experimental previews mutate production.
5. Inspect **Project Settings → Environment Variables**. The integration should provide `DATABASE_URL`. If it only provides prefixed variables, add `DATABASE_URL` using its pooled Postgres connection string. Keep the URL private and preserve SSL query parameters.

Official guidance: [Vercel Marketplace storage](https://vercel.com/docs/marketplace-storage), [Neon on Vercel](https://vercel.com/marketplace/neon).

### 4. Set the app secrets

In **Project Settings → Environment Variables**, add:

- `AUTH_SECRET`: the generated 64-character random value.
- `ADMIN_USERNAME`: `muhaned_muaz`.
- `ADMIN_PASSWORD`: your unique admin password.
- `BATCH_JOIN_CODE`: optional. Omit it or leave blank for open registration.

Set Production and Development as appropriate. Do **not** prefix any secret with `NEXT_PUBLIC_`. Use different secrets for isolated preview environments. Changing `AUTH_SECRET` invalidates all current sessions. Saving environment variables does not update an existing deployment; redeploy afterward.

### 5. Run the migration and seed against your Vercel database

Vercel does not give you a persistent application terminal. Run these one-time commands **from your own computer**; they connect securely to the database in your Vercel project.

Option A (simplest): copy the connection string from Vercel into your local ignored `.env`, and set the same `ADMIN_USERNAME` and `ADMIN_PASSWORD` there. Then run:

```sh
npm run db:migrate
npm run db:seed
```

Option B (Vercel CLI):

```sh
npx vercel login
npx vercel link
npx vercel env pull .env --environment=production
npm run db:migrate
npm run db:seed
```

Choose the existing Panic Planner project during `vercel link`. `env pull` replaces the local `.env` when confirmed, so use a backup if it contains values you need. Check that all required variables are present without printing their values publicly.

Expect a successful migration and `Seed complete`. Run only once for initial setup; reruns are safe and leave the existing admin unchanged. If a student already owns the desired admin username, seeding fails instead of silently promoting that account. Choose a different admin username before rerunning.

### 6. Redeploy and verify

1. Return to **Deployments**, open the latest deployment’s menu, and select **Redeploy** so the runtime receives the new environment variables.
2. Open the production URL shown by Vercel (`https://…vercel.app`).
3. Log in as the seeded admin. Verify all four subjects appear when adding a task.
4. Create test students and subject groups, then follow the manual checklist below.
5. Share the production URL and join code (if configured) with your batch. Do not share admin credentials.

Subsequent pushes to `main` deploy automatically. For schema changes, review/back up the database and apply compatible migrations before the code depending on them goes live.

### Hobby/free-plan expectations

The app requires no paid feature, cron service, email service, or separate rate-limit service. It is designed for a small university batch on Vercel Hobby and Neon’s free allocation. Free-plan availability, quotas, and Hobby usage eligibility are controlled by the providers; review the plans shown in your dashboard. No code can guarantee that a deployment will never exceed a provider limit. Keep previews isolated, monitor usage, and export important data before destructive maintenance.

## Troubleshooting

| Symptom                                | What to check                                                                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login page works but dashboard fails   | Verify `DATABASE_URL`, run migrations and seed, and inspect Vercel runtime logs. Redeploy after environment changes.                                                    |
| `relation users does not exist`        | Migrations did not run against the same database URL used in Production.                                                                                                |
| `AUTH_SECRET` missing / too short      | Set a random secret of at least 32 characters, then redeploy.                                                                                                           |
| Wrong username/password                | Usernames are normalized; passwords are case-sensitive. Seed does not reset an existing admin. A logged-in admin can reset accounts in Participants.                    |
| Too many attempts                      | Wait 15 minutes. Counters are stored in Postgres, including unknown usernames. Repeated retries extend neither the fixed window nor your patience.                      |
| Cannot sign up                         | Check the batch join code; ensure the username is unique and uses letters, digits or underscores.                                                                       |
| “Username already taken” while seeding | A student owns that name. Choose a different `ADMIN_USERNAME`; never promote public sign-ups.                                                                           |
| Missing subjects                       | Run `npm run db:seed` against the correct database.                                                                                                                     |
| “No group yet”                         | Admin must assign you to a group for the currently selected subject. Membership in another subject’s group does not count.                                              |
| Group task disappeared after a move    | Expected: visibility follows current membership. Old group tasks stay with the old group.                                                                               |
| Dates look different on two devices    | Expected timezone conversion. Check device timezone settings; the saved instant is identical.                                                                           |
| Session disappears                     | Private browsing, browser cookie deletion, password reset, admin deletion, expiry after a year without use, or `AUTH_SECRET` changes can end it.                        |
| Database connection timeout            | Check Neon integration status, connection string, SSL and region. A sleeping free database may need a moment to wake.                                                   |
| Build fails resolving imports          | Run `npm ci`; use this folder as the Vercel Root Directory and supported Node.js version. Commit `package-lock.json`.                                                   |
| Git says “Author identity unknown”     | Configure `git config user.name "Your Name"` and `git config user.email "your GitHub email"`, then commit again. This email is for Git history, not app authentication. |
| Request origin not allowed             | Use the direct Vercel/custom-domain URL. Avoid a reverse proxy that rewrites the request origin.                                                                        |

## Manual acceptance checklist

Use separate regular/incognito browser profiles for Admin, Alice and Bob.

- [ ] Sign up Alice; confirm uppercase/lowercase variants of her username cannot create a second account.
- [ ] With a configured join code, reject missing/wrong codes; with it unset, permit open sign-up.
- [ ] Log in, close/reopen the regular browser, and verify the session remains. Log out and verify protected routes redirect.
- [ ] After repeated invalid login attempts, verify throttling; retry after the 15-minute window.
- [ ] Alice creates a personal task. It appears in My Tasks and All, but not Bob’s UI or server response. Bob cannot edit/delete/complete it using its ID in a forged request.
- [ ] Alice cannot open `/admin`; a forged admin mutation is rejected server-side.
- [ ] Admin creates English and Digital Communication groups; place Alice in one group per subject and Bob in Alice’s English group.
- [ ] A second group assignment in the same subject moves the student, never duplicates membership. Removing membership removes group-task access.
- [ ] Alice cannot create a group task for a subject with no membership, including through a forged request.
- [ ] Create a group task. Alice and Bob see it in My Groups; an outsider cannot access it by guessing an ID.
- [ ] Alice marks it done. Bob sees the shared state, completer and timestamp after refresh. Bob can undo it.
- [ ] Create a batch task. Alice checks it; Bob’s checkbox stays unchecked, while the counter increases. Undo reduces it. Admin progress does not inflate the student counter.
- [ ] Personal done/undone affects only that personal task. Concurrent duplicate checks do not create duplicate completions.
- [ ] Students can edit/delete their own visible tasks, but cannot edit/delete someone else’s batch/group task. Admin can edit/delete any task.
- [ ] Task editing preserves scope and subject. Delete requires confirmation.
- [ ] Admin adds a participant with temporary password; that user can log in. Reset password invalidates prior sessions and accepts the new password.
- [ ] Admin deletes a student; all sessions stop working, authored tasks show Deleted user, shared completion survives, individual batch progress is removed, and the student count drops.
- [ ] Admin cannot delete the sole super admin. Public sign-up cannot create an admin even with a forged role field.
- [ ] Admin renames and deletes a group; deletion warns about and removes its group tasks.
- [ ] Filters, all three separate views, empty states, due-today/overdue/week summaries, progress and priority work on phone width and desktop.
- [ ] Test light/dark/system theme, keyboard-only dialog/select use, screen-reader labels and 200% zoom.
- [ ] Disable the network and check a task: it rolls back and shows an error. Retry successfully when online.
- [ ] Test a deadline around midnight in two device timezones and around daylight-saving changes. Verify the same saved instant.

## Code map

- `src/app`: pages, protected dashboard/admin, JSON mutation and auth endpoints.
- `src/components`: application UI; `ui/` contains official shadcn CLI output.
- `src/lib/auth.ts`: token hashing, cookies, renewal, database throttling.
- `src/lib/data.ts`: server-only visibility and data projection.
- `src/lib/validation.ts`: Zod input schemas.
- `src/lib/db/schema.ts`: enums, tables, keys, checks and indexes.
- `src/lib/copy.ts`: friendly copy library (45+ lines).
- `drizzle/`: executable migration and Drizzle metadata.
- `scripts/seed.ts`: subjects and the sole admin.

All source files are provided in the project folder. `SOURCE.md` contains a generated file-by-file source listing, with each file path above its code, excluding secrets, build outputs and dependencies. This deployment edition contains no local demo/test helpers or sample credentials.


## Verification before packaging

The full application passed its production build, database tests, end-to-end tests and 18 accessibility checks in the development workspace. Test fixtures and local preview scripts are intentionally excluded from this deployment edition. The production seed creates only Muhaned Muaz and the four semester subjects.
````

## scripts/seed.ts

````
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { subjects, users } from "../src/lib/db/schema";
import { credentials } from "../src/lib/validation";
async function main() {
  const env = z
    .object({
      DATABASE_URL: z.string().min(1),
      ADMIN_USERNAME: z.string(),
      ADMIN_PASSWORD: z.string(),
    })
    .parse(process.env);
  const admin = credentials.parse({
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD,
  });
  const client = postgres(env.DATABASE_URL, { max: 1, prepare: false });
  const database = drizzle(client);
  try {
    await database.transaction(async (tx) => {
      await tx
        .insert(subjects)
        .values([
          { name: "English for Academic Purposes", color: "purple" },
          { name: "Mathematics", color: "blue" },
          { name: "Personal Development and Study Skills", color: "amber" },
          { name: "Digital Communication and Collaboration", color: "green" },
        ])
        .onConflictDoNothing();
      const existing = await tx
        .select()
        .from(users)
        .where(eq(users.role, "super_admin"));
      if (!existing.length)
        await tx
          .insert(users)
          .values({
            username: admin.username,
            displayName: "Muhaned Muaz",
            passwordHash: await bcrypt.hash(admin.password, 12),
            role: "super_admin",
          });
      else if (existing[0].username === admin.username)
        await tx.update(users).set({ displayName: "Muhaned Muaz" }).where(eq(users.id, existing[0].id));
    });
    console.log(
      "Seed complete. Four subjects and the super admin ensured. No demo users, groups or tasks are created; existing admin credentials are never overwritten.",
    );
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error(
    "Seed failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
````

## src/app/admin/page.tsx

````
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { loadData } from "@/lib/data";
import { Planner } from "@/components/planner";
export const dynamic = "force-dynamic";
export default async function Admin() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/");
  return (
    <Planner
      admin
      data={JSON.parse(JSON.stringify(await loadData(user, true)))}
    />
  );
}
````

## src/app/api/auth/route.ts

````
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { credentials, registration } from "@/lib/validation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  currentUser,
  newSession,
  logout,
  renewSession,
  throttle,
  digest,
} from "@/lib/auth";
import { failure, sameOrigin } from "@/lib/http";
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("login"), data: credentials }),
  z.object({ action: z.literal("signup"), data: registration }),
  z.object({ action: z.literal("logout") }),
  z.object({ action: z.literal("renew") }),
]);
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const body = input.parse(await req.json());
    if (body.action === "logout") {
      await logout();
      return NextResponse.json({ ok: true });
    }
    if (body.action === "renew") {
      if (!(await currentUser())) throw new Error("Please log in.");
      await renewSession();
      return NextResponse.json({ ok: true });
    }
    // Vercel overwrites x-vercel-forwarded-for; do not trust arbitrary forwarded headers.
    const ip = req.headers.get("x-vercel-forwarded-for") ?? "local";
    await throttle(`ip:${ip}`, 60);
    await throttle(`username:${body.data.username}`, 10);
    if (body.action === "signup") {
      if (
        process.env.BATCH_JOIN_CODE &&
        digest(body.data.joinCode ?? "") !== digest(process.env.BATCH_JOIN_CODE)
      )
        throw new Error("Join code is incorrect.");
      const [user] = await db()
        .insert(users)
        .values({
          username: body.data.username,
          displayName: body.data.displayName,
          passwordHash: await bcrypt.hash(body.data.password, 12),
          role: "student",
        })
        .returning({ id: users.id });
      await newSession(user.id);
    } else {
      const [user] = await db()
        .select()
        .from(users)
        .where(eq(users.username, body.data.username));
      const valid = await bcrypt.compare(
        body.data.password,
        user?.passwordHash ??
          "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW",
      );
      if (!user || !valid)
        throw new Error("Username or password is incorrect.");
      await newSession(user.id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
````

## src/app/api/mutate/route.ts

````
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  sessions,
  tasks,
  groups,
  groupMembers,
  taskCompletions,
} from "@/lib/db/schema";
import { visible } from "@/lib/data";
import { mutation } from "@/lib/validation";
import { sameOrigin, failure } from "@/lib/http";
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const input = mutation.parse(await req.json());
    const user = await currentUser();
    if (!user) throw new Error("Please log in.");
    const database = db();
    await database.transaction(async (tx) => {
      if (input.action === "createTask") {
        const [membership] = await tx
          .select()
          .from(groupMembers)
          .where(
            and(
              eq(groupMembers.userId, user.id),
              eq(groupMembers.subjectId, input.data.subjectId),
            ),
          )
          .for("update");
        if (input.data.scope === "group" && !membership)
          throw new Error("Join a group for this subject first.");
        await tx
          .insert(tasks)
          .values({
            ...input.data,
            dueAt: new Date(input.data.dueAt),
            createdBy: user.id,
            groupId: input.data.scope === "group" ? membership.groupId : null,
          });
        return;
      }
      if (
        ["editTask", "deleteTask", "complete"].includes(input.action) &&
        "id" in input &&
        input.id
      ) {
        const [task] = await tx
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, input.id), visible(user)))
          .for("update");
        if (!task) throw new Error("Task not found.");
        if (input.action === "complete") {
          if (user.role !== "super_admin") {
            if (task.scope === "personal" && task.createdBy !== user.id)
              throw new Error("Not allowed.");
            if (task.scope === "group") {
              const [member] = await tx
                .select()
                .from(groupMembers)
                .where(
                  and(
                    eq(groupMembers.userId, user.id),
                    eq(groupMembers.groupId, task.groupId!),
                  ),
                )
                .for("update");
              if (!member) throw new Error("Not allowed.");
            }
          }
          const slot = task.scope === "batch" ? user.id : "shared";
          if (input.done)
            await tx
              .insert(taskCompletions)
              .values({ taskId: task.id, slot, completedBy: user.id })
              .onConflictDoNothing();
          else
            await tx
              .delete(taskCompletions)
              .where(
                and(
                  eq(taskCompletions.taskId, task.id),
                  eq(taskCompletions.slot, slot),
                ),
              );
        } else {
          if (user.role !== "super_admin" && task.createdBy !== user.id)
            throw new Error("Not allowed.");
          if (input.action === "deleteTask")
            await tx.delete(tasks).where(eq(tasks.id, task.id));
          if (input.action === "editTask") {
            if (
              task.scope !== input.data.scope ||
              task.subjectId !== input.data.subjectId
            )
              throw new Error("Subject and scope cannot be changed.");
            await tx
              .update(tasks)
              .set({
                title: input.data.title,
                description: input.data.description,
                dueAt: new Date(input.data.dueAt),
                priority: input.data.priority,
                updatedAt: new Date(),
              })
              .where(eq(tasks.id, task.id));
          }
        }
        return;
      }
      if (user.role !== "super_admin") throw new Error("Not allowed.");
      if (input.action === "addUser")
        await tx
          .insert(users)
          .values({
            username: input.data.username,
            displayName: input.data.displayName,
            passwordHash: await bcrypt.hash(input.data.password, 12),
          });
      if (input.action === "deleteUser") {
        const [target] = await tx
          .select()
          .from(users)
          .where(eq(users.id, input.id))
          .for("update");
        if (target?.role === "super_admin")
          throw new Error("The super admin cannot be deleted.");
        // Remove personal batch progress; retain shared completion attribution as Deleted user.
        await tx
          .delete(taskCompletions)
          .where(eq(taskCompletions.slot, input.id));
        await tx.delete(users).where(eq(users.id, input.id));
      }
      if (input.action === "resetPassword") {
        await tx
          .update(users)
          .set({ passwordHash: await bcrypt.hash(input.password, 12) })
          .where(eq(users.id, input.id));
        await tx.delete(sessions).where(eq(sessions.userId, input.id));
      }
      if (input.action === "saveGroup") {
        if (input.id)
          await tx
            .update(groups)
            .set({ name: input.name })
            .where(
              and(
                eq(groups.id, input.id),
                eq(groups.subjectId, input.subjectId),
              ),
            );
        else
          await tx
            .insert(groups)
            .values({ name: input.name, subjectId: input.subjectId });
      }
      if (input.action === "deleteGroup")
        await tx.delete(groups).where(eq(groups.id, input.id));
      if (input.action === "membership") {
        if (input.groupId) {
          const [group] = await tx
            .select()
            .from(groups)
            .where(
              and(
                eq(groups.id, input.groupId),
                eq(groups.subjectId, input.subjectId),
              ),
            )
            .for("update");
          if (!group) throw new Error("Group not found.");
          await tx
            .insert(groupMembers)
            .values({
              userId: input.userId,
              subjectId: input.subjectId,
              groupId: input.groupId,
            })
            .onConflictDoUpdate({
              target: [groupMembers.userId, groupMembers.subjectId],
              set: { groupId: input.groupId },
            });
        } else
          await tx
            .delete(groupMembers)
            .where(
              and(
                eq(groupMembers.userId, input.userId),
                eq(groupMembers.subjectId, input.subjectId),
              ),
            );
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
````

## src/app/error.tsx

````
"use client";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen grid place-content-center gap-5 p-8 text-center">
      <h1 className="text-2xl font-semibold">{copy.ui.errorTitle}</h1>
      <p>We couldn’t load your planner. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
      <a href="/login" className="underline">
        Back to login
      </a>
    </main>
  );
}
````

## src/app/globals.css

````
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-sans);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
/* Panic Planner: quiet paper surfaces, mint accents, readable subject colors. */
:root {
  --font-sans: "Geist Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: Consolas, monospace;
  --background: #f7f8f5;
  --foreground: #253b35;
  --card: #ffffff;
  --card-foreground: #253b35;
  --primary: #226b54;
  --primary-foreground: #ffffff;
  --secondary: #eaf1ec;
  --secondary-foreground: #245b49;
  --accent: #edf3ef;
  --accent-foreground: #245b49;
  --muted: #eef1ed;
  --muted-foreground: #65736b;
  --border: #e0e6df;
  --input: #d4ded5;
  --ring: #46866b;
  --radius: 0.85rem;
}
.dark {
  --background: #121b18;
  --foreground: #e5eee8;
  --card: #1a2621;
  --card-foreground: #e5eee8;
  --primary: #9ad6b8;
  --primary-foreground: #143b2b;
  --secondary: #293c32;
  --secondary-foreground: #cce9d7;
  --accent: #293c32;
  --accent-foreground: #e5eee8;
  --muted: #24372d;
  --muted-foreground: #a6b8ac;
  --border: #34473b;
  --input: #405647;
  --ring: #9ad6b8;
}
.brand {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.055em;
}
.eyebrow {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--muted-foreground);
  font-weight: 600;
}
.task-card {
  transition: border-color 0.15s;
}
.task-card:hover {
  border-color: var(--ring);
}
.subject-purple {
  background: #f0eafa;
  color: #67498a;
}
.subject-blue {
  background: #e7effc;
  color: #365d94;
}
.subject-amber {
  background: #fff1d7;
  color: #805c20;
}
.subject-green {
  background: #e1f2e9;
  color: #286447;
}
.dark .subject-purple {
  background: #382c49;
  color: #dbc3fc;
}
.dark .subject-blue {
  background: #23364d;
  color: #bdd8ff;
}
.dark .subject-amber {
  background: #413624;
  color: #f9dca5;
}
.dark .subject-green {
  background: #224332;
  color: #b0e8c9;
}
button,
[role="tab"],
[role="combobox"] {
  touch-action: manipulation;
}
@media (max-width: 640px) {
  input,
  textarea {
    font-size: 16px !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
/* Reference-inspired warm canvas and quiet shadcn surfaces. */
:root {
  --background: #f7f4ef;
  --foreground: #242624;
  --card: #ffffff;
  --card-foreground: #242624;
  --primary: #252a28;
  --primary-foreground: #ffffff;
  --secondary: #eeebe5;
  --secondary-foreground: #282a26;
  --accent: #f1eee8;
  --accent-foreground: #242624;
  --muted: #f2efea;
  --muted-foreground: #74736f;
  --border: #e9e5df;
  --input: #dedbd4;
  --ring: #7c8c72;
  --radius: 0.9rem;
}
.dark {
  --background: #1c1d1b;
  --foreground: #f1f0e9;
  --card: #252723;
  --card-foreground: #f1f0e9;
  --primary: #e6ebd9;
  --primary-foreground: #242820;
  --secondary: #34372f;
  --secondary-foreground: #f1f0e9;
  --accent: #34372f;
  --accent-foreground: #f1f0e9;
  --muted: #30322c;
  --muted-foreground: #b3b3a8;
  --border: #3e4038;
  --input: #4b4d43;
  --ring: #b5ca99;
}
.planner-topbar {
  border-bottom: 1px solid var(--border);
}
.planner-sidebar {
  position: fixed;
  top: 18px;
  left: 18px;
  bottom: 18px;
  width: 232px;
  padding: 26px 18px 18px;
  border-radius: 24px;
  background: var(--card);
  flex-direction: column;
  z-index: 30;
}
.planner-sidebar .brand {
  font-size: 20px;
  gap: 5px;
  letter-spacing: -0.055em;
}
.planner-sidebar .brand-mark {
  width: 32px;
  height: 32px;
}
.sidebar-person {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 42px 10px 38px;
}
.greeting-spark {
  display: inline-block;
  color: #91a377;
  transform: rotate(-12deg);
  margin-left: 8px;
}
.panic-stats > [data-slot="card"] {
  border: 0;
  border-radius: 20px;
}
.panic-stats > :nth-child(1) {
  background: #f8e5d9;
}
.panic-stats > :nth-child(2) {
  background: #f9ebbc;
}
.panic-stats > :nth-child(3) {
  background: #e6e0f1;
}
.panic-stats > :nth-child(4) {
  background: #dceccf;
}
.dark .panic-stats > :nth-child(1) {
  background: #44352e;
}
.dark .panic-stats > :nth-child(2) {
  background: #423d29;
}
.dark .panic-stats > :nth-child(3) {
  background: #373142;
}
.dark .panic-stats > :nth-child(4) {
  background: #303e2b;
}
.task-section {
  background: var(--card);
  padding: 25px;
  border-radius: 24px;
}
.task-card {
  border-radius: 14px;
  background: var(--card);
}
.task-card:hover {
  border-color: #c9c9bd;
  box-shadow: 0 5px 20px #24262404;
}
.auth-layout {
  display: grid;
  place-items: center;
  gap: 40px;
}
.auth-story {
  background: #252a28;
  color: #fff;
  border-radius: 30px;
  padding: 48px;
  align-self: stretch;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  min-height: 700px;
}
.auth-story::after {
  content: "";
  position: absolute;
  width: 500px;
  height: 500px;
  right: -180px;
  bottom: -270px;
  border-radius: 50%;
  background: #dce9b7;
  filter: blur(75px);
  opacity: 0.5;
  pointer-events: none;
}
.auth-story .brand {
  position: relative;
  z-index: 1;
}
.auth-story .brand-mark {
  background: #fff;
  border-radius: 9px;
}
.auth-card {
  border: 0;
  background: transparent;
}
.auth-card [data-slot="card-title"] {
  font-size: 30px;
  letter-spacing: -0.045em;
}
.auth-card input {
  background: var(--card);
  height: 44px;
}
.auth-card button[type="submit"] {
  height: 44px;
}
.dark .brand-mark {
  background: #f5f2eb;
  border-radius: 8px;
}
@media (min-width: 1024px) {
  .planner-shell {
    padding-left: 260px;
  }
  .planner-topbar {
    border: 0;
  }
  .planner-main {
    padding-top: 20px;
  }
  .auth-layout {
    grid-template-columns: 1fr 1fr;
    padding: 28px;
    min-height: 100dvh;
  }
  .auth-form-wrap {
    padding: 20px;
  }
}
@media (max-width: 639px) {
  .task-section {
    padding: 18px 12px;
    margin-left: -8px;
    margin-right: -8px;
    border-radius: 20px;
  }
  .task-card [data-slot="card-content"] {
    padding: 15px 12px;
    gap: 12px;
  }
  .auth-card {
    background: var(--card);
    border: 1px solid var(--border);
    padding: 26px 0;
  }
}
/* Readability and narrow-screen guardrails. */
:root {
  --muted-foreground: #686761;
}
.dark {
  --muted-foreground: #bdbdb1;
}
.planner-main,
.task-section,
[data-slot="card"],
[data-slot="card-content"] {
  min-width: 0;
}
.panic-stats .text-muted-foreground {
  color: #595a51;
}
.dark .panic-stats .text-muted-foreground {
  color: #d2d2c4;
}
[data-slot="select-trigger"] {
  min-width: 0;
  max-width: 100%;
}
[data-slot="select-value"] {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[data-slot="select-content"] {
  max-width: min(94vw, 420px);
}
[data-slot="select-item"] {
  white-space: normal;
  overflow-wrap: anywhere;
}
[data-slot="dialog-content"] {
  max-width: calc(100vw - 2rem);
}
@media (min-width: 640px) {
  [data-slot="dialog-content"] {
    max-width: 32rem;
  }
}
[data-slot="badge"] {
  max-width: 100%;
}
.dark .text-destructive {
  color: #ffa2a2;
}
@media (max-width: 639px) {
  .planner-topbar .brand {
    font-size: 19px;
    gap: 5px;
  }
  .planner-topbar .brand-mark {
    width: 31px;
    height: 31px;
  }
  .planner-topbar > div {
    gap: 8px;
    padding-left: 16px;
    padding-right: 16px;
  }
}
[data-slot="checkbox"] {
  border-color: #8c8e83;
}
.dark [data-slot="checkbox"] {
  border-color: #8d9380;
}
.dark [data-slot="checkbox"][data-state="checked"] {
  border-color: var(--primary);
}
.panic-stats [data-slot="card-content"] {
  padding-top: 12px;
  padding-bottom: 12px;
}
.task-card {
  padding-top: 0;
  padding-bottom: 0;
}
@media (max-width: 639px) {
  .panic-stats [data-slot="card-content"] {
    padding: 8px 16px;
  }
}
/* Scroll is contained inside the desktop sidebar; mobile sections are independent. */
.planner-sidebar {
  overflow: hidden;
}
.planner-sidebar > .brand {
  flex-shrink: 0;
}
.sidebar-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  margin: 8px -6px 12px;
  padding: 0 6px;
  scrollbar-width: thin;
}
.sidebar-person {
  margin-top: 28px;
  margin-bottom: 28px;
}
.sidebar-logout {
  padding-top: 10px;
  padding-bottom: 10px;
}
.planner-sidebar.is-collapsed {
  width: 76px;
  padding: 26px 12px 18px;
}
.is-collapsed .sidebar-label,
.is-collapsed .brand > span {
  display: none;
}
.is-collapsed .brand {
  justify-content: center;
  width: 100%;
}
.is-collapsed .sidebar-person {
  margin: 24px 0;
  justify-content: center;
}
.is-collapsed .sidebar-person [data-slot="avatar"] {
  width: 38px;
  height: 38px;
}
.is-collapsed nav button,
.is-collapsed nav a,
.is-collapsed .sidebar-logout {
  justify-content: center;
  width: 100%;
  padding-left: 0;
  padding-right: 0;
}
[data-slot="tabs-trigger"] {
  color: #5c5c55;
}
[data-slot="tabs-trigger"][data-state="active"] {
  color: #242624;
}
.dark [data-slot="tabs-trigger"] {
  color: #c3c5b8;
}
.dark [data-slot="tabs-trigger"][data-state="active"] {
  color: #f5f5ed;
}
.mobile-section-button {
  height: 52px;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  padding: 5px;
  font-size: 10px;
}
.mobile-section-button svg {
  width: 18px;
  height: 18px;
}
.mobile-sections {
  padding-bottom: max(8px, env(safe-area-inset-bottom));
}
@media (min-width: 1024px) {
  .sidebar-is-collapsed {
    padding-left: 100px;
  }
}
@media (max-width: 639px) {
  .planner-main {
    padding-top: 20px;
  }
  .planner-main > div:first-child {
    gap: 18px;
    margin-bottom: 24px;
  }
}
````

## src/app/layout.tsx

````
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@fontsource-variable/geist";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panic Planner — A little less last-minute",
  description:
    "Your university batch’s calm corner of organized chaos. Track personal, group and batch deadlines.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
````

## src/app/loading.tsx

````
import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main
      className="max-w-6xl mx-auto p-8 space-y-8"
      aria-label="Loading your planner"
    >
      <Skeleton className="h-14 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
    </main>
  );
}
````

## src/app/login/page.tsx

````
import { AuthForm } from "@/components/auth-form";
export default function Login() {
  return <AuthForm />;
}
````

## src/app/page.tsx

````
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { loadData } from "@/lib/data";
import { Planner } from "@/components/planner";
export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <Planner data={JSON.parse(JSON.stringify(await loadData(user)))} />;
}
````

## src/app/sign-up/page.tsx

````
import { AuthForm } from "@/components/auth-form";
export const dynamic = "force-dynamic";
export default function Signup() {
  return <AuthForm signup joinCode={!!process.env.BATCH_JOIN_CODE} />;
}
````

## src/components/admin-panel.tsx

````
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
````

## src/components/auth-form.tsx

````
"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
export function AuthForm({
  signup = false,
  joinCode = false,
}: {
  signup?: boolean;
  joinCode?: boolean;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <main className="auth-layout min-h-screen p-5 bg-background">
      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>
      <section className="auth-story hidden lg:flex">
        <Brand />
        <div className="relative z-10">
          <p className="eyebrow text-white/60 mb-5">{copy.ui.heroEyebrow}</p>
          <h1 className="text-6xl font-medium tracking-[-.06em] leading-[1.05]">
            Big deadlines.
            <br />
            Small steps.
          </h1>
          <p className="text-white/65 max-w-sm text-lg leading-relaxed mt-6">{copy.ui.heroCaption}</p>
          <div className="flex gap-2 mt-9">
            <span className="rounded-full border border-white/20 px-4 py-2 text-xs">
              Just you
            </span>
            <span className="rounded-full border border-white/20 px-4 py-2 text-xs">
              Your group
            </span>
            <span className="rounded-full border border-white/20 px-4 py-2 text-xs">
              The whole batch
            </span>
          </div>
        </div>
        <p className="relative z-10 text-sm text-white/50">{copy.ui.heroFooter}</p>
      </section>
      <div className="auth-form-wrap w-full max-w-md">
        <div className="lg:hidden mb-9 flex justify-center">
          <Brand />
        </div>
        <Card className="auth-card shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">
              {signup ? copy.ui.signupTitle : copy.ui.loginTitle}
            </CardTitle>
            <CardDescription>{copy.auth[signup ? 2 : 0]}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setPending(true);
                setError("");
                const data = Object.fromEntries(new FormData(e.currentTarget));
                try {
                  const res = await fetch("/api/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: signup ? "signup" : "login",
                      data,
                    }),
                  });
                  const body = await res.json();
                  if (!res.ok) throw new Error(body.error);
                  window.location.assign("/");
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Connection lost. Please retry.",
                  );
                  setPending(false);
                }
              }}
            >
              {signup && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Your name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    required
                    maxLength={80}
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  required
                  minLength={3}
                  maxLength={32}
                  pattern="[A-Za-z0-9_]+"
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="deadline_survivor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  maxLength={72}
                  autoComplete={signup ? "new-password" : "current-password"}
                />
              </div>
              {signup && joinCode && (
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Batch join code</Label>
                  <Input
                    id="joinCode"
                    name="joinCode"
                    required
                    maxLength={200}
                  />
                </div>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button className="w-full" disabled={pending}>
                {pending
                  ? copy.ui.waiting
                  : signup
                    ? copy.ui.signupAction
                    : copy.ui.loginAction}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {signup ? "Already part of the batch?" : "New to the batch?"}{" "}
                <Link
                  className="text-primary underline underline-offset-4"
                  href={signup ? "/login" : "/sign-up"}
                >
                  {signup ? "Log in" : "Sign up"}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-6">{copy.ui.authFooter}</p>
      </div>
    </main>
  );
}
````

## src/components/brand.tsx

````
import Image from "next/image";
import Link from "next/link";
export function Brand() {
  return (
    <Link
      href="/"
      className="brand inline-flex items-center gap-2.5"
      aria-label="Panic Planner home"
    >
      <Image
        src="/panic-planner-logo.png"
        alt=""
        width={38}
        height={38}
        className="brand-mark size-10 object-contain"
        priority
      />
      <span>
        Panic<span className="font-normal">Planner</span>
        <span className="text-orange-500">.</span>
      </span>
    </Link>
  );
}
````

## src/components/planner.tsx

````
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
````

## src/components/providers.tsx

````
"use client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster richColors />
    </ThemeProvider>
  );
}
````

## src/components/sidebar.tsx

````
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
````

## src/components/task-editor.tsx

````
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
````

## src/components/theme-toggle.tsx

````
"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle color theme"
      title="Switch light / dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
    </Button>
  );
}
````

## src/components/ui/alert-dialog.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  size?: "default" | "sm";
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          "group/alert-dialog-content fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[size=sm]:max-w-xs data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[size=default]:sm:max-w-lg",
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "text-lg font-semibold sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "mb-2 inline-flex size-16 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Action
        data-slot="alert-dialog-action"
        className={cn(className)}
        {...props}
      />
    </Button>
  );
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Cancel
        data-slot="alert-dialog-cancel"
        className={cn(className)}
        {...props}
      />
    </Button>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
````

## src/components/ui/avatar.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";
import { Avatar as AvatarPrimitive } from "radix-ui";

function Avatar({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg";
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
        className,
      )}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
};
````

## src/components/ui/badge.tsx

````
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
````

## src/components/ui/button.tsx

````
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
````

## src/components/ui/card.tsx

````
import * as React from "react";
import { cn } from "cn";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
````

## src/components/ui/checkbox.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
````

## src/components/ui/dialog.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
````

## src/components/ui/dropdown-menu.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
````

## src/components/ui/form.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";
import type { Label as LabelPrimitive } from "radix-ui";
import { Slot } from "radix-ui";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Label } from "@/components/ui/label";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
````

## src/components/ui/input.tsx

````
import * as React from "react";
import { cn } from "cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
````

## src/components/ui/label.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";
import { Label as LabelPrimitive } from "radix-ui";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
````

## src/components/ui/progress.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";
import { Progress as ProgressPrimitive } from "radix-ui";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
````

## src/components/ui/select.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-2 flex size-3.5 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
````

## src/components/ui/separator.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";
import { Separator as SeparatorPrimitive } from "radix-ui";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
````

## src/components/ui/sheet.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-secondary">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
````

## src/components/ui/skeleton.tsx

````
import { cn } from "cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  );
}

export { Skeleton };
````

## src/components/ui/sonner.tsx

````
"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
````

## src/components/ui/table.tsx

````
"use client";

import * as React from "react";
import { cn } from "cn";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
````

## src/components/ui/tabs.tsx

````
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Tabs as TabsPrimitive } from "radix-ui";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
````

## src/components/ui/textarea.tsx

````
import * as React from "react";
import { cn } from "cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
````

## src/lib/auth.ts

````
import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { sessions, users, authAttempts } from "./db/schema";
export const COOKIE = "panic_session";
const YEAR = 365 * 86400;
export function digest(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const rows = await db()
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, digest(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    );
  return rows[0]?.user ?? null;
}
export async function newSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await db().delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await db()
    .insert(sessions)
    .values({
      tokenHash: digest(token),
      userId,
      expiresAt: new Date(Date.now() + YEAR * 1000),
    });
  await setCookie(token);
}
async function setCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: YEAR,
  });
}
export async function renewSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return;
  await db()
    .update(sessions)
    .set({ expiresAt: new Date(Date.now() + YEAR * 1000) })
    .where(eq(sessions.tokenHash, digest(token)));
  await setCookie(token);
}
export async function logout() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token)
    await db()
      .delete(sessions)
      .where(eq(sessions.tokenHash, digest(token)));
  (await cookies()).delete(COOKIE);
}
// Atomic DB counters work across serverless instances and include unknown usernames.
export async function throttle(key: string, limit: number) {
  const database = db();
  const now = new Date();
  const [row] = await database
    .insert(authAttempts)
    .values({
      key: digest(key),
      count: 1,
      expiresAt: new Date(Date.now() + 15 * 60_000),
    })
    .onConflictDoUpdate({
      target: authAttempts.key,
      set: {
        count: sql`CASE WHEN ${authAttempts.expiresAt} < ${now.toISOString()}::timestamptz THEN 1 ELSE ${authAttempts.count} + 1 END`,
        expiresAt: sql`CASE WHEN ${authAttempts.expiresAt} < ${now.toISOString()}::timestamptz THEN ${new Date(Date.now() + 15 * 60_000).toISOString()}::timestamptz ELSE ${authAttempts.expiresAt} END`,
      },
    })
    .returning();
  await database
    .delete(authAttempts)
    .where(lt(authAttempts.expiresAt, new Date(Date.now() - 86400_000)));
  if (row.count > limit)
    throw new Error(
      "Too many attempts. Take a breather and try again in 15 minutes.",
    );
}
````

## src/lib/copy.ts

````
export const copy = {
  greetings: [
    "Deadlines don’t chase you. They sprint.",
    "A little progress. A lot less panic.",
    "Welcome back to your academic side quest.",
    "You bring the ambition. We’ll bring the checkboxes.",
    "Today’s forecast: scattered deadlines, improving confidence.",
    "Your future self is rooting for you.",
    "One task at a time. Capes optional.",
    "Let’s turn “oh no” into “all done”.",
  ],
  empty: [
    "No tasks. Suspicious. Enjoy it while it lasts.",
    "Nothing here. Your calendar is taking a deep breath.",
    "A rare sighting: an empty to-do list.",
    "No matches. Even deadlines need boundaries.",
    "All clear on this tiny corner of the universe.",
    "The checkboxes are on their lunch break.",
  ],
  complete: [
    "Done! Your future self just sent a thank-you note.",
    "One less thing living rent-free in your brain.",
    "Academic side quest complete.",
    "Tiny checkbox. Massive energy.",
    "You did the thing. That counts.",
    "Progress has entered the chat.",
    "A round of applause from your imaginary study audience.",
    "Deadline defeated. Hydration recommended.",
  ],
  overdue: [
    "Late isn’t the same as impossible. Start small.",
    "The deadline passed. Your ability didn’t.",
    "Deep breath. Pick one next step.",
    "A fresh start doesn’t need a Monday.",
    "You’re a person, not a productivity machine.",
    "We can work with where you are.",
  ],
  levels: [
    "Calm",
    "Mildly sweating",
    "Plot thickening",
    "Full panic",
    "Handled",
  ],
  auth: [
    "Less password drama. More deadline clarity.",
    "Your batch’s small corner of organized chaos.",
    "New here? Bring yourself. Leave the panic at the door.",
    "Pick a username your future self can remember.",
    "A password, not your entire life story.",
    "Incorrect credentials. Even keyboards have off days.",
  ],
  group: [
    "No group yet. Ask your admin to assemble your academic squad.",
    "Your group is waiting. No pressure. Okay, a little pressure.",
    "Shared task. Shared victory dance.",
    "Teamwork makes the deadline slightly less dramatic.",
    "A group checkbox is a group high-five.",
    "New group, same collective determination.",
  ],
  ui: {
  "adminSaved": "Saved. Order has been restored.",
  "signupTitle": "Join the organized chaos.",
  "loginTitle": "Hey, you made it.",
  "waiting": "One tiny moment…",
  "signupAction": "Let me in →",
  "loginAction": "Back to my panic →",
  "authFooter": "No emails. No inbox quests. Just you and your next step.",
  "heroEyebrow": "Your semester. A little more together.",
  "heroCaption": "A shared plan for your batch. A calmer head for you.",
  "heroFooter": "Less chaos. More “I’ve got this.”",
  "overdueHint": "A fresh start is allowed.",
  "todayHint": "You’ve got today.",
  "weekHint": "A little planning helps.",
  "doneHint": "Look at you go.",
  "undone": "Back on the list. Plans change.",
  "adminEyebrow": "Behind the organized chaos",
  "dashboardEyebrow": "Your semester, a little more together",
  "adminIntro": "Good systems. Happier students. Fewer “when is it due?”",
  "progressHeading": "Small steps. Real progress.",
  "editTitle": "A small change of plans.",
  "newTaskTitle": "Give that deadline a home.",
  "taskTitlePlaceholder": "The essay that won’t write itself",
  "descriptionPlaceholder": "Pages, instructions, tiny words of encouragement…",
  "taskIntro": "Dates use your device’s timezone. Future you appreciates the heads-up.",
  "groupHeading": "Assemble a study squad.",
  "participantHeading": "Welcome someone aboard.",
  "adminEmpty": "No tasks. The calm before the coursework.",
  "sidebarHint": "One deadline at a time.",
  "errorTitle": "A small plot twist."
},
  saved: "Saved. A little more organized than a minute ago.",
};
export function pick(lines: readonly string[]) {
  return lines[Math.floor(Math.random() * lines.length)];
}
````

## src/lib/data.ts

````
import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  subjects,
  groups,
  groupMembers,
  tasks,
  taskCompletions,
} from "./db/schema";
export type User = typeof users.$inferSelect;
export { visible } from "./permissions";
import { visible } from "./permissions";
export async function loadData(user: User, admin = false) {
  if (admin && user.role !== "super_admin") throw new Error("Not allowed.");
  const database = db();
  const taskRows = await database
    .select({ task: tasks, creator: users.displayName })
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.createdBy))
    .where(visible(user))
    .orderBy(tasks.dueAt);
  const ids = taskRows.map((r) => r.task.id);
  const completions = ids.length
    ? await database
        .select({
          taskId: taskCompletions.taskId,
          slot: taskCompletions.slot,
          completedAt: taskCompletions.completedAt,
          completedBy: taskCompletions.completedBy,
          name: users.displayName,
          role: users.role,
        })
        .from(taskCompletions)
        .leftJoin(users, eq(users.id, taskCompletions.completedBy))
        .where(inArray(taskCompletions.taskId, ids))
    : [];
  const [count] = await database
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "student"));
  const memberships = await database
    .select()
    .from(groupMembers)
    .where(admin ? sql`true` : eq(groupMembers.userId, user.id));
  return {
    user: {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      role: user.role,
    },
    subjects: await database.select().from(subjects),
    groups: await database
      .select()
      .from(groups)
      .where(
        admin
          ? sql`true`
          : inArray(
              groups.id,
              memberships.map((m) => m.groupId),
            ),
      ),
    memberships,
    tasks: taskRows.map(({ task, creator }) => {
      const records = completions.filter((c) => c.taskId === task.id);
      const completion = records.find(
        (c) => c.slot === (task.scope === "batch" ? user.id : "shared"),
      );
      return {
        ...task,
        creator: creator ?? "Deleted user",
        done: !!completion,
        completedAt: completion?.completedAt ?? null,
        completedBy: completion?.name ?? "Deleted user",
        doneCount: records.filter((c) => c.role === "student").length,
        studentCount: count.total,
      };
    }),
    participants: admin
      ? await database
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            role: users.role,
            createdAt: users.createdAt,
            completed: sql<number>`(select count(*)::int from task_completions where completed_by = ${users.id})`,
          })
          .from(users)
          .orderBy(users.displayName)
      : [],
  };
}
export type AppData = Awaited<ReturnType<typeof loadData>>;
````

## src/lib/db/index.ts

````
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
// Lazy connection: builds do not require production credentials.
const globalDb = globalThis as unknown as {
  panicDb?: ReturnType<typeof postgres>;
  panicPreviewDb?: ReturnType<typeof postgres>;
};
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is missing. Follow README setup.");
  // PGlite's local preview has one backend; named statements avoid multiplexing collisions.
  const localPreview =
    process.env.NODE_ENV !== "production" &&
    process.env.DATABASE_URL.includes("127.0.0.1:5439/");
  const key = localPreview ? "panicPreviewDb" : "panicDb";
  globalDb[key] ??= postgres(process.env.DATABASE_URL, {
    max: localPreview ? 1 : 3,
    idle_timeout: 20,
    prepare: localPreview,
  });
  return drizzle(globalDb[key], { schema });
}
````

## src/lib/db/schema.ts

````
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
````

## src/lib/http.ts

````
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
export function sameOrigin(req: NextRequest) {
  if (req.headers.get("origin") !== new URL(req.url).origin)
    throw new Error("Request origin is not allowed.");
}
export function failure(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Check your input." },
      { status: 400 },
    );
  const message = error instanceof Error ? error.message : "";
  const safe = [
    "Please log in.",
    "Not allowed.",
    "Task not found.",
    "Join code is incorrect.",
    "Username or password is incorrect.",
    "Too many attempts. Take a breather and try again in 15 minutes.",
    "Join a group for this subject first.",
    "Subject and scope cannot be changed.",
    "The super admin cannot be deleted.",
    "Request origin is not allowed.",
    "Group not found.",
  ];
  if (safe.includes(message))
    return NextResponse.json(
      { error: message },
      { status: message === "Please log in." ? 401 : 400 },
    );
  const cause = error as { code?: string; cause?: { code?: string } };
  if (cause.code === "23505" || cause.cause?.code === "23505")
    return NextResponse.json(
      { error: "That username or group name is already taken." },
      { status: 409 },
    );
  console.error("Request failed", {
    name: error instanceof Error ? error.name : "unknown",
    code: cause.code ?? cause.cause?.code,
  });
  return NextResponse.json(
    { error: "Something went sideways. Please retry; your work matters." },
    { status: 500 },
  );
}
````

## src/lib/permissions.ts

````
import { and, eq, or, sql } from "drizzle-orm";
import { tasks, groupMembers } from "./db/schema";
export function visible(user: { id: string; role: "student" | "super_admin" }) {
  if (user.role === "super_admin") return sql`true`;
  return or(
    and(eq(tasks.scope, "personal"), eq(tasks.createdBy, user.id)),
    eq(tasks.scope, "batch"),
    and(
      eq(tasks.scope, "group"),
      sql`exists (select 1 from ${groupMembers} where ${groupMembers.userId} = ${user.id} and ${groupMembers.groupId} = ${tasks.groupId})`,
    ),
  )!;
}
````

## src/lib/utils.ts

````
export { cn } from "cn";
````

## src/lib/validation.ts

````
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
````

## src/proxy.ts

````
import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicPath = [
    "/login",
    "/sign-up",
    "/api/auth",
    "/panic-planner-logo.png",
    "/icon.png",
  ].includes(path);
  if (!publicPath && !request.cookies.get("panic_session")?.value) {
    if (path.startsWith("/api/"))
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
````

## tsconfig.json

````
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
````
