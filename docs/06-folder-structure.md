# 06 — Folder Structure

Monorepo-style root, two top-level apps plus a shared package. This mirrors the modular-by-domain pattern (not a flat routes/controllers/models split) — one module folder per business domain, each internally layered the same way.

```
/
├── AGENTS.md
├── CLAUDE.md
├── GEMINI.md
├── README.md
├── docs/                       # this documentation set
├── frontend/                   # Next.js app
├── backend/                    # Express API
└── shared/                     # types + Zod schemas shared by both, published as a local workspace package
```

## 1. `shared/` — the contract both apps compile against

```
shared/
├── package.json                # workspace package, e.g. "@app/shared"
├── validation/                 # Zod schemas — the ONE place request/response shapes are defined
│   ├── auth.schema.ts
│   ├── patient.schema.ts
│   ├── facility.schema.ts
│   ├── triage.schema.ts
│   ├── appointment.schema.ts
│   ├── referral.schema.ts
│   ├── diagnostic.schema.ts
│   ├── medicine.schema.ts
│   ├── prescription.schema.ts
│   ├── follow-up.schema.ts
│   └── ...one file per domain in docs/03 §2
├── types/                      # types inferred from the Zod schemas (z.infer<>), plus enums mirrored from Prisma
└── constants/                  # role names, notification types, error codes — matches docs/04 §2 catalog
```

Both `frontend/` and `backend/` import from `@app/shared` — a frontend form and a backend route validator for the same endpoint use the *same* Zod schema. Don't let them drift into two hand-written versions of "what a triage answer looks like."

## 2. `backend/` — Express API

```
backend/
├── prisma/
│   ├── schema.prisma            # matches docs/03-database-schema.md §1–2 exactly
│   └── migrations/
├── src/
│   ├── app.ts                   # Express app assembly (middleware order matters — see below)
│   ├── server.ts                # HTTP + Socket.IO bootstrap
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts        # talks to Supabase Admin API
│   │   │   └── auth.repository.ts     # Prisma calls for `users` + role rows
│   │   ├── patients/
│   │   │   ├── patients.routes.ts
│   │   │   ├── patients.controller.ts
│   │   │   ├── patients.service.ts
│   │   │   ├── patients.repository.ts
│   │   │   └── patients.authorization.ts   # canAccessPatient() lives next to the module it guards
│   │   ├── facilities/
│   │   ├── triage/                    # service here also owns the rule-engine + Mongo triage_sessions repo
│   │   ├── appointments/
│   │   ├── queue/                     # emits Socket.IO events, thin — mostly delegates to appointments
│   │   ├── consultations/
│   │   ├── health-records/            # visits, documents, medical-history
│   │   ├── referrals/
│   │   ├── diagnostics/
│   │   ├── medicines/
│   │   ├── prescriptions/
│   │   ├── follow-ups/
│   │   ├── notifications/             # BullMQ producer lives here; consumers in infrastructure/workers
│   │   ├── feedback/
│   │   ├── health-content/
│   │   ├── emergencies/
│   │   ├── dashboards/                # read-only aggregation queries, per role
│   │   ├── sync/                      # offline push/pull, Mongo offline_sync_queue
│   │   ├── files/                     # Supabase Storage signed URL issuance
│   │   └── admin/                     # audit-log reads, admin user/facility management
│   │
│   ├── middleware/
│   │   ├── authenticate.ts            # verifies Supabase JWT
│   │   ├── resolveIdentity.ts         # loads users row → req.identity
│   │   ├── authorize.ts               # generic role-gate helper; resource-specific checks live in each module
│   │   ├── validate.ts                # wraps a Zod schema from shared/validation
│   │   ├── idempotency.ts             # Idempotency-Key handling, backed by Redis
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts            # maps thrown errors → the standard error envelope + code
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── prisma.ts              # Prisma client singleton
│   │   │   └── mongo.ts               # Mongo client/mongoose connection + models (audit_logs, triage_sessions, ...)
│   │   ├── redis/
│   │   │   ├── client.ts
│   │   │   └── cache.ts               # get/set/invalidate helpers matching docs/03 §4 key patterns
│   │   ├── queues/
│   │   │   ├── connection.ts          # BullMQ Redis connection
│   │   │   ├── notifications.queue.ts
│   │   │   ├── reminders.queue.ts
│   │   │   ├── escalations.queue.ts
│   │   │   ├── sync-reconcile.queue.ts
│   │   │   └── workers/               # one worker file per queue, run via `npm run worker`
│   │   ├── storage/
│   │   │   └── supabaseStorage.ts     # signed URL issuance only, never public bucket access
│   │   ├── realtime/
│   │   │   └── socket.ts              # Socket.IO server + Redis adapter setup, auth on handshake
│   │   └── logging/
│   │       └── logger.ts
│   │
│   └── shared-internal/               # backend-only helpers that don't belong in the cross-app `shared/` package
│       ├── errors/                    # AppError, ForbiddenError, NotFoundError, etc.
│       └── utils/
│
├── .env.example                       # see docs/08-env-config.md
└── package.json
```

