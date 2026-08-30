# 01 — Product Overview

## 1. Problem statement (PS 26133)

**Organization:** Government of Maharashtra — Maharashtra State Innovation Society, Dept. of Skills, Employment, Entrepreneurship and Innovation
**Category:** Software · **Theme:** MedTech / BioTech / HealthTech

Rural and underserved communities face long travel distances, specialist shortages, irregular diagnostics, fragmented medical records, delayed referrals, and low awareness of available services. Patients move between sub-centres, PHCs, rural hospitals, and district hospitals without continuity of information. Connectivity, language, health literacy, and affordability compound the problem.

**The mandate is explicit: strengthen — not replace — the public health system.** Every design decision (assisted registration, offline-first data capture, low-bandwidth teleconsultation, multilingual UI) exists because the primary users are frontline health workers and patients operating in low-connectivity, low-digital-literacy rural settings, not urban self-service patients.

### Expected solution shape

An integrated platform combining: assisted teleconsultation, appointment/queue management, digital triage, longitudinal patient records, referral tracking, diagnostic coordination, medicine availability, high-risk patient follow-up, and facility/district dashboards — with low-connectivity support, multilingual interaction, emergency escalation, and an interoperability layer based on approved standards (FHIR-compatible, not FHIR-certified, for MVP).

### Outcomes this system is judged against

- Reduced travel and waiting time
- Earlier consultation for at-risk patients
- Improved referral completion rate (patients no longer "lost between facilities")
- Better follow-up completion for maternal, child, and chronic-disease cases
- Improved visibility into medicine/diagnostic availability
- Demonstrable quality/accountability monitoring at facility and district level

## 2. Roles (exactly five for MVP)

| Role | Responsibility | Scope of data access |
|---|---|---|
| **Patient / Citizen** | Register, book appointments, join teleconsultations, view own records, receive reminders, give feedback | Own records only |
| **Frontline Health Worker** | Assisted registration, digital triage, initiate teleconsultations, create referrals, manage follow-ups for assigned patients | Patients they've registered or are assigned to, within their facility |
| **Doctor / Specialist** | Conduct consultations, review history, diagnose, prescribe, create referrals | Patients with an active appointment/referral/consultation relationship with them |
| **Health Facility Admin** | Manage facility resources — doctors, beds, medicines, diagnostics, appointment slots | Their facility only |
| **District / State Admin** | Monitor accessibility, referrals, resources, and quality via aggregated dashboards | Aggregated/read-only data across facilities in their district (or state, if `districtId` is null for a state-level admin) |

Do not introduce a sixth role, or split any of these into sub-roles, without updating `docs/05-auth-rbac.md` first — permission checks throughout the API assume exactly this set.

## 3. MVP phasing

Don't build all 68 functional requirements from the original spec at once. Three phases, in priority order:

### Phase 1 — Demo-critical (build first)

Authentication → Assisted/self patient registration → Facility & service search → Digital triage (rule-based) → Appointment booking → Teleconsultation (assisted, audio/chat-first) → Longitudinal health record → Referral creation & tracking → Follow-up scheduling.

This phase alone tells the full story judges need to see: **access → triage → appointment → consultation → records → referral → follow-up.**

### Phase 2 — Strong differentiators

Medicine availability search, diagnostic coordination, queue management (real-time tokens), notification engine, high-risk patient dashboard for health workers, facility admin dashboard, patient feedback/grievance flow.

### Phase 3 — Production-readiness (post-hackathon, don't over-invest pre-demo)

Full offline sync with conflict resolution, FHIR-compatible integration layer, advanced analytics, government system integration hooks, full audit trail UI, disaster recovery, high-volume notification infrastructure.

## 4. Explicit non-goals for MVP

- No AI/ML diagnostic model — triage is **rule-based**, described honestly as such to judges (safer to demo, easier to defend, and matches the PS's tone of strengthening rather than replacing clinical judgment).
- No claim of live government-system interoperability — describe the integration layer as **FHIR-compatible**, not integrated.
- No building of a general-purpose EHR — the longitudinal record is scoped to what Modules 3–7 of the original spec need (visits, prescriptions, diagnostics, documents), not a full clinical data model.
