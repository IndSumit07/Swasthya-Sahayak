# 03 — Database Schema

## 0. Conventions

- Postgres table names: `snake_case`, plural. Prisma model names: `PascalCase`, singular, mapped with `@@map`.
- Every table: `id UUID DEFAULT gen_random_uuid()` primary key, `created_at`, `updated_at` (`@updatedAt`).
- **No hard deletes on clinical or accountability-relevant data** (patients, facilities, referrals, prescriptions, audit trails). Use a `status` enum or `deleted_at` (soft delete) instead — a government healthcare system cannot silently lose records.
- Foreign keys are explicit and `onDelete: Restrict` by default for anything clinical; `Cascade` only for genuinely dependent rows (e.g., `AppointmentSlot` under `Facility` scheduling config — reconsider case by case, don't cascade-delete patient-linked rows).
- All money/quantity fields: `Int` (smallest unit) or `Decimal`, never `Float`.
- Enums are defined once and reused — don't restring the same set of statuses per table.

## 1. Enums

```prisma
enum UserRole {
  PATIENT
  HEALTH_WORKER
  DOCTOR
  FACILITY_ADMIN
  DISTRICT_ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}

enum FacilityType {
  SUB_CENTRE
  PHC
  CHC
  RURAL_HOSPITAL
  DISTRICT_HOSPITAL
  DIAGNOSTIC_CENTER
  PHARMACY
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AppointmentStatus {
  BOOKED
  CONFIRMED
  CHECKED_IN
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
  RESCHEDULED
}

enum ConsultationType {
  VIDEO
  AUDIO
  CHAT
  IN_PERSON
}

enum ReferralStatus {
  CREATED
  ACCEPTED
  REJECTED
  SCHEDULED
  PATIENT_ARRIVED
  CONSULTED
  COMPLETED
  CANCELLED
}

enum ReferralPriority {
  ROUTINE
  URGENT
  HIGH
  CRITICAL
}

enum DiagnosticOrderStatus {
  ORDERED
  SAMPLE_COLLECTED
  IN_PROGRESS
  RESULT_READY
  COMPLETED
  CANCELLED
}

enum FollowUpStatus {
  SCHEDULED
  COMPLETED
  MISSED
  RESCHEDULED
  SKIPPED
}

enum FollowUpCategory {
  MATERNAL
  CHILD
  CHRONIC
  OTHER
}

enum NotificationChannel {
  SMS
  PUSH
  EMAIL
  IN_APP
}

enum NotificationType {
  APPOINTMENT
  REFERRAL
  FOLLOW_UP
  MEDICINE
  EMERGENCY
  SYSTEM
}

enum GrievanceStatus {
  SUBMITTED
  UNDER_REVIEW
  ASSIGNED
  RESOLVED
  REJECTED
}

enum ConsentStatus {
  GRANTED
  REVOKED
  EXPIRED
}
```

## 2. PostgreSQL schema (Prisma) — system of record

### 2.1 Identity

```prisma
// Mirrors a Supabase auth.users row 1:1 by id. This table is the ONLY
// place `role` is read from for authorization — never trust a JWT
// custom claim or a request body field for role.
model User {
  id            String     @id @default(uuid()) // == supabase auth.users.id
  role          UserRole
  status        UserStatus @default(PENDING_VERIFICATION)
  fullName      String     @map("full_name")
  phone         String?    @unique
  email         String?    @unique
  preferredLang String     @default("en") @map("preferred_lang") // "en" | "hi" | "mr"
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")

  patient       Patient?
  healthWorker  HealthWorker?
  doctor        Doctor?
  facilityAdmin FacilityAdmin?
  districtAdmin DistrictAdmin?
  consents      Consent[]

  @@map("users")
}

model Patient {
  id                 String    @id @default(uuid())
  userId             String    @unique @map("user_id")
  user               User      @relation(fields: [userId], references: [id], onDelete: Restrict)
  dateOfBirth        DateTime? @map("date_of_birth")
  gender             Gender?
  village            String?
  district           String?
  state              String    @default("Maharashtra")
  emergencyContact   String?   @map("emergency_contact")
  bloodGroup         String?   @map("blood_group")
  abhaId             String?   @map("abha_id")
  insuranceInfo       Json?     @map("insurance_info") // { scheme, policyNumber, ... }
  // registeredBy is null for self-registration; set for assisted registration (FR-03)
  registeredById     String?   @map("registered_by_id")
  registeredBy       HealthWorker? @relation("PatientsRegistered", fields: [registeredById], references: [id])
  registeredAtFacilityId String? @map("registered_at_facility_id")
  registeredAtFacility   Facility? @relation(fields: [registeredAtFacilityId], references: [id])
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  medicalHistory     MedicalHistory?
  visits             Visit[]
  appointments       Appointment[]
  referrals          Referral[]        @relation("PatientReferrals")
  followUps          FollowUp[]
  riskAssessments    RiskAssessment[]
  prescriptions      Prescription[]
  diagnosticOrders   DiagnosticOrder[]
  documents          PatientDocument[]
  feedback           Feedback[]

  @@index([district])
  @@map("patients")
}

model MedicalHistory {
  id                String   @id @default(uuid())
  patientId         String   @unique @map("patient_id")
  patient           Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  allergies         String[] @default([])
  chronicConditions String[] @default([]) @map("chronic_conditions")
  currentMedications String[] @default([]) @map("current_medications")
  notes             String?
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@map("medical_histories")
}

model HealthWorker {
  id           String    @id @default(uuid())
  userId       String    @unique @map("user_id")
  user         User      @relation(fields: [userId], references: [id], onDelete: Restrict)
  facilityId   String    @map("facility_id")
  facility     Facility  @relation(fields: [facilityId], references: [id])
  createdAt    DateTime  @default(now()) @map("created_at")

  patientsRegistered Patient[]  @relation("PatientsRegistered")
  followUpsAssigned  FollowUp[]

  @@index([facilityId])
  @@map("health_workers")
}

model Doctor {
  id           String    @id @default(uuid())
  userId       String    @unique @map("user_id")
  user         User      @relation(fields: [userId], references: [id], onDelete: Restrict)
  facilityId   String    @map("facility_id")
  facility     Facility  @relation(fields: [facilityId], references: [id])
  specialty    String
  qualification String?
  createdAt    DateTime  @default(now()) @map("created_at")

  appointments  Appointment[]
  consultations Consultation[]
  prescriptions Prescription[]
  availability  DoctorAvailability[]

  @@index([facilityId])
  @@index([specialty])
  @@map("doctors")
}

model FacilityAdmin {
  id         String   @id @default(uuid())
  userId     String   @unique @map("user_id")
  user       User     @relation(fields: [userId], references: [id], onDelete: Restrict)
  facilityId String   @map("facility_id")
  facility   Facility @relation(fields: [facilityId], references: [id])

  @@map("facility_admins")
}

model DistrictAdmin {
  id       String  @id @default(uuid())
  userId   String  @unique @map("user_id")
  user     User    @relation(fields: [userId], references: [id], onDelete: Restrict)
  district String? // null == state-level admin, sees all districts

  @@map("district_admins")
}

// Patient-granted consent for a specific doctor/facility to access records
// beyond the default care relationship (FR-25).
model Consent {
  id          String        @id @default(uuid())
  patientId   String        @map("patient_id")
  grantedToId String        @map("granted_to_id") // a User.id (doctor)
  grantedTo   User          @relation(fields: [grantedToId], references: [id])
  scope       String        // e.g. "FULL_HISTORY" | "CURRENT_VISIT"
  status      ConsentStatus @default(GRANTED)
  grantedAt   DateTime      @default(now()) @map("granted_at")
  revokedAt   DateTime?     @map("revoked_at")
  expiresAt   DateTime?     @map("expires_at")

  @@index([patientId])
  @@map("consents")
}
```

### 2.2 Facilities & resources

```prisma
model Facility {
  id           String       @id @default(uuid())
  name         String
  type         FacilityType
  district     String
  village      String?
  latitude     Decimal?     @db.Decimal(9, 6)
  longitude    Decimal?     @db.Decimal(9, 6)
  contactPhone String?      @map("contact_phone")
  workingHours Json?        @map("working_hours") // { mon: "9-17", ... }
  isActive     Boolean      @default(true) @map("is_active")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  services         FacilityService[]
  beds             FacilityBedStatus?
  doctors          Doctor[]
  healthWorkers    HealthWorker[]
  admins           FacilityAdmin[]
  medicines        FacilityMedicine[]
  diagnosticTypes  FacilityDiagnostic[]
  appointmentSlots AppointmentSlot[]
  referralsFrom    Referral[]         @relation("FromFacility")
  referralsTo      Referral[]         @relation("ToFacility")
  patients         Patient[]

  @@index([district])
  @@index([type])
  @@map("facilities")
}

model FacilityService {
  id         String   @id @default(uuid())
  facilityId String   @map("facility_id")
  facility   Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  name       String   // "General OPD" | "Maternal Care" | "Emergency" | ...
  isActive   Boolean  @default(true) @map("is_active")

  @@unique([facilityId, name])
  @@map("facility_services")
}

// Single mutable row per facility for fast bed-availability reads (cached in Redis).
model FacilityBedStatus {
  facilityId    String   @id @map("facility_id")
  facility      Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  totalBeds     Int      @default(0) @map("total_beds")
  availableBeds Int      @default(0) @map("available_beds")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("facility_bed_status")
}

model DoctorAvailability {
  id        String   @id @default(uuid())
  doctorId  String   @map("doctor_id")
  doctor    Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  dayOfWeek Int      @map("day_of_week") // 0=Sun..6=Sat
  startTime String   @map("start_time")  // "09:00"
  endTime   String   @map("end_time")    // "13:00"
  slotMinutes Int    @default(15) @map("slot_minutes")

  @@index([doctorId])
  @@map("doctor_availability")
}

// Generated concrete slots (from DoctorAvailability, materialized per day) — keeps
// booking a simple row-lock instead of recomputing recurrence at request time.
model AppointmentSlot {
  id         String    @id @default(uuid())
  facilityId String    @map("facility_id")
  facility   Facility  @relation(fields: [facilityId], references: [id])
  doctorId   String    @map("doctor_id")
  date       DateTime  @db.Date
  startTime  String    @map("start_time")
  isBooked   Boolean   @default(false) @map("is_booked")
  appointment Appointment?

  @@unique([doctorId, date, startTime])
  @@index([facilityId, date])
  @@map("appointment_slots")
}
```

### 2.3 Digital triage & risk

Triage is intentionally **not** fully modeled in Postgres — the symptom-collection tree lives in MongoDB (`triage_sessions`, §3.1) because a rule-based engine's branching shape changes as rules evolve. Postgres only stores the **outcome**, which is what appointments/referrals/dashboards need to join against.

```prisma
model RiskAssessment {
  id                  String    @id @default(uuid())
  patientId           String    @map("patient_id")
  patient             Patient   @relation(fields: [patientId], references: [id])
  triageSessionId     String    @map("triage_session_id") // FK into Mongo triage_sessions._id
  riskLevel           RiskLevel @map("risk_level")
  category             FollowUpCategory?
  recommendedAction   String    @map("recommended_action") // "ROUTINE" | "DOCTOR_CONSULTATION" | "IMMEDIATE_ESCALATION"
  recommendedFacilityId String? @map("recommended_facility_id")
  assessedById        String    @map("assessed_by_id") // User.id of health worker/patient self-triage
  createdAt           DateTime  @default(now()) @map("created_at")

  emergency Emergency?

  @@index([patientId])
  @@index([riskLevel])
  @@map("risk_assessments")
}

model Emergency {
  id               String    @id @default(uuid())
  riskAssessmentId String    @unique @map("risk_assessment_id")
  riskAssessment   RiskAssessment @relation(fields: [riskAssessmentId], references: [id])
  patientId        String    @map("patient_id")
  facilityId       String    @map("facility_id")
  severity         String    // "CRITICAL" | "HIGH"
  reason           String
  status           String    @default("OPEN") // OPEN | ACKNOWLEDGED | RESOLVED
  acknowledgedById String?   @map("acknowledged_by_id")
  resolvedAt       DateTime? @map("resolved_at")
  createdAt        DateTime  @default(now()) @map("created_at")

  @@map("emergencies")
}
```

### 2.4 Appointments, queue, teleconsultation

```prisma
model Appointment {
  id         String            @id @default(uuid())
  patientId  String            @map("patient_id")
  patient    Patient           @relation(fields: [patientId], references: [id])
  doctorId   String            @map("doctor_id")
  doctor     Doctor            @relation(fields: [doctorId], references: [id])
  facilityId String            @map("facility_id")
  slotId     String            @unique @map("slot_id")
  slot       AppointmentSlot   @relation(fields: [slotId], references: [id])
  status     AppointmentStatus @default(BOOKED)
  bookedById String            @map("booked_by_id") // patient or health worker User.id
  createdAt  DateTime          @default(now()) @map("created_at")
  updatedAt  DateTime          @updatedAt @map("updated_at")

  queueToken   QueueToken?
  consultation Consultation?

  @@index([patientId])
  @@index([doctorId])
  @@index([facilityId, status])
  @@map("appointments")
}

model QueueToken {
  id            String      @id @default(uuid())
  appointmentId String      @unique @map("appointment_id")
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  facilityId    String      @map("facility_id")
  token         String      // "A-42"
  calledAt      DateTime?   @map("called_at")
  completedAt   DateTime?   @map("completed_at")
  createdAt     DateTime    @default(now()) @map("created_at")

  @@index([facilityId, createdAt])
  @@map("queue_tokens")
}

model Consultation {
  id            String            @id @default(uuid())
  appointmentId String            @unique @map("appointment_id")
  appointment   Appointment       @relation(fields: [appointmentId], references: [id])
  doctorId      String            @map("doctor_id")
  doctor        Doctor            @relation(fields: [doctorId], references: [id])
  type          ConsultationType
  language      String            @default("en")
  startedAt     DateTime?         @map("started_at")
  endedAt       DateTime?         @map("ended_at")
  // messages/chat transcript live in Mongo consultation_messages, keyed by this id
  createdAt     DateTime          @default(now()) @map("created_at")

  notes ConsultationNote?

  @@map("consultations")
}

model ConsultationNote {
  id             String       @id @default(uuid())
  consultationId String       @unique @map("consultation_id")
  consultation   Consultation @relation(fields: [consultationId], references: [id])
  symptoms       String?
  findings       String?
  diagnosis      String?
  advice         String?
  followUpDate   DateTime?    @map("follow_up_date")

  @@map("consultation_notes")
}
```

### 2.5 Health records

```prisma
model Visit {
  id         String   @id @default(uuid())
  patientId  String   @map("patient_id")
  patient    Patient  @relation(fields: [patientId], references: [id])
  facilityId String   @map("facility_id")
  doctorId   String?  @map("doctor_id")
  visitType  String   @map("visit_type") // "OPD" | "TELECONSULT" | "EMERGENCY"
  symptoms   String[] @default([])
  diagnosis  String?
  notes      String?
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([patientId, createdAt])
  @@map("visits")
}

model PatientDocument {
  id         String   @id @default(uuid())
  patientId  String   @map("patient_id")
  patient    Patient  @relation(fields: [patientId], references: [id])
  uploadedById String @map("uploaded_by_id")
  type       String   // "LAB_REPORT" | "XRAY" | "PRESCRIPTION" | "DISCHARGE_SUMMARY" | "OTHER"
  storageKey String   @map("storage_key") // Supabase Storage object path, never a public URL
  fileName   String   @map("file_name")
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([patientId])
  @@map("patient_documents")
}
```

### 2.6 Referrals

```prisma
model Referral {
  id               String           @id @default(uuid())
  patientId        String           @map("patient_id")
  patient          Patient          @relation("PatientReferrals", fields: [patientId], references: [id])
  fromFacilityId   String           @map("from_facility_id")
  fromFacility     Facility         @relation("FromFacility", fields: [fromFacilityId], references: [id])
  toFacilityId     String           @map("to_facility_id")
  toFacility       Facility         @relation("ToFacility", fields: [toFacilityId], references: [id])
  createdById      String           @map("created_by_id") // doctor or health worker User.id
  reason           String
  requiredSpecialty String?         @map("required_specialty")
  priority         ReferralPriority @default(ROUTINE)
  status           ReferralStatus   @default(CREATED)
  notes            String?
  createdAt        DateTime         @default(now()) @map("created_at")
  updatedAt        DateTime         @updatedAt @map("updated_at")

  statusEvents ReferralStatusEvent[]

  @@index([patientId])
  @@index([toFacilityId, status])
  @@map("referrals")
}

// Append-only timeline — this is what /referrals/:id/tracking reads.
model ReferralStatusEvent {
  id         String         @id @default(uuid())
  referralId String         @map("referral_id")
  referral   Referral       @relation(fields: [referralId], references: [id], onDelete: Cascade)
  status     ReferralStatus
  actorId    String         @map("actor_id")
  note       String?
  createdAt  DateTime       @default(now()) @map("created_at")

  @@index([referralId, createdAt])
  @@map("referral_status_events")
}
```

### 2.7 Diagnostics & medicines

```prisma
model FacilityDiagnostic {
  id         String   @id @default(uuid())
  facilityId String   @map("facility_id")
  facility   Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  testName   String   @map("test_name") // "CBC" | "X-Ray" | ...
  available  Boolean  @default(true)

  @@unique([facilityId, testName])
  @@map("facility_diagnostics")
}

model DiagnosticOrder {
  id          String                 @id @default(uuid())
  patientId   String                 @map("patient_id")
  patient     Patient                @relation(fields: [patientId], references: [id])
  facilityId  String                 @map("facility_id")
  orderedById String                 @map("ordered_by_id") // doctor User.id
  testName    String                 @map("test_name")
  status      DiagnosticOrderStatus  @default(ORDERED)
  createdAt   DateTime               @default(now()) @map("created_at")

  result DiagnosticResult?

  @@index([patientId])
  @@index([facilityId, status])
  @@map("diagnostic_orders")
}

model DiagnosticResult {
  id                String          @id @default(uuid())
  diagnosticOrderId String          @unique @map("diagnostic_order_id")
  diagnosticOrder   DiagnosticOrder @relation(fields: [diagnosticOrderId], references: [id])
  uploadedById      String          @map("uploaded_by_id") // lab staff / facility admin
  storageKey        String          @map("storage_key")
  summary           String?
  createdAt         DateTime        @default(now()) @map("created_at")

  @@map("diagnostic_results")
}

model FacilityMedicine {
  id             String   @id @default(uuid())
  facilityId     String   @map("facility_id")
  facility       Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  medicineName   String   @map("medicine_name")
  quantity       Int      @default(0)
  stockThreshold Int      @default(10) @map("stock_threshold")
  expiryDate     DateTime? @map("expiry_date") @db.Date
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@unique([facilityId, medicineName])
  @@index([medicineName])
  @@map("facility_medicines")
}
```

### 2.8 Prescriptions, follow-ups, feedback

```prisma
model Prescription {
  id             String              @id @default(uuid())
  patientId      String              @map("patient_id")
  patient        Patient             @relation(fields: [patientId], references: [id])
  doctorId       String              @map("doctor_id")
  doctor         Doctor              @relation(fields: [doctorId], references: [id])
  consultationId String?             @map("consultation_id")
  instructions   String?
  createdAt      DateTime            @default(now()) @map("created_at")

  items PrescriptionItem[]

  @@index([patientId])
  @@map("prescriptions")
}

model PrescriptionItem {
  id             String       @id @default(uuid())
  prescriptionId String       @map("prescription_id")
  prescription   Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  medicineName   String       @map("medicine_name")
  dosage         String
  frequency      String       // "1-0-1"
  durationDays   Int          @map("duration_days")

  @@map("prescription_items")
}

model FollowUp {
  id           String           @id @default(uuid())
  patientId    String           @map("patient_id")
  patient      Patient          @relation(fields: [patientId], references: [id])
  category     FollowUpCategory @default(OTHER)
  reason       String?
  dueDate      DateTime         @map("due_date") @db.Date
  assignedToId String           @map("assigned_to_id")
  assignedTo   HealthWorker     @relation(fields: [assignedToId], references: [id])
  status       FollowUpStatus   @default(SCHEDULED)
  completedAt  DateTime?        @map("completed_at")
  createdAt    DateTime         @default(now()) @map("created_at")

  @@index([patientId])
  @@index([assignedToId, status])
  @@index([dueDate, status]) // powers "missed follow-up" sweep job
  @@map("follow_ups")
}

model Feedback {
  id             String   @id @default(uuid())
  patientId      String   @map("patient_id")
  patient        Patient  @relation(fields: [patientId], references: [id])
  facilityId     String   @map("facility_id")
  appointmentId  String?  @map("appointment_id")
  serviceRating  Int      @map("service_rating") // 1-5
  waitTimeRating Int      @map("wait_time_rating")
  doctorRating   Int?     @map("doctor_rating")
  comment        String?
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([facilityId])
  @@map("feedback")
}

model Grievance {
  id           String          @id @default(uuid())
  patientId    String          @map("patient_id")
  facilityId   String?         @map("facility_id")
  category     String
  description  String
  status       GrievanceStatus @default(SUBMITTED)
  assignedToId String?         @map("assigned_to_id")
  resolutionNote String?       @map("resolution_note")
  createdAt    DateTime        @default(now()) @map("created_at")
  resolvedAt   DateTime?       @map("resolved_at")

  @@index([status])
  @@map("grievances")
}
```

### 2.9 Notifications (structured record — content templates live in Mongo)

```prisma
model Notification {
  id        String              @id @default(uuid())
  userId    String              @map("user_id")
  type      NotificationType
  channel   NotificationChannel
  title     String
  isRead    Boolean             @default(false) @map("is_read")
  relatedEntityType String?     @map("related_entity_type") // "REFERRAL" | "APPOINTMENT" | ...
  relatedEntityId   String?     @map("related_entity_id")
  createdAt DateTime            @default(now()) @map("created_at")
  readAt    DateTime?           @map("read_at")

  @@index([userId, isRead])
  @@map("notifications")
}
```

## 3. MongoDB collections

Use these **only** for the reasons stated — see `docs/02-architecture.md` §3 before adding a new one.

### 3.1 `triage_sessions`

```jsonc
{
  "_id": ObjectId,
  "patientId": "uuid",              // Postgres Patient.id
  "startedById": "uuid",            // Postgres User.id (self or health worker)
  "status": "IN_PROGRESS | COMPLETED",
  "answers": [                       // shape varies by which rule branch fired
    { "questionKey": "chest_pain", "value": true, "askedAt": "ISODate" }
  ],
  "vitals": { "temperatureC": 38.5, "durationDays": 3 },
  "ruleEngineVersion": "v1.2",
  "result": {
    "riskLevel": "HIGH",
    "recommendedAction": "IMMEDIATE_ESCALATION",
    "matchedRuleId": "chest_pain_breathlessness"
  },
  "createdAt": "ISODate",
  "completedAt": "ISODate"
}
```
Indexes: `{ patientId: 1, createdAt: -1 }`. On completion, the backend writes the **summary** into Postgres `risk_assessments`, referencing `_id` as `triageSessionId`.

### 3.2 `audit_logs`

```jsonc
{
  "_id": ObjectId,
  "actorId": "uuid",          // Postgres User.id
  "actorRole": "DOCTOR",
  "action": "PATIENT_RECORD_VIEWED", // enum-like string, see docs/04 error/action catalog
  "entityType": "PATIENT",
  "entityId": "uuid",
  "facilityId": "uuid|null",
  "metadata": { "reason": "consultation" }, // free-form, action-specific
  "ip": "x.x.x.x",
  "createdAt": "ISODate"
}
```
Indexes: `{ entityType: 1, entityId: 1, createdAt: -1 }`, `{ actorId: 1, createdAt: -1 }`. Append-only — no update/delete endpoint should ever exist for this collection. Every FR-67/FR-68 requirement is satisfied by writes here plus the `Referral`/`Grievance` etc. status tables already tracking their own history in Postgres.

### 3.3 `health_content`

```jsonc
{
  "_id": ObjectId,
  "slug": "maternal-nutrition-basics",
  "category": "MATERNAL_HEALTH",
  "translations": {
    "en": { "title": "...", "body": "...", "blocks": [ /* rich content, varies */ ] },
    "hi": { "title": "...", "body": "..." },
    "mr": { "title": "...", "body": "..." }
  },
  "publishedAt": "ISODate",
  "isActive": true
}
```
Indexes: `{ category: 1, isActive: 1 }`, `{ slug: 1 }` unique.

### 3.4 `consultation_messages`

```jsonc
{
  "_id": ObjectId,
  "consultationId": "uuid",   // Postgres Consultation.id
  "senderId": "uuid",
  "type": "TEXT | SYSTEM",
  "body": "...",
  "sentAt": "ISODate"
}
```
Indexes: `{ consultationId: 1, sentAt: 1 }`.

### 3.5 `offline_sync_queue`

```jsonc
{
  "_id": ObjectId,
  "deviceId": "string",
  "submittedById": "uuid",
  "entity": "PATIENT | VISIT | TRIAGE_SESSION | FOLLOW_UP",
  "operation": "CREATE | UPDATE",
  "localId": "string",         // client-generated, used for idempotency + conflict detection
  "payload": { /* raw entity-specific shape */ },
  "clientTimestamp": "ISODate",
  "status": "PENDING | RECONCILED | CONFLICT | FAILED",
  "reconciledEntityId": "uuid|null",
  "createdAt": "ISODate"
}
```
Indexes: `{ status: 1, createdAt: 1 }`, `{ deviceId: 1, localId: 1 }` unique — this compound uniqueness is what makes re-submitting the same offline record safe.

### 3.6 `notification_delivery_logs`

```jsonc
{
  "_id": ObjectId,
  "notificationId": "uuid",   // Postgres Notification.id
  "channel": "SMS",
  "provider": "string",
  "providerResponse": { /* raw, provider-specific */ },
  "deliveryStatus": "SENT | DELIVERED | FAILED",
  "attemptedAt": "ISODate"
}
```

## 4. Redis key namespace & BullMQ queues

| Key pattern | Purpose | TTL |
|---|---|---|
| `cache:facility:{id}:beds` | Cached `FacilityBedStatus` read | 30s, invalidated on write |
| `cache:facility:{id}:medicines` | Cached medicine availability list | 60s, invalidated on write |
| `cache:medicine-search:{query}:{district}` | Cross-facility medicine search result | 60s |
| `cache:facility-search:{lat}:{lng}:{radius}:{service}` | Nearby facility search | 120s |
| `cache:doctor:{id}:availability:{date}` | Doctor's open slots for a date | 30s, invalidated on booking |
| `session:otp:{phone}` | Pending OTP attempt count (rate limiting) | 10 min |
| `ratelimit:{route}:{ip or userId}` | Generic rate-limit counters | per-route window |

| BullMQ queue | Jobs | Trigger |
|---|---|---|
| `notifications` | Send SMS/push/email for a `Notification` row | On any notification-worthy event |
| `reminders` | Appointment reminders, follow-up due reminders | Scheduled/cron via BullMQ repeatable jobs |
| `escalations` | Fan out `Emergency` creation to on-call health workers/facility admin | On `RiskAssessment.riskLevel IN (HIGH, CRITICAL)` |
| `sync-reconcile` | Process one `offline_sync_queue` document into Postgres | On `/sync/push` and on a periodic sweep |
| `missed-followup-sweep` | Nightly scan of `follow_ups` where `dueDate < now() AND status = SCHEDULED` → mark `MISSED`, notify health worker | Cron (repeatable job) |
| `low-stock-check` | Scan `facility_medicines` below `stock_threshold` → notify facility + district admin | Cron |

Socket.IO uses the Redis adapter (`@socket.io/redis-adapter`) so queue-token and consultation events fan out correctly across multiple Express instances.