**Middleware order in `app.ts` matters and should not vary per route:** `helmet → cors → rateLimit → json-parser → authenticate → resolveIdentity → [route-specific: authorize → validate] → controller → errorHandler (last)`.

## 3. `frontend/` — Next.js (App Router)

```
frontend/
├── app/
│   ├── (public)/                      # facility search, health content — no auth required
│   ├── (auth)/
│   │   ├── register/
│   │   └── verify-otp/
│   ├── (patient)/
│   │   ├── dashboard/
│   │   ├── appointments/
│   │   ├── triage/
│   │   ├── referrals/
│   │   ├── records/
│   │   └── consultations/[id]/
│   ├── (health-worker)/
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── triage/
│   │   └── follow-ups/
│   ├── (doctor)/
│   │   ├── dashboard/
│   │   ├── appointments/
│   │   └── consultations/[id]/
│   ├── (facility-admin)/
│   │   ├── dashboard/
│   │   ├── resources/
│   │   └── feedback/
│   ├── (district-admin)/
│   │   ├── dashboard/
│   │   └── audit/
│   └── api/                           # Next.js Route Handlers — the ONLY layer allowed to hold the session
│       └── v1/[...proxy]/route.ts     # thin proxy: cookie → Bearer header → backend, or per-route handlers
│
├── components/
│   ├── ui/                            # shadcn/ui primitives
│   └── domain/                        # patient-card, referral-timeline, queue-token, triage-flow, etc.
├── lib/
│   ├── api-client.ts                  # typed fetch wrapper hitting /api/v1/* (never the Express URL directly)
│   ├── auth/                          # session cookie helpers, server-side only
│   └── socket.ts                      # Socket.IO client, connects with the session-derived token
├── hooks/
├── middleware.ts                      # Next.js middleware: route protection by role, redirect unauthenticated
├── messages/                          # i18n bundles — en.json / hi.json / mr.json
├── .env.example
└── package.json
```

**Rule:** nothing under `app/` ever imports `@supabase/supabase-js` or references a Supabase URL/key. The only Supabase awareness on the frontend side is indirect, through whatever session cookie the `app/api/v1` proxy layer manages.

## 4. Where a new feature's files go — quick check

Adding a new domain capability (say, "vaccination schedule tracking")? It gets:
1. A Zod schema in `shared/validation/vaccination.schema.ts`
2. A Prisma model in `backend/prisma/schema.prisma`, documented in `docs/03-database-schema.md` first
3. A new `backend/src/modules/vaccinations/` folder, same four-file layout as every other module
4. Route entries in `docs/04-api-specification.md` before or alongside the code
5. RBAC rules added to `docs/05-auth-rbac.md` §2–3
6. Frontend routes under the relevant role group in `app/`, using `lib/api-client.ts`

If a change doesn't fit this checklist, it's a sign the change needs a docs update first, not a signal to skip the checklist.
