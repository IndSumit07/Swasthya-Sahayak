# 05 — Auth & RBAC

## 1. Auth sequence (server-mediated, httpOnly cookie)

> **Implemented as of 2026-08-30** — Express `/api/v1/auth/*` routes own all Supabase interactions.  
> The client browser **never sees a raw JWT**; it only holds two `httpOnly; SameSite=Lax` cookies:  
> `ss_access_token` (1h) and `ss_refresh_token` (30d), set exclusively by Express.

```
Registration (email/Google):
  Browser → POST /api/v1/auth/register
    → Express (auth.service.ts): supabaseAdmin.auth.admin.createUser()
    → Express (Prisma): INSERT INTO users, INSERT INTO registration_progress
    ← Express: 201 { userId, role, message }
    ← Supabase sends verification email with magic link

Email verification:
  User clicks email link → Supabase redirects → GET /api/auth/callback?code=...
    → Next.js route handler → GET /api/v1/auth/callback?code=...
    → Express: supabaseAdmin.auth.exchangeCodeForSession(code)
    → Express: UPDATE registration_progress SET current_step = 'EMAIL_VERIFIED'
    ← Express: Set-Cookie: ss_access_token=...; ss_refresh_token=...; HttpOnly; SameSite=Lax
    ← Next.js forwards cookies → redirects browser to /register/complete

Multi-step profile completion:
  Browser → PATCH /api/v1/profile/patient/step/1 (cookie forwarded automatically)
    → Express: authenticate (cookie → supabaseAdmin.auth.getUser)
    → Express: resolveIdentity (SELECT role FROM users)
    → Express (Prisma): UPSERT patients, UPDATE registration_progress
    ← Express: 200 { patient }
  Browser → PATCH /api/v1/profile/patient/step/2
    → Express: UPSERT medical_histories, UPDATE registration_progress step = COMPLETE
    ← Express: 200 { medicalHistory }

Login (email + password):
  Browser → POST /api/v1/auth/login
    → Express: supabaseAdmin.auth.signInWithPassword(email, password)
    → Express: SELECT role, status FROM users  ← role is ALWAYS from our table
    ← Express: Set-Cookie: ss_access_token=...; ss_refresh_token=...; HttpOnly
    ← Express: 200 { userId, role }

Every subsequent authenticated request:
  Browser → any protected Express route (cookie forwarded by browser)
    → authenticate middleware: read ss_access_token cookie
    → supabaseAdmin.auth.getUser(token) — verify token server-side
    → resolveIdentity middleware: SELECT role, status FROM users WHERE id = <verified sub>
    → authorize(...roles): check req.identity.role

Google OAuth:
  Browser → GET /api/v1/auth/google → Express returns { url }
  Browser → window.location = url (Supabase Google OAuth)
  Google → Supabase → GET /api/auth/callback?code=... (same flow as email verify above)

Logout:
  Browser → POST /api/v1/auth/logout
    → Express: supabaseAdmin.auth.admin.signOut(access_token)
    ← Express: res.clearCookie('ss_access_token'); res.clearCookie('ss_refresh_token')
```

**Facility Admin / Doctor / Health Worker accounts are provisioned by a District Admin or an existing Facility Admin** (not open self-registration) — `role` for these is set once by the provisioning admin and is never client-editable afterward. Patient self-registration is the only open-signup path.

## 2. Role → default capability matrix

| Capability | Patient | Health Worker | Doctor | Facility Admin | District Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Register self | ✅ | — | — | — | — |
| Register a patient (assisted) | — | ✅ | — | — | — |
| View own record | ✅ | — | — | — | — |
| View a patient's record | — | if registered-by/facility-linked | if active care relationship or consent | summary only, facility-linked | aggregated/anonymized only |
| Run triage | ✅ (self) | ✅ (assisted) | — | — | — |
| Book/manage appointment | ✅ (self) | ✅ (assisted) | update status only | facility-scoped view | — |
| Conduct consultation | — | assist only | ✅ | — | — |
| Create referral | — | ✅ | ✅ | — | — |
| Accept/reject referral | — | — | ✅ (to-facility) | ✅ (to-facility) | — |
| Manage facility resources (beds/medicines/doctors) | — | — | — | ✅ (own facility) | — |
| View facility dashboard | — | — | — | ✅ (own) | ✅ (any in district) |
| View district dashboard | — | — | — | — | ✅ |
| Read audit logs | — | — | — | — | ✅ |
| Manage users/facilities (admin) | — | — | — | — | ✅ |

