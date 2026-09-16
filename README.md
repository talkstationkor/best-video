# Best Video — Video Review & Approval System

An internal tool for **Best Video Team** to submit videos and **TMT** to review,
give feedback, request revisions, and approve them. No login/password system —
people identify themselves by picking (or entering) their name under a Team,
and every server-side action independently re-checks what that person's Role
is actually allowed to do.

---

## 1. Stack

- **Next.js 14** (App Router, TypeScript) — one deployable app, server-rendered
  pages + API routes
- **Prisma + SQLite** for the database (swap the datasource to Postgres/MySQL
  for a shared production deployment — no application code changes needed)
- **Tailwind CSS** for styling
- No auth library, no external services besides the Google Drive links you
  paste in

## 2. Running it locally

```bash
npm install
cp .env.example .env          # uses local SQLite by default
npx prisma migrate dev --name init
npm run seed                  # loads demo members + sample projects
npm run dev
```

Open http://localhost:3000. Pick **Best Video Team** or **TMT**, then pick or
type a name. Demo members (see `prisma/seed.ts`) are: Jimmy & Maria
(Best Video Team, Submitter), Paul & Hanna (TMT, Reviewer), Sarah (TMT, Admin).
None of these names exist anywhere in application code — they're just rows in
the `Member` table, so renaming, deactivating, or adding people never requires
a code change or redeploy.

To reset the database: delete `prisma/dev.db` and re-run the two `prisma`/`seed`
commands above.

## 3. Environment variables

| Variable       | Purpose                                                        |
| -------------- | ---------------------------------------------------------------|
| `DATABASE_URL` | Prisma connection string. `file:./dev.db` for local SQLite.    |

## 4. Setting up your first Admin

The seed script creates **Sarah** as an Admin on the TMT team. In production,
run the seed once against your real database (or manually insert one Admin
row via `npx prisma studio`), sign in as that Admin, and use **Settings →
Members** to add everyone else — no other setup is required.

## 5. Google Drive links

- On submitting a project or version, paste the video's Google Drive share
  link (`drive.google.com/...` or `docs.google.com/...`).
- The server validates the URL is `https://` and on a Google Drive host
  before saving it (`src/lib/validation.ts`).
- The **Watch Video** button tries to build a Drive `/preview` embed URL from
  the link; if the link doesn't match a recognizable Drive file-ID pattern,
  it falls back to opening the link in a new tab.
- Make sure the file's Drive sharing setting allows anyone with the link (or
  your organization) to view it, or the embed/new-tab open will show a Drive
  permission error — that's a Drive-side setting, not something this app
  controls.

## 6. Architecture

```
Team ──< Member >── Role         (separate; a Member row links the two)
Project ──< ProjectVersion ──< Feedback
Project ──< Notification
Project / ProjectVersion / Member ──< ActivityLog
```

- **Team** and **Role** are never fused. `Member.team` and `Member.role` are
  independent columns; nothing in application code hardcodes a person's name
  to a permission.
- **Project vs. Version**: a Project is the ongoing unit of work; each
  submission creates a new, permanent `ProjectVersion` row (V1, V2, V3…).
  Versions are never overwritten or deleted — see `@@unique([projectId,
  versionNumber])` in `prisma/schema.prisma`.
- **No video hosting**: only the Google Drive URL is stored per version.
- **Browser "session"**: an httpOnly cookie remembers which `Member` row this
  browser last selected (`src/lib/session.ts`). This is convenience, **not
  authentication** — see the security section below.

## 7. Permission matrix

| Action                  | Submitter          | Reviewer | Admin |
| ------------------------| :----------------: | :------: | :---: |
| View Dashboard          | ✓                  | ✓        | ✓     |
| View Projects           | own team only      | all      | all   |
| Create Project          | ✓                  | ✓        | ✓     |
| Submit Version          | ✓                  | ✓        | ✓     |
| View Feedback           | ✓                  | ✓        | ✓     |
| Add Feedback            | ✗                  | ✓        | ✓     |
| Edit/Delete Feedback    | ✗                  | own only | any   |
| Resolve/Reopen Feedback | ✗                  | ✓        | ✓     |
| Request Revision        | ✗                  | ✓        | ✓     |
| Approve                 | ✗                  | ✓        | ✓     |
| Notifications           | ✓                  | ✓        | ✓     |
| Activity                | own team + own acts| all      | all   |
| Manage Members          | ✗                  | ✗        | ✓     |
| Settings                | ✗                  | ✗        | ✓     |

This table is implemented once, in **`src/lib/permissions.ts`**, and every API
route imports from it. The UI hides buttons a person can't use, but that is
cosmetic — the same rule is re-checked against the database inside the route
handler before anything is read or written.

## 8. Security notes (read this before exposing it beyond a trusted network)

- **No real authentication.** Anyone who can reach the app can claim to be
  any active Member by using the name picker. This is acceptable for an
  internal tool on a trusted network, matching the spec's explicit
  requirement to skip login/password. If this ever needs to be internet-
  facing, put real authentication (SSO/OIDC) in front of it and have it set
  the `bv_member_id` cookie after verifying identity — `src/lib/session.ts`
  is the single seam where that would plug in.
