# 02 — Architecture

## 1. System diagram

```
                         BROWSER / MOBILE (PWA)
              ┌───────────────┬───────────────┬───────────────┐
              │  Patient App  │ Health Worker  │ Doctor / Admin │
              │  (Next.js)    │  App (Next.js) │ Portal (Next.js)│
              └───────┬───────┴───────┬────────┴───────┬────────┘
                      │               │                │
                      │      HTTPS, browser holds only an      
                      │      httpOnly session cookie — NO      
                      │      Supabase keys ever reach the browser
                      ▼               ▼                ▼
              ┌─────────────────────────────────────────────┐
              │        NEXT.JS SERVER (Route Handlers)       │
              │   Thin BFF layer: forwards cookie→ Bearer     │
              │   token, proxies to Express, does SSR fetches │
              └───────────────────────┬───────────────────────┘
                                       │ internal network / service-to-service
                                       ▼
              ┌─────────────────────────────────────────────┐
              │            EXPRESS API  (/api/v1)             │
              │  auth → rbac → validate → controller → service│
              └───┬───────────┬───────────┬───────────┬──────┘
                  │           │           │           │
                  ▼           ▼           ▼           ▼
           ┌───────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
           │ Supabase  │ │ Postgres│ │ MongoDB │ │  Redis   │
           │   Auth    │ │ (Prisma)│ │(mongoose)│ │+ BullMQ  │
           │ Admin API │ │         │ │         │ │  queues  │
           └───────────┘ └─────────┘ └─────────┘ └────┬─────┘
                                                        ▼
                                              ┌─────────────────┐
                                              │  Workers: SMS /  │
                                              │  Push / Reminders│
                                              │  / Sync processor│
                                              └─────────────────┘

           Object storage (Supabase Storage, private buckets) sits
           behind the Express API too — clients get short-lived
           signed URLs, never direct bucket access.
```

Socket.IO runs alongside the Express HTTP server, authenticated the same way (JWT on connection handshake), for: live queue-token updates, consultation signaling/chat, and district/facility dashboard live counters.

## 2. Why "client only calls server APIs" — and how auth still works

The browser must never hold a Supabase anon key that's used for real data access, and never runs `supabase.auth.signInWithOtp()` or any Supabase client SDK call itself. Two ways this gets violated by default in most Supabase tutorials, and how this project avoids them:

1. **Data access:** All Postgres reads/writes go through Prisma inside the Express backend. The frontend has zero awareness that Postgres or Supabase exists — it only knows about `/api/v1/*`.
2. **Auth:** Supabase Auth is still the identity provider, but it's driven **server-side** using the Supabase service-role key against Supabase's Auth Admin / GoTrue REST endpoints:
   - `POST /api/v1/auth/register` → backend calls Supabase Admin `createUser` (or `signUp` via the service client), creates the matching `public.users` row with `role`.
   - `POST /api/v1/auth/verify-otp` → backend verifies the OTP against Supabase Auth on the user's behalf, receives the Supabase session (access + refresh token), and **sets it as an httpOnly, Secure, SameSite=Lax cookie** on the response. The browser never sees the raw JWT in JS-readable storage.
   - Every subsequent request: Next.js route handler reads the cookie server-side and attaches it as `Authorization: Bearer <token>` when calling Express. Express verifies it with `supabase.auth.getUser(token)` (or local JWT verification against Supabase's JWKS) on every request — no session state trusted from anywhere else.
   - `POST /api/v1/auth/refresh` → backend exchanges the refresh token (also in an httpOnly cookie) for a new access token via Supabase, rotates the cookie.
3. Google Auth: use Supabase's OAuth **server-side flow** (Authorization Code, not the implicit/browser popup flow) — the callback lands on an Express/Next.js route, not directly in client JS.

This is more plumbing than the default Supabase browser-SDK pattern, but it's what "client never talks to Supabase" actually requires — don't shortcut it by putting the anon key in the frontend for "just auth."

## 3. Why three data stores (rationale, not just preference)

| Store | Use for | Why not the others |
|---|---|---|
| **PostgreSQL (Supabase, via Prisma)** | Users, patients, facilities, appointments, referrals, prescriptions, diagnostics metadata, medicines, follow-ups, feedback/grievances, consents, notification records | This is where RBAC, foreign-key integrity, and multi-table transactions matter (e.g., "referral accepted" must atomically update referral status + create an appointment + write a notification row). Mongo doesn't give you that without hand-rolled two-phase logic; don't use it here just because "healthcare data is complex." |
| **MongoDB** | `triage_sessions`, `audit_logs`, `health_content`, `consultation_messages`, `offline_sync_queue`, `notification_delivery_logs` — see `docs/03-database-schema.md` §3 for exact shapes | These are either (a) append-only/event-like with no relational integrity requirement (audit logs, delivery logs), (b) genuinely variable-shape documents (a triage session's symptom tree depends on which rule-engine branch fired; multilingual CMS content blocks vary by content type), or (c) high write-volume from many low-connectivity devices where you want schema flexibility during sync (offline queue). **Do not** default core patient/clinical records here — that would fragment the very "continuity of information" the PS asks you to fix. |
| **Redis** | Cache (facility/medicine/bed availability reads, nearby-facility search results, doctor availability — all short-TTL, invalidated on write) + BullMQ queues (reminders, notification dispatch, escalation fan-out, offline-sync processing) + Socket.IO adapter for multi-instance pub/sub | Not a system of record for anything — losing Redis should degrade performance, never lose data. |

## 4. Request lifecycle (every protected endpoint)

```
1. Next.js route handler reads httpOnly session cookie
2. Forwards request to Express with Authorization: Bearer <token>
3. Express `authenticate` middleware verifies JWT against Supabase, extracts supabase user id
4. Express `resolveIdentity` middleware loads the matching public.users row (role, status) from Postgres —
   this is the ONLY source of truth for role, never a client-supplied field
5. Express `authorize(resource)` middleware checks role + resource scope
   (facility assignment / patient consent / referral involvement) per docs/05-auth-rbac.md
6. Zod validation middleware validates the request body/query against the shared schema
7. Controller → Service → Prisma/Mongo repository
8. Service writes an audit_logs entry if the action is state-changing on a protected resource
9. Response wrapped in the standard envelope (docs/04-api-specification.md §1)
```

## 5. Offline / low-connectivity strategy (Phase 1 does the minimum; Phase 3 completes it)

- **Phase 1:** the frontend queues failed writes (appointment/triage/visit creation) in IndexedDB with a client-generated UUID and an `Idempotency-Key`. On reconnect, it POSTs them one by one to the normal endpoints — the idempotency key prevents duplicates if a request had actually succeeded before the connection dropped.
- **Phase 3:** a dedicated `/api/v1/sync/push` batch endpoint (see API spec) accepts a batch of queued changes from a health-worker device, writes them to the Mongo `offline_sync_queue` collection first (fast, schema-flexible ack), and a BullMQ worker reconciles each into Postgres, using `(entity, localId)` to detect and merge conflicts via last-write-wins + version number, per FR-63 in the original spec.

## 6. Non-functional requirements worth encoding in code, not just this doc

- **Never return more fields than the requesting role needs** — e.g., a health worker searching patients gets name/phone/village, not full medical history, until they open a specific assigned patient.
- **Rate-limit** OTP endpoints and patient-search endpoints specifically (both are abuse vectors in a system with phone-number-based lookup).
- **All timestamps stored and returned in UTC ISO-8601**; locale/timezone formatting happens on the frontend.
- **All user-facing strings that aren't data** (labels, notification templates) are looked up by key + `language` — never hardcoded English with a TODO to translate later.
