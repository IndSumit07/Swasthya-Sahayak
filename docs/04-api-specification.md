# 04 — API Specification

Base URL: `/api/v1`. Every request except `/auth/*` requires `Authorization: Bearer <supabase access token>` (attached server-side by the Next.js BFF, per `docs/02-architecture.md` §2).

## 1. Response envelope (every endpoint, no exceptions)

**Success (single resource):**
```json
{ "success": true, "message": "Appointment booked successfully", "data": { } }
```

**Success (list):**
```json
{
  "success": true,
  "data": [ ],
  "pagination": { "page": 1, "limit": 20, "total": 125, "totalPages": 7 }
}
```

**Error:**
```json
{ "success": false, "message": "Appointment slot is no longer available", "error": { "code": "SLOT_UNAVAILABLE" } }
```

## 2. Cross-cutting conventions

- **Pagination:** `?page=1&limit=20` (default 20, max 100) on all list endpoints.
- **Idempotency:** `Idempotency-Key: <client-generated-uuid>` header is **required** on: `POST /appointments`, `POST /referrals`, `POST /triage/sessions`, `POST /diagnostic-orders`, `POST /sync/push`, `POST /emergencies`. Server stores the key with the response for 24h; a repeat request with the same key returns the original response instead of creating a duplicate.
- **Never resolve identity from the request body.** `patientId`/`doctorId`/`facilityId` in a body are only ever used after the server has independently verified the caller is authorized to act on that id — see `docs/05-auth-rbac.md`. A body-supplied `role` field is always ignored.
- **Field-level minimization:** endpoints returning `Patient` objects have a "full" shape (own record, assigned doctor, assigned health worker) and a "summary" shape (search results: name, age band, village, phone-last-4) — never return full medical history from a search endpoint.
- **Error code catalog (partial — extend, don't rename):**

| Code | Meaning |
|---|---|
| `UNAUTHENTICATED` | Missing/invalid/expired token |
| `FORBIDDEN` | Authenticated but not authorized for this resource |
| `NOT_FOUND` | Resource doesn't exist or caller can't see it (same code either way — don't leak existence) |
| `VALIDATION_ERROR` | Zod validation failed; `error.details` has field-level messages |
| `SLOT_UNAVAILABLE` | Appointment slot race-lost |
| `DUPLICATE_REQUEST` | Idempotency key reused with a different payload |
| `CONSENT_REQUIRED` | Access blocked pending patient consent |
| `RATE_LIMITED` | Too many requests |
| `CONFLICT` | e.g. sync conflict, duplicate patient match |

## 3. Auth

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Mobile/email/Google. Creates Supabase auth user + `users` row + role-specific row. |
| POST | `/auth/verify-otp` | Sets httpOnly session cookie via the BFF response. |
| POST | `/auth/resend-otp` | Rate-limited per phone. |
| POST | `/auth/login` | Existing users (password or magic-link flows if enabled). |
| POST | `/auth/refresh` | Rotates session cookie using the refresh token cookie. |
| POST | `/auth/logout` | Clears cookies, revokes Supabase session. |
| GET | `/auth/me` | Returns the caller's `User` + role-specific profile. |

## 4. Users & profile

| Method | Path | Roles |
|---|---|---|
| GET/PATCH | `/users/me/profile` | Any — self only. (Not `/users/:id` — nobody edits another user's profile through this route.) |
| PATCH | `/users/me/language` | Any |
| GET/POST | `/users/me/consents` | Patient |
| DELETE | `/users/me/consents/:consentId` | Patient (revoke) |
| GET | `/doctors` | Any authenticated — filter `?facilityId=&specialty=` |
| GET | `/doctors/:doctorId/availability?date=` | Any authenticated |

## 5. Patients

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/patients` | Patient (self), Health Worker (assisted, FR-03) | Health worker requests carry `registeredById` derived from their token, never client-supplied. |
| GET | `/patients/me` | Patient | Full own record. |
| GET | `/patients/:patientId` | Health Worker (if registered-by/facility-linked), Doctor (if active care relationship or consent), Facility Admin (facility-linked, summary only) | 403 if no relationship exists — see RBAC doc. |
| PATCH | `/patients/:patientId` | Patient (self), Health Worker (assisted) | |
| GET | `/patients/:patientId/summary` | Doctor, Health Worker | Dashboard-card shape. |
| GET | `/patients/:patientId/history` | Doctor (consult context), Patient (self) | Visits + prescriptions + diagnostics timeline. |
| GET | `/patients/search?phone=\|name=\|patientId=` | Health Worker, Doctor (facility-scoped) | Returns **summary** shape only, max 20 results, rate-limited. |

## 6. Facilities & resources

| Method | Path | Roles |
|---|---|---|
| GET | `/facilities?district=&type=&service=` | Any |
| GET | `/facilities/nearby?lat=&lng=&radius=&service=` | Any — Redis-cached |
| GET | `/facilities/:facilityId` | Any |
| GET | `/facilities/:facilityId/services` | Any |
| GET | `/facilities/:facilityId/doctors` | Any |
| GET | `/facilities/:facilityId/availability` | Any — beds/medicines/diagnostics rollup, cached |
| POST/PATCH | `/facilities` / `/facilities/:facilityId` | District Admin (create), Facility Admin (own facility update) |
| PATCH | `/facilities/:facilityId/beds` | Facility Admin |
| POST/PATCH | `/facilities/:facilityId/services` | Facility Admin |
| POST/PATCH | `/facilities/:facilityId/doctors` | Facility Admin |
| PATCH | `/doctors/:doctorId/availability` | Doctor (self), Facility Admin (their facility's doctors) |

## 7. Digital triage

| Method | Path | Roles |
|---|---|---|
| POST | `/triage/sessions` | Patient (self), Health Worker (on behalf of a patient) — requires `Idempotency-Key` |
| POST | `/triage/sessions/:sessionId/answers` | Same as above, session owner only |
| POST | `/triage/sessions/:sessionId/assess` | Runs rule engine, writes `RiskAssessment` + (if HIGH/CRITICAL) creates `Emergency` and enqueues `escalations` job |
| GET | `/triage/sessions/:sessionId` | Session owner, assigned doctor |
| POST | `/triage/sessions/:sessionId/complete` | Session owner |

Response of `assess`:
```json
{ "riskLevel": "HIGH", "recommendedAction": "DOCTOR_CONSULTATION", "recommendedFacility": { "id": "...", "name": "..." }, "emergency": false }
```

## 8. Appointments & queue

| Method | Path | Roles |
|---|---|---|
| GET | `/appointments/slots?doctorId=&date=` | Any |
| POST | `/appointments` | Patient (self), Health Worker (assisted) — **requires `Idempotency-Key`**; server re-checks `AppointmentSlot.isBooked` inside a transaction, returns `SLOT_UNAVAILABLE` on race loss |
| GET | `/appointments/:id` | Patient (own), Doctor (theirs), Facility Admin (facility) |
| PATCH | `/appointments/:id` | Owner/assigned doctor/facility admin |
| POST | `/appointments/:id/cancel` \| `/reschedule` | Same |
| GET | `/patients/me/appointments` \| `/doctors/me/appointments` \| `/facilities/:id/appointments` | Role-scoped self endpoints, not generic `?patientId=` query params |
| GET | `/facilities/:facilityId/queue` | Facility Admin, Health Worker |
| GET | `/appointments/:id/queue-position` | Patient (own) |
| POST | `/facilities/:facilityId/queue/:tokenId/check-in` \| `/call-next` \| `/complete` \| `/skip` | Facility Admin, Health Worker — emits Socket.IO `queue:updated` |

## 9. Teleconsultation

| Method | Path | Roles |
|---|---|---|
| POST | `/consultations` | Health Worker (assisted), Doctor, from a confirmed `Appointment` |
| GET | `/consultations/:id` | Patient, Doctor, assisting Health Worker |
| POST | `/consultations/:id/start` \| `/end` \| `/cancel` | Doctor, assisting Health Worker |
| GET | `/consultations/:id/messages` | Participants — proxies Mongo `consultation_messages`, paginated |
| POST | `/consultations/:id/notes` | Doctor only — writes `ConsultationNote` |
| GET | `/patients/me/consultations` \| `/doctors/me/consultations` | Role-scoped |

## 10. Health records

| Method | Path | Roles |
|---|---|---|
| GET | `/patients/:patientId/health-record` | Patient (self), Doctor (relationship/consent) | Aggregated: history + recent visits + prescriptions + diagnostics |
| GET/POST | `/patients/:patientId/visits` | GET: same as above. POST: Doctor/Health Worker during/after a consultation |
| GET/PATCH | `/patients/:patientId/medical-history` | Doctor (update), Patient (self, view) |
| GET/POST | `/patients/:patientId/documents` | POST: authorized uploader gets a signed upload URL via `/files/upload` first, then registers metadata here |

## 11. Referrals

| Method | Path | Roles |
|---|---|---|
| POST | `/referrals` | Doctor, Health Worker — **requires `Idempotency-Key`** |
| GET | `/referrals/:id` | Involved patient, from/to facility staff |
| GET | `/referrals/:id/tracking` | Same — returns `ReferralStatusEvent[]` timeline |
| PATCH | `/referrals/:id` | Creator (before acceptance) |
| POST | `/referrals/:id/accept` \| `/reject` | To-facility Doctor/Facility Admin — writes `ReferralStatusEvent`, on accept optionally chains a `POST /appointments` |
| POST | `/referrals/:id/complete` | To-facility staff **only after** a `Visit` is recorded for that patient at that facility (enforced server-side per FR-30, not just a status flip) |
| POST | `/referrals/:id/cancel` | Creator, District Admin |
| GET | `/patients/me/referrals` \| `/facilities/:id/referrals` | Role-scoped |

## 12. Diagnostics

| Method | Path | Roles |
|---|---|---|
| GET | `/diagnostics/availability?test=&district=` | Any — "nearest facility with test X" search, cached |
| POST | `/diagnostic-orders` | Doctor — requires `Idempotency-Key` |
| GET | `/diagnostic-orders/:id` | Ordering doctor, patient, lab staff at target facility |
| PATCH | `/diagnostic-orders/:id` | Lab staff (status transitions) |
| POST | `/diagnostic-orders/:id/results` | Lab staff/Facility Admin — registers `DiagnosticResult` (file via `/files/upload` first) |
| GET | `/patients/me/diagnostic-results` \| `/patients/:id/diagnostic-results` | Patient (self), Doctor (relationship) |

## 13. Medicines

| Method | Path | Roles |
|---|---|---|
| GET | `/medicine-availability?medicine=&district=` | Any — cross-facility search, cached, **never returns exact quantity**, only `AVAILABLE \| LOW_STOCK \| OUT_OF_STOCK` |
| GET | `/facilities/:facilityId/medicines` | Any (public availability list) |
| POST/PATCH/DELETE | `/facilities/:facilityId/medicines/:medicineId` | Facility Admin — exact quantities visible only here and on the facility's own dashboard |

## 14. Prescriptions

| Method | Path | Roles |
|---|---|---|
| POST | `/prescriptions` | Doctor |
| GET | `/prescriptions/:id` | Patient (own), prescribing doctor, pharmacy facility (if shared, FR-40) |
| GET | `/patients/me/prescriptions` \| `/patients/:id/prescriptions` | Patient (self), Doctor (relationship) |
| GET | `/consultations/:id/prescription` | Participants |

## 15. Follow-ups & risk

| Method | Path | Roles |
|---|---|---|
| POST | `/follow-ups` | Doctor, Health Worker |
| GET | `/follow-ups/:id` | Patient, assigned health worker |
| PATCH | `/follow-ups/:id` | Assigned health worker |
| POST | `/follow-ups/:id/complete` \| `/reschedule` \| `/skip` | Assigned health worker |
| GET | `/patients/me/follow-ups` \| `/health-workers/me/follow-ups` | Role-scoped |
| GET | `/health-workers/me/high-risk-patients` | Health Worker — reads `RiskAssessment` + open `FollowUp` joined, facility-scoped |

## 16. Notifications

| Method | Path | Roles |
|---|---|---|
| GET | `/notifications/me?unread=true` | Any — self only |
| POST | `/notifications/:id/read` \| `/notifications/read-all` | Self only |
| POST | `/admin/notifications/send` | District Admin, System (internal service token) — broadcast/targeted |

## 17. Feedback & grievances

| Method | Path | Roles |
|---|---|---|
| POST | `/feedback` | Patient — one per completed appointment (enforced) |
| GET | `/facilities/:id/feedback` | Facility Admin (own), District Admin |
| POST | `/grievances` | Patient |
| GET | `/grievances/:id` | Patient (own), assigned reviewer |
| PATCH | `/grievances/:id` \| `/grievances/:id/resolve` | Facility/District Admin |

## 18. Health awareness content

| Method | Path | Roles |
|---|---|---|
| GET | `/health-content?language=&category=` | Any — public, Redis-cacheable |
| GET | `/health-content/:slug` | Any |
| POST/PATCH/DELETE | `/health-content/:slug` | District Admin |

## 19. Emergencies

| Method | Path | Roles |
|---|---|---|
| POST | `/emergencies` | Health Worker, Doctor — usually server-created from `triage/sessions/:id/assess`, but also directly callable — requires `Idempotency-Key` |
| GET | `/emergencies/active` | Health Worker/Facility Admin (facility-scoped), District Admin (district-scoped) |
| GET | `/emergencies/:id` | Involved staff |
| POST | `/emergencies/:id/acknowledge` \| `/resolve` | Health Worker/Doctor at the target facility |

## 20. Dashboards (aggregated read endpoints — don't make the frontend call 10 APIs)

| Method | Path | Roles |
|---|---|---|
| GET | `/patients/me/dashboard` | Patient — next appointment, active referrals, pending follow-ups, recent visits/prescriptions, unread notifications |
| GET | `/health-workers/me/dashboard` | Health Worker — assigned high-risk patients, today's tasks, pending follow-ups |
| GET | `/doctors/me/dashboard` | Doctor — today's appointments, pending consultations |
| GET | `/dashboard/facility/:facilityId` | Facility Admin — patients/appointments today, pending referrals, low-stock medicines, avg wait time |
| GET | `/dashboard/district/:districtId` | District Admin — patients served, consultations, referral completion rate, high-risk monitoring, resource monitoring |
| GET | `/dashboard/district/:districtId/reports?period=daily\|weekly\|monthly` | District Admin — generated report per FR-59 |

## 21. Offline sync (Phase 3, contract defined now so mobile/PWA can build against it early)

| Method | Path | Roles |
|---|---|---|
| POST | `/sync/push` | Health Worker device — batch of queued changes, **requires `Idempotency-Key` per item via `localId`** (see schema §3.5) |
| GET | `/sync/pull?since=` | Health Worker device — changes to pull down (assigned patients, updated follow-ups) since last sync |
| GET | `/sync/status?deviceId=` | Health Worker device |

## 22. Files

| Method | Path | Roles |
|---|---|---|
| POST | `/files/upload-url` | Authorized uploader for the target entity — returns a short-lived Supabase Storage **signed upload URL**, never direct bucket credentials |
| GET | `/files/:fileId` | Returns a short-lived **signed download URL**, only after the same authorization check as the underlying entity (a document's access rule = its patient's access rule) |
| DELETE | `/files/:fileId` | Uploader or Facility/District Admin — soft-delete only |

## 23. Admin & audit

| Method | Path | Roles |
|---|---|---|
| GET | `/admin/users` \| PATCH `/admin/users/:id/status` | District Admin |
| GET/POST/PATCH | `/admin/facilities...` | District Admin |
| GET/POST/PATCH | `/admin/doctors...` | Facility Admin (their facility), District Admin |
| GET | `/admin/audit-logs?entityType=&entityId=&actorId=` | District Admin only — read-only, proxies Mongo `audit_logs`, no write/delete endpoint exists |
| GET | `/admin/system-health` | District Admin (or internal monitoring token) |

## 24. What changed vs. the original draft, and why

- Removed generic `GET /patients?facilityId=` in favor of `/patients/search` (rate-limited, summary-only) and `/facilities/:id/appointments`-style scoped routes — an unscoped list-all-patients-by-facility endpoint is an over-exposure risk in a system whose whole premise is protecting patient data.
- Added `/patients/me`, `/doctors/me`, `/health-workers/me` self-scoped routes throughout instead of always requiring `:id` + a server-side ownership check — reduces the chance an agent generates a route that trusts a client-supplied id.
- Split medicine visibility: public search returns availability tiers only; exact quantities are facility-admin-only (original draft flagged this as a concern but didn't enforce it in the schema — now enforced by which endpoint/shape returns what).
- Made referral completion contingent on a recorded `Visit`, not a bare status PATCH (FR-30's actual intent).
- Added `Idempotency-Key` requirement explicitly to every create-type endpoint that a flaky rural connection is likely to retry.
- Consolidated "aggregated dashboard" endpoints per role, matching FR-33's intent but extended to every role, not just patients.