This table is the source of truth for which routes need which role in `docs/04-api-specification.md`. If a route's role list there and this table disagree, this table wins and the API doc is out of date — fix the API doc.

## 3. Resource-level authorization (role membership alone is not enough)

Role gets you past the door; these checks decide whether you can touch a *specific* record. Implement each as a small, named, reusable authorization function — do not inline ad hoc checks per route.

### `canAccessPatient(actor, patientId)`
- `actor.role === PATIENT` → `actor.patientId === patientId`
- `actor.role === HEALTH_WORKER` → `patient.registeredById === actor.healthWorkerId` **OR** patient has an open `Referral`/`FollowUp`/`Appointment` assigned to actor's facility
- `actor.role === DOCTOR` → an `Appointment`, `Consultation`, or `Referral` exists linking this doctor to this patient, **OR** an active `Consent` row grants this doctor access
- `actor.role === FACILITY_ADMIN` → patient has a `Visit`/`Appointment` at actor's facility — **summary shape only**, never full medical history
- `actor.role === DISTRICT_ADMIN` → never grants row-level patient access; district admins only see aggregated dashboard queries, not individual patient records, unless a specific compliance flow says otherwise (not in MVP scope)

### `canAccessFacility(actor, facilityId, action)`
- Reads: any authenticated user (facility directory is public-ish within the app)
- Writes (resources, doctors, beds, medicines): `actor.role === FACILITY_ADMIN AND actor.facilityId === facilityId`, or `DISTRICT_ADMIN` for admin-level facility CRUD

### `canActOnReferral(actor, referral, action)`
- `create`: `HEALTH_WORKER` or `DOCTOR` at `referral.fromFacilityId`
- `accept/reject`: `DOCTOR` or `FACILITY_ADMIN` at `referral.toFacilityId`
- `complete`: same as accept, **and** a `Visit` record must already exist for this patient at `toFacilityId` (see API doc §11)
- `view`: the referred patient (self), staff at `fromFacilityId` or `toFacilityId`

### `canAccessDiagnosticResult` / `canAccessPrescription`
- Same shape as `canAccessPatient` — these are effectively sub-resources of a patient record and should delegate to the same check rather than reimplementing it.

## 4. Consent model (FR-25)

Default care relationships (an active appointment, referral, or consultation) grant a doctor access **without** an explicit consent row — that's normal clinical workflow. Explicit `Consent` rows exist for the exception case: a doctor who wants to review a patient's full history **outside** an active relationship (e.g., a specialist reviewing history before a scheduled referral appointment). `CONSENT_REQUIRED` is only returned when no default relationship exists and no active consent has been granted.

## 5. Session & token handling

- Access token lifetime: short (Supabase default, ~1h) — refreshed via the httpOnly refresh-token cookie against `/auth/refresh`.
- Next.js middleware refreshes proactively on SSR requests when the access token is near expiry, so users don't hit a hard 401 mid-session.
- Logout clears both cookies **and** revokes the Supabase session server-side (don't just clear the cookie client-side).
- Rate-limit `/auth/verify-otp` and `/auth/resend-otp` per phone number (Redis, see `docs/03-database-schema.md` §4) to prevent OTP-bombing.

## 6. What "never trust the client" looks like in code (pattern, not literal implementation)

```ts
// BAD — trusts the client's claim about who they are acting as
router.get('/patients/:patientId', async (req, res) => {
  const patient = await prisma.patient.findUnique({ where: { id: req.params.patientId } });
  res.json({ success: true, data: patient });
});

// GOOD — role resolved from verified identity, resource check before any data leaves the DB
router.get('/patients/:patientId', authenticate, resolveIdentity, async (req, res, next) => {
  try {
    await canAccessPatient(req.identity, req.params.patientId); // throws ForbiddenError / NotFoundError
    const patient = await patientService.getForActor(req.identity, req.params.patientId);
    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
});
```
