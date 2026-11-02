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
