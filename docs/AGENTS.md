# AGENTS.md — Agent Ground Truth for SwasthyaSetu (PS 26133)

> **This is the single source of truth for any AI coding agent (Claude Code, Gemini CLI, Cursor, etc.) working in this repository.**
> `CLAUDE.md` and `GEMINI.md` at the repo root simply point here. If something in chat, a PR description, or your own memory conflicts with `/docs/*.md`, **the docs win**. If a doc is missing information you need, stop and ask — do not invent an endpoint, table, field name, or role that isn't written down here.

## 0. What this project is

A care-access and quality-monitoring platform for **SIH 2026 Internal — PS 26133**, "Accessibility and quality of public healthcare services, particularly in rural and underserved areas" (Govt. of Maharashtra). Full context: `docs/01-product-overview.md`.

Five roles only for MVP: **Patient, Frontline Health Worker, Doctor/Specialist, Facility Admin, District/State Admin.** Do not add roles that aren't in that list without updating `docs/05-auth-rbac.md` first.

## 1. Stack (do not substitute without discussion)

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript |
| Backend API | Node.js + Express, TypeScript |
| Primary relational DB | PostgreSQL via **Supabase**, accessed only through **Prisma** |
| Auth | **Supabase Auth**, mediated entirely by the backend (see rule #2) |
| Secondary DB | **MongoDB** — for flexible/high-volume/log-like data only (see `docs/03-database-schema.md` §3 for what qualifies) |
| Cache / Queues | **Redis** (cache) + **BullMQ** (background jobs: reminders, notifications, escalations, sync processing) |
| Realtime | Socket.IO (queue tokens, consultation signaling, live dashboards) |

## 2. Non-negotiable architecture rules

These are the rules the uploaded design doc got mostly right in spirit but not in enforcement. Every agent-generated file must respect them:

1. **The browser never talks to Supabase directly.** No `@supabase/supabase-js` client-side calls, no exposed anon key used for data reads/writes, no client-side Supabase Auth SDK session calls. The Next.js client calls **only** the Express backend (`/api/v1/...`). The Express backend is the only thing holding the Supabase service-role key and the only thing calling Supabase (Auth Admin API + Postgres via Prisma). See `docs/02-architecture.md` §2.
2. **Never trust `patientId`, `doctorId`, `facilityId`, `districtId`, or `role` coming from the client** — whether in the URL, body, or a JWT claim the client could have influenced. Every request is: verify Supabase JWT → look up the immutable `role` + scope (facility/district/assignment) from Postgres → authorize the specific resource → return the minimum data required. Full rules in `docs/05-auth-rbac.md`.
3. **One response envelope, everywhere.** No endpoint returns a bare array or a raw Prisma object. See `docs/04-api-specification.md` §1.
4. **Every write that can be retried (offline sync, poor connectivity, double-tap) is idempotent.** Booking, referral creation, and sync-push endpoints require an `Idempotency-Key` header. See `docs/04-api-specification.md` §2.
5. **Postgres is the system of record for anything relational, transactional, or subject to RBAC.** MongoDB is only for the collections explicitly listed in `docs/03-database-schema.md` §3 (triage sessions, audit logs, health content, consultation messages, offline sync queue, notification delivery logs). Don't put a patient's core medical record in Mongo, and don't put a rule-based triage session tree in Postgres just because it's easy.
6. **Every state-changing action on a patient record, referral, or prescription writes an audit log entry** (Mongo `audit_logs`, see `docs/03-database-schema.md`). This is a judging criterion for the PS ("accountability"), not optional polish.
7. **All PHI/PII fields are typed and validated with Zod schemas that live in `shared/validation/`** (backend) and are mirrored, not re-invented, on the frontend. Don't hand-roll validation per route.

## 3. Where things live

| Need to know... | Read |
|---|---|
| What the product does, roles, MVP phasing | `docs/01-product-overview.md` |
| System architecture, data-store rationale, auth flow, offline sync | `docs/02-architecture.md` |
| Every table/collection, its fields, relations, indexes | `docs/03-database-schema.md` |
| Every endpoint, request/response shape, error codes | `docs/04-api-specification.md` |
| Role permissions, resource-level authorization rules | `docs/05-auth-rbac.md` |
| Folder layout for frontend + backend | `docs/06-folder-structure.md` |
| Response envelope, validation, layering, git/commit conventions | `docs/07-coding-conventions.md` |
| Every environment variable, what it's for, where it's used | `docs/08-env-config.md` |

## 4. Definition of done, for any new feature

Before considering a feature/endpoint complete, an agent must have:

- [ ] Added/confirmed the DB fields it touches exist in `docs/03-database-schema.md` (updated the doc if the schema changed, in the same PR)
- [ ] Added/confirmed the endpoint contract exists in `docs/04-api-specification.md`
- [ ] Added a Zod schema in `shared/validation/` and wired it into the route
- [ ] Added the RBAC check per `docs/05-auth-rbac.md` (never "TODO: add auth later")
- [ ] Returned the standard response envelope
- [ ] Added an audit log write if the action touches a patient record, referral, prescription, or facility resource
- [ ] Added an idempotency check if the action is a create/booking type call
- [ ] Followed the module folder structure in `docs/06-folder-structure.md` (controller/service/repository split — no logic directly in route files)

## 5. Conventional commands

Adjust to whatever your actual `package.json` scripts end up being, but agents should assume this shape unless told otherwise:

```bash
# backend/
npm run dev              # ts-node-dev / nodemon backend
npx prisma migrate dev   # apply a new Postgres migration
npx prisma studio        # inspect Postgres data
npm run worker           # start BullMQ workers
npm run lint && npm run typecheck

# frontend/
npm run dev
npm run build
npm run lint && npm run typecheck
```

## 6. Deadline context

SIH internal idea-submission deadline: **20 September 2026**. Prioritize Phase 1 ("Demo-Critical") from `docs/01-product-overview.md` §3 over Phase 2/3 work unless explicitly told otherwise.
