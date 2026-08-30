# 07 — Coding Conventions

## 1. Layering discipline (backend)

`routes → controller → service → repository`. Never skip a layer.

- **Routes**: wiring only — `router.post('/', authenticate, resolveIdentity, validate(schema), controller.create)`. No logic.
- **Controller**: extracts `req.identity`/`req.body`, calls one service method, shapes the envelope, calls `next(err)` on failure. No Prisma/Mongo calls here.
- **Service**: business logic, orchestrates repositories, runs authorization checks (`docs/05-auth-rbac.md` §3), writes audit logs, enqueues BullMQ jobs, wraps multi-step writes in a Prisma transaction.
- **Repository**: the only place `prisma.*` or Mongo model calls happen for that module. Keeps a future "swap the ORM" or "add a read replica" change contained.

Never call `prisma` directly from a controller or route file — if it's tempting because "it's just one query," it still goes in the repository.

## 2. Response envelope — enforce it, don't just document it

Use a single response helper so it's structurally impossible to forget the envelope:

```ts
// shared-internal/utils/respond.ts
export const ok = (res: Response, data: unknown, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });

export const okList = (res: Response, data: unknown[], pagination: Pagination) =>
  res.status(200).json({ success: true, data, pagination });
```

Errors are never `res.json`'d directly from a controller — throw a typed error (`ForbiddenError`, `NotFoundError`, `ValidationError`, `ConflictError`) and let the single `errorHandler` middleware (last in the chain) map it to the error envelope + code from `docs/04-api-specification.md` §2.

## 3. Validation

- Every route with a body/query gets a Zod schema from `shared/validation/`, applied via the `validate(schema)` middleware — never manual `if (!req.body.x) throw ...` checks scattered in controllers.
- Schemas are the single source of truth for a shape — the frontend form and the backend route import the *same* schema from `@app/shared`, they don't each redefine it.
- Parse, don't just validate: `validate()` should replace `req.body` with the **parsed** (and thus typed) result, so downstream code isn't re-trusting raw JSON.

## 4. Error handling

```ts
// shared-internal/errors/AppError.ts
export class AppError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}
export class ForbiddenError extends AppError { constructor(msg = 'Not authorized') { super('FORBIDDEN', msg, 403); } }
export class NotFoundError extends AppError { constructor(msg = 'Not found') { super('NOT_FOUND', msg, 404); } }
// ...one per code in docs/04-api-specification.md §2
```
`NotFoundError` and `ForbiddenError` for a resource the caller shouldn't even know exists should both resolve to the same externally-visible `NOT_FOUND` — don't let a 403 leak that a record exists when the caller has no relationship to it (this matters for the patient-search endpoints specifically).

## 5. Naming

- Postgres tables: `snake_case`, plural. Prisma models: `PascalCase`, singular. Mongo collections: `snake_case`, plural.
- REST paths: `kebab-case` where multi-word (`diagnostic-orders`, not `diagnosticOrders`).
- Booleans read as assertions: `isActive`, `isBooked`, `isRead` — not `active`, `booked`, `status_flag`.
- Enums (both Prisma and Zod) use `SCREAMING_SNAKE_CASE` values, matching `docs/03-database-schema.md` §1 exactly — don't invent a new casing convention in a Zod schema for the same field.

## 6. Audit logging

Any service method that creates/updates a `Patient`, `Visit`, `Prescription`, `Referral`, `DiagnosticResult`, or grants/revokes a `Consent` writes to Mongo `audit_logs` (schema in `docs/03-database-schema.md` §3.2) in the same service call — not as an afterthought middleware that tries to guess intent from the HTTP method. Put the audit write at the end of the service method, after the DB write succeeds, inside the same try block so a failed audit write doesn't silently pass but also doesn't roll back a successful clinical write — log and continue, alert separately.

## 7. Transactions

Any operation touching more than one Postgres table that must succeed or fail together (booking: slot lock + appointment create + notification row; referral accept: status event + appointment create) uses `prisma.$transaction(...)`. Don't do sequential awaits with no rollback path for anything involving `AppointmentSlot.isBooked` or referral status.

## 8. Frontend conventions

- Server Components fetch through the same `lib/api-client.ts` used by client components — one typed client, not duplicated fetch logic per page.
- Forms validate client-side with the same Zod schema the backend uses (from `@app/shared`), for instant feedback, but the backend re-validates regardless — client validation is UX, not security.
- i18n: no hardcoded English strings in components under `app/`; pull from `messages/{locale}.json`. `preferred_lang` from the user's profile (`en`/`hi`/`mr`) drives the initial locale.
- Design system: dark theme by default, Inter/Geist Mono typography, shadcn/ui components, Framer Motion for transitions — keep consistent with existing project conventions rather than introducing a second UI kit.

## 9. Git conventions

- Branches: `feat/<module>-<short-desc>`, `fix/<module>-<short-desc>`, `docs/<what>`.
- Commits: Conventional Commits — `feat(referrals): add completion-requires-visit check`, `fix(appointments): close double-booking race`, `docs(schema): add facility_diagnostics table`.
- A PR that adds/changes an endpoint, table, or role rule updates the relevant `docs/*.md` file **in the same PR** — docs lagging code is exactly the drift `AGENTS.md` exists to prevent.

## 10. Testing (keep it proportionate for a hackathon MVP, but don't skip these)

- Unit tests for every `*.authorization.ts` function (§ in `docs/05-auth-rbac.md`) — these are the highest-cost-of-bug code in the system.
- Integration test for the appointment-booking race condition (two concurrent bookings for the same slot → exactly one succeeds).
- Integration test for referral completion being blocked without a recorded `Visit`.