- **Server-side authorization everywhere.** Every mutating action
  (create project, submit version, add feedback, request revision, approve,
  manage members) is enforced in its API route handler using the Member row
  loaded from the database — never from a client-supplied role/team field.
  Try it yourself: sign in as a Submitter and `fetch('/api/versions/<id>/approve',
  {method:'POST'})` from devtools — you'll get a 403.
- **Input validation & sanitization**: Google Drive URLs are validated
  (`validateGoogleDriveUrl`), free text is stripped of control characters and
  length-capped (`sanitizeText`) before it's stored.
- **XSS**: React escapes all rendered text by default; this app never uses
  `dangerouslySetInnerHTML`.
- **SQL injection**: all queries go through Prisma's parameterized query
  builder — no raw SQL string concatenation anywhere.
- **CSRF**: the cookie is `sameSite: lax`, and every mutating request also
  requires knowing the specific project/version/feedback id, which is not
  something a cross-site page can infer blindly. For a fully internet-facing
  deployment, consider adding a CSRF token as an extra layer.
- **Concurrency**: submitting two versions at once can't both become "V3" —
  `ProjectVersion` has a DB-level `@@unique([projectId, versionNumber])`
  constraint, and the API route retries with the freshly-read next number if
  it loses that race (`src/app/api/projects/[id]/versions/route.ts`).
- **No deletions of history**: Versions, Feedback (once created — resolving
  is not deleting), and ActivityLog rows are never removed by normal use.
  Members are deactivated, not deleted, so their name keeps showing up
  correctly on old Projects/Activity.

## 9. Main routes / API

**Pages**
| Route                     | Purpose                                   |
|----------------------------|-------------------------------------------|
| `/`                        | "Who are you?" — choose Team              |
| `/teams/[team]`            | Pick/enter your name, enter the app       |
| `/dashboard`               | Role-aware "what do I do next" home       |
| `/projects`                | Full project list with filters            |
| `/projects/[id]`           | Project detail — the core workflow screen |
| `/notifications`           | This member's notifications                |
| `/activity`                | Full audit trail                          |
| `/settings/members`        | Admin — manage Members                    |

**API**
| Method & path                                    | Who                | What it does                          |
|---------------------------------------------------|--------------------|----------------------------------------|
| `GET /api/session`                                 | anyone with cookie | current member                        |
| `POST /api/session`                                | anyone             | select/create a member, set cookie    |
| `DELETE /api/session`                              | anyone             | "Change User" — clear cookie          |
| `GET /api/members?team=`                           | anyone             | active members for the name picker    |
| `GET /api/members?full=1`                          | Admin              | full member list for Settings         |
| `POST /api/members`                                | Admin              | create a member                       |
| `PATCH /api/members/:id`                           | Admin              | change team/role/active               |
| `GET /api/projects`                                | any member         | list, scoped + filterable             |
| `POST /api/projects`                               | Submitter/Rev/Admin| create project + auto V1              |
| `GET /api/projects/:id`                            | any member         | full project + versions + feedback    |
| `POST /api/projects/:id/versions`                  | Submitter/Rev/Admin| submit next version (server picks #)  |
| `POST /api/versions/:id/feedback`                  | Reviewer/Admin     | add feedback                          |
| `PATCH /api/feedback/:id`                          | Reviewer/Admin     | edit message / resolve / reopen       |
| `DELETE /api/feedback/:id`                         | Reviewer(own)/Admin| delete feedback                       |
| `POST /api/versions/:id/request-revision`          | Reviewer/Admin     | send current version back for revision|
| `POST /api/versions/:id/approve`                   | Reviewer/Admin     | approve current version               |
| `GET /api/notifications`                           | any member         | this member's notifications           |
| `PATCH /api/notifications`                         | any member         | mark one/all read                     |
| `GET /api/activity`                                | any member         | audit trail, scoped                   |

## 10. Testing the permission boundaries

1. Sign in as **Jimmy** (Submitter). Confirm you cannot see "+ Add Feedback",
   "Request Revision", or "Approve Video" on any project.
2. With Jimmy still selected, open devtools and run:
   ```js
   fetch('/api/versions/<a current version id>/approve', { method: 'POST' })
     .then(r => r.json()).then(console.log)
   ```
   Expect `403` and `"You don't have permission to perform this action."`.
3. Sign in as **Paul** (Reviewer). Add feedback to a version, then try
   "Request Revision" before adding feedback on a *different* version with no
   feedback yet — the button is disabled, and the API also rejects it
   directly (`400`, at least one open feedback item required).
4. Approve a version as Paul, then reload as Jimmy — the project should show
   **Approved**, with no more action buttons, and the approval should appear
   in `/activity`.
5. Sign in as **Sarah** (Admin) → Settings → Members → set Paul to Inactive.
   Reload the Best Video Team picker — Paul should disappear from the list
   for new sign-ins, while his name still shows correctly on old feedback and
   activity.
6. From two browser tabs signed in as different Submitters on the same
   project, submit a new version at nearly the same time — both should
   succeed as consecutive version numbers (e.g. V3 and V4), never a
   duplicate.

## 11. Deliberately not built (see spec §48)

Chat, analytics dashboards, billing, e-commerce, social features, and AI
features were left out on purpose to keep this a focused tool for exactly
one workflow: **submit → review → feedback → revision → resubmit → approve**.
