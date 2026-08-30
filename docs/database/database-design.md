# Database Design — Rural Healthcare Access Platform (SIH PS 26133)

## 1. Split strategy: what goes where and why

| Store | Used for | Why |
|---|---|---|
| **PostgreSQL** | Patients, users, facilities, appointments, referrals, prescriptions, diagnostics, medicines/inventory, follow-ups, consents, audit logs | This is the system of record. It needs foreign-key integrity (a referral must point to a real patient and a real facility), transactions (booking a slot must be atomic), and it's queried relationally all the time (district dashboard joins facilities → appointments → referrals). |
| **MongoDB** | Digital triage sessions, multilingual health-content CMS, notifications, offline-sync queue, geo-search index for "nearby facilities" | These are either schema-variable (triage Q&A trees differ per condition, notification payloads differ per type), write-heavy and disposable (notifications), or benefit from native geo/array queries (facility search). Forcing them into rigid relational tables adds migration pain for no integrity benefit. |

Rule of thumb applied throughout: **if losing/duplicating a record would break patient safety or accountability → Postgres. If a record is a derived/ephemeral/flexible-shape artifact → Mongo.**

Cross-references: every Mongo document that relates to a Postgres entity stores that entity's Postgres UUID as a plain string field (e.g. `patientId`, `facilityId`). No joins are attempted across the two stores in a single query — the API layer stitches them (this matches the `/patients/:id/dashboard` aggregation endpoint in your API doc).

---

## 2. PostgreSQL schema

### 2.1 Conventions
- Primary keys: `UUID DEFAULT gen_random_uuid()` (needs `CREATE EXTENSION IF NOT EXISTS pgcrypto;`)
- All tables: `created_at`, `updated_at TIMESTAMPTZ DEFAULT now()`, updated via trigger
- Soft delete via `deleted_at TIMESTAMPTZ` where records must be retained for audit (patients, users, prescriptions) rather than hard `DELETE`
- Enums used for closed sets (role, status) — keeps the API's status strings honest at the DB level

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis; -- for facility lat/lng distance queries

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- attach as: CREATE TRIGGER trg_<table>_updated BEFORE UPDATE ON <table>
--            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 2.2 Enums

```sql
CREATE TYPE user_role       AS ENUM ('PATIENT','HEALTH_WORKER','DOCTOR','FACILITY_ADMIN','DISTRICT_ADMIN','SUPER_ADMIN');
CREATE TYPE gender_type     AS ENUM ('MALE','FEMALE','OTHER');
CREATE TYPE facility_type   AS ENUM ('SUB_CENTRE','PHC','CHC','RURAL_HOSPITAL','DISTRICT_HOSPITAL','DIAGNOSTIC_CENTER','PHARMACY');
CREATE TYPE visit_type      AS ENUM ('OPD','TELECONSULTATION','EMERGENCY','FOLLOW_UP');
CREATE TYPE risk_level      AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
CREATE TYPE appointment_status AS ENUM ('BOOKED','CONFIRMED','CHECKED_IN','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW','RESCHEDULED');
CREATE TYPE consultation_type  AS ENUM ('VIDEO','AUDIO','CHAT','IN_PERSON');
CREATE TYPE consultation_status AS ENUM ('SCHEDULED','ONGOING','COMPLETED','CANCELLED');
CREATE TYPE referral_status  AS ENUM ('CREATED','ACCEPTED','REJECTED','APPOINTMENT_SCHEDULED','PATIENT_ARRIVED','CONSULTED','COMPLETED','CANCELLED');
CREATE TYPE referral_priority AS ENUM ('LOW','NORMAL','HIGH','EMERGENCY');
CREATE TYPE diagnostic_order_status AS ENUM ('ORDERED','SAMPLE_COLLECTED','IN_PROGRESS','COMPLETED','CANCELLED');
CREATE TYPE follow_up_status AS ENUM ('PENDING','COMPLETED','MISSED','RESCHEDULED','SKIPPED');
CREATE TYPE follow_up_category AS ENUM ('MATERNAL','CHILD','CHRONIC','GENERAL');
CREATE TYPE emergency_severity AS ENUM ('MODERATE','SEVERE','CRITICAL');
CREATE TYPE emergency_status AS ENUM ('REPORTED','ACKNOWLEDGED','ESCALATED','RESOLVED');
CREATE TYPE grievance_status AS ENUM ('SUBMITTED','UNDER_REVIEW','ASSIGNED','RESOLVED','REJECTED');
CREATE TYPE consent_type     AS ENUM ('RECORD_ACCESS','DATA_SHARING','TELECONSULTATION_RECORDING');
CREATE TYPE medicine_stock_status AS ENUM ('AVAILABLE','LOW_STOCK','OUT_OF_STOCK');
```

### 2.3 Identity & users

```sql
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider_id  TEXT UNIQUE,              -- Supabase auth uid, if used
  phone             TEXT UNIQUE,
  email             TEXT UNIQUE,
  name              TEXT NOT NULL,
  role              user_role NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en', -- ISO 639-1: en, mr, hi
  is_active         BOOLEAN NOT NULL DEFAULT true,
  phone_verified    BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT chk_contact CHECK (phone IS NOT NULL OR email IS NOT NULL)
);
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;

CREATE TABLE user_consents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type  consent_type NOT NULL,
  granted       BOOLEAN NOT NULL DEFAULT true,
  granted_to_user_id UUID REFERENCES users(id), -- e.g. doctor granted temp access
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ
);
CREATE INDEX idx_consents_user ON user_consents(user_id);
```

### 2.4 Patients

```sql
CREATE TABLE patients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL, -- null if registered by a worker, no login yet
  registered_by_worker_id UUID REFERENCES users(id),  -- FR-03 assisted registration
  name                TEXT NOT NULL,
  date_of_birth       DATE,
  gender              gender_type,
  phone               TEXT,
  village             TEXT,
  district            TEXT NOT NULL,
  state               TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode             TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  blood_group         TEXT,
  abha_id             TEXT UNIQUE,           -- Ayushman Bharat Health Account
  ayushman_card_no    TEXT,
  government_id_type  TEXT,
  government_id_last4 TEXT,                  -- never store full ID; last 4 only
  preferred_language  TEXT NOT NULL DEFAULT 'mr',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_patients_district ON patients(district) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_name_trgm ON patients USING gin (name gin_trgm_ops); -- needs pg_trgm, for /patients/search?name=

CREATE TABLE patient_medical_history (
  patient_id      UUID PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  allergies       TEXT[],
  chronic_conditions TEXT[],
  current_medications TEXT[],
  notes           TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.5 Facilities, services, doctors, health workers

```sql
CREATE TABLE facilities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  type          facility_type NOT NULL,
  district      TEXT NOT NULL,
  state         TEXT NOT NULL DEFAULT 'Maharashtra',
  address       TEXT,
  location      GEOGRAPHY(Point, 4326),   -- postgis point (lng, lat) -> used for /facilities/nearby
  phone         TEXT,
  working_hours JSONB,                    -- e.g. {"mon":"09:00-17:00", ...}
  bed_capacity  INTEGER DEFAULT 0,
  beds_available INTEGER DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_facilities_district_type ON facilities(district, type);
CREATE INDEX idx_facilities_location ON facilities USING GIST(location);

CREATE TABLE facility_services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  service_name  TEXT NOT NULL,            -- OPD, Emergency, Maternal Care, etc.
  is_available  BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(facility_id, service_name)
);

CREATE TABLE doctors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  facility_id   UUID REFERENCES facilities(id),
  specialty     TEXT NOT NULL,
  registration_no TEXT,                  -- medical council reg. no.
  years_experience SMALLINT,
  is_available_for_teleconsult BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_facility ON doctors(facility_id);

CREATE TABLE doctor_availability (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  slot_duration_minutes SMALLINT NOT NULL DEFAULT 15
);

CREATE TABLE health_workers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  facility_id   UUID REFERENCES facilities(id),
  assigned_villages TEXT[],
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_health_workers_facility ON health_workers(facility_id);
```

### 2.6 Appointments & queue

```sql
CREATE TABLE appointment_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  facility_id   UUID NOT NULL REFERENCES facilities(id),
  slot_date     DATE NOT NULL,
  slot_time     TIME NOT NULL,
  is_booked     BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(doctor_id, slot_date, slot_time)
);
CREATE INDEX idx_slots_doctor_date ON appointment_slots(doctor_id, slot_date) WHERE is_booked = false;

CREATE TABLE appointments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  doctor_id     UUID NOT NULL REFERENCES doctors(id),
  facility_id   UUID NOT NULL REFERENCES facilities(id),
  slot_id       UUID REFERENCES appointment_slots(id),
  booked_by_user_id UUID REFERENCES users(id),   -- patient themself, or a worker
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status        appointment_status NOT NULL DEFAULT 'BOOKED',
  triage_session_id TEXT,                        -- Mongo ObjectId, if triage preceded booking
  referral_id   UUID REFERENCES referrals(id),    -- nullable; forward ref, see note below
  queue_token   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Note: referrals table is defined in §2.8; create appointments AFTER referrals,
-- or add the FK via ALTER TABLE once both exist.
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_facility_date ON appointments(facility_id, appointment_date);

CREATE TABLE queues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   UUID NOT NULL REFERENCES facilities(id),
  queue_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  current_token TEXT,
  UNIQUE(facility_id, queue_date)
);

CREATE TABLE queue_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id      UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  token         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'WAITING', -- WAITING, CALLED, COMPLETED, SKIPPED
  checked_in_at TIMESTAMPTZ,
  called_at     TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  UNIQUE(queue_id, token)
);
CREATE INDEX idx_queue_entries_queue_status ON queue_entries(queue_id, status);
```

### 2.7 Consultations, visits, prescriptions

```sql
CREATE TABLE consultations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  doctor_id     UUID NOT NULL REFERENCES doctors(id),
  assisting_worker_id UUID REFERENCES health_workers(id),  -- FR-18 assisted teleconsult
  type          consultation_type NOT NULL,
  status        consultation_status NOT NULL DEFAULT 'SCHEDULED',
  language      TEXT,
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ,
  symptoms      TEXT[],
  findings      TEXT,
  diagnosis     TEXT,
  advice        TEXT,
  follow_up_date DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);

CREATE TABLE visits (   -- generic visit log, distinct from teleconsult-specific `consultations`
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  facility_id   UUID NOT NULL REFERENCES facilities(id),
  doctor_id     UUID REFERENCES doctors(id),
  consultation_id UUID REFERENCES consultations(id),
  visit_type    visit_type NOT NULL,
  symptoms      TEXT[],
  diagnosis     TEXT,
  notes         TEXT,
  visit_date    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_visits_patient_date ON visits(patient_id, visit_date DESC);

CREATE TABLE prescriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  doctor_id     UUID NOT NULL REFERENCES doctors(id),
  consultation_id UUID REFERENCES consultations(id),
  instructions  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);

CREATE TABLE prescription_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_id     UUID REFERENCES medicines(id),
  medicine_name   TEXT NOT NULL,   -- denormalized snapshot, in case medicine catalog entry changes later
  dosage          TEXT,
  frequency       TEXT,            -- e.g. "1-0-1"
  duration_days   SMALLINT
);

CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  uploaded_by_user_id UUID REFERENCES users(id),
  category      TEXT NOT NULL,   -- LAB_REPORT, XRAY, PRESCRIPTION, DISCHARGE_SUMMARY, OTHER
  storage_key   TEXT NOT NULL,   -- object storage path, signed URL generated at request time
  file_name     TEXT,
  mime_type     TEXT,
  related_visit_id UUID REFERENCES visits(id),
  related_diagnostic_order_id UUID,  -- see §2.9
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_patient ON documents(patient_id);
```

### 2.8 Referrals

```sql
CREATE TABLE referrals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  from_facility_id  UUID NOT NULL REFERENCES facilities(id),
  to_facility_id    UUID REFERENCES facilities(id),   -- may be null until routed
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  required_specialty TEXT,
  reason            TEXT NOT NULL,
  diagnosis         TEXT,
  priority          referral_priority NOT NULL DEFAULT 'NORMAL',
  status            referral_status NOT NULL DEFAULT 'CREATED',
  linked_appointment_id UUID REFERENCES appointments(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at       TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ
);
CREATE INDEX idx_referrals_patient ON referrals(patient_id);
CREATE INDEX idx_referrals_to_facility_status ON referrals(to_facility_id, status);

CREATE TABLE referral_status_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id   UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  status        referral_status NOT NULL,
  changed_by_user_id UUID REFERENCES users(id),
  notes         TEXT,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_referral_history_referral ON referral_status_history(referral_id, changed_at);

-- Now that referrals exists, add the deferred FK from appointments:
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_referral
  FOREIGN KEY (referral_id) REFERENCES referrals(id);
```

### 2.9 Diagnostics

```sql
CREATE TABLE diagnostic_tests (      -- catalog: CBC, X-Ray, Ultrasound...
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  category      TEXT
);

CREATE TABLE facility_diagnostic_availability (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  test_id       UUID NOT NULL REFERENCES diagnostic_tests(id),
  is_available  BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(facility_id, test_id)
);

CREATE TABLE diagnostic_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  ordered_by_doctor_id UUID NOT NULL REFERENCES doctors(id),
  facility_id   UUID NOT NULL REFERENCES facilities(id),
  test_id       UUID NOT NULL REFERENCES diagnostic_tests(id),
  consultation_id UUID REFERENCES consultations(id),
  status        diagnostic_order_status NOT NULL DEFAULT 'ORDERED',
  ordered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);
CREATE INDEX idx_diag_orders_patient ON diagnostic_orders(patient_id);

CREATE TABLE diagnostic_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES diagnostic_orders(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID REFERENCES users(id),
  result_summary TEXT,
  document_id   UUID REFERENCES documents(id),
  is_abnormal   BOOLEAN,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE documents ADD CONSTRAINT fk_documents_diag_order
  FOREIGN KEY (related_diagnostic_order_id) REFERENCES diagnostic_orders(id);
```

### 2.10 Medicines & inventory

```sql
CREATE TABLE medicines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  generic_name  TEXT,
  category      TEXT,
  UNIQUE(name)
);
CREATE INDEX idx_medicines_name_trgm ON medicines USING gin (name gin_trgm_ops);

CREATE TABLE facility_medicine_stock (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id       UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  medicine_id       UUID NOT NULL REFERENCES medicines(id),
  quantity          INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  status            medicine_stock_status GENERATED ALWAYS AS (
                       CASE WHEN quantity <= 0 THEN 'OUT_OF_STOCK'
                            WHEN quantity <= low_stock_threshold THEN 'LOW_STOCK'
                            ELSE 'AVAILABLE' END
                     ) STORED,
  expiry_date       DATE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(facility_id, medicine_id)
);
CREATE INDEX idx_facility_medicine_status ON facility_medicine_stock(medicine_id, status);
-- Powers GET /medicine-availability?medicine=X&district=Y (join to facilities for district)
```

### 2.11 Follow-ups & high-risk patients

```sql
CREATE TABLE risk_assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  category      follow_up_category NOT NULL,
  risk_level    risk_level NOT NULL,
  reason        TEXT,
  assessed_by_user_id UUID REFERENCES users(id),
  triage_session_id TEXT,          -- Mongo ObjectId reference
  assessed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_risk_patient ON risk_assessments(patient_id);
CREATE INDEX idx_risk_level ON risk_assessments(risk_level) WHERE risk_level IN ('HIGH','CRITICAL');

CREATE TABLE follow_ups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  category      follow_up_category NOT NULL,
  reason        TEXT,
  due_date      DATE NOT NULL,
  assigned_to_user_id UUID REFERENCES users(id),  -- usually a health worker
  status        follow_up_status NOT NULL DEFAULT 'PENDING',
  created_by_user_id UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);
CREATE INDEX idx_followups_assigned_status ON follow_ups(assigned_to_user_id, status);
CREATE INDEX idx_followups_due ON follow_ups(due_date) WHERE status = 'PENDING';
```

### 2.12 Emergency, feedback & grievance

```sql
CREATE TABLE emergencies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID REFERENCES patients(id),   -- nullable: emergency may be reported before patient is identified
  facility_id   UUID REFERENCES facilities(id),
  reported_by_user_id UUID REFERENCES users(id),
  severity      emergency_severity NOT NULL,
  reason        TEXT NOT NULL,
  status        emergency_status NOT NULL DEFAULT 'REPORTED',
  reported_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX idx_emergencies_status ON emergencies(status) WHERE status <> 'RESOLVED';

CREATE TABLE feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  facility_id   UUID REFERENCES facilities(id),
  appointment_id UUID REFERENCES appointments(id),
  category      TEXT,          -- WAITING_TIME, DOCTOR_EXPERIENCE, etc.
  rating        SMALLINT CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE grievances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  facility_id   UUID REFERENCES facilities(id),
  category      TEXT,
  description   TEXT NOT NULL,
  status        grievance_status NOT NULL DEFAULT 'SUBMITTED',
  assigned_to_user_id UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX idx_grievances_status ON grievances(status) WHERE status <> 'RESOLVED';
```

### 2.13 Audit log (kept in Postgres, not Mongo — see rationale below)

```sql
CREATE TABLE audit_logs (
  id            BIGSERIAL,
  actor_user_id UUID REFERENCES users(id),
  action        TEXT NOT NULL,     -- PATIENT_RECORD_VIEWED, REFERRAL_CREATED, ...
  entity_type   TEXT NOT NULL,     -- 'patient', 'referral', ...
  entity_id     UUID,
  patient_id    UUID,              -- denormalized for fast "who viewed this patient" queries
  facility_id   UUID,
  metadata      JSONB,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (occurred_at);

-- create one partition per month, e.g.:
CREATE TABLE audit_logs_2026_09 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE INDEX idx_audit_patient ON audit_logs(patient_id, occurred_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id, occurred_at DESC);
-- REVOKE UPDATE, DELETE ON audit_logs FROM app_role;  -- append-only at the grant level
```

> **Why Postgres and not Mongo for audit logs**, even though they're high-volume and never updated: this table is your regulatory accountability trail (FR-67/68). It needs to reliably join against `patient_id`/`facility_id`/`actor_user_id` for compliance queries ("who viewed patient X in the last 90 days") without a cross-database lookup, and monthly partitioning + `REVOKE UPDATE/DELETE` gives you tamper-resistance without adding a second consistency model. Mongo remains the right call for the collections in §3, which don't carry this integrity requirement.

### 2.14 Dashboards: views, not tables

Facility/district dashboards (FR-52 to FR-59) should be **materialized views refreshed on a schedule**, not extra tables you write to manually — otherwise you get two sources of truth.

```sql
CREATE MATERIALIZED VIEW facility_daily_stats AS
SELECT
  f.id AS facility_id,
  CURRENT_DATE AS stat_date,
  COUNT(DISTINCT a.id) FILTER (WHERE a.appointment_date = CURRENT_DATE) AS appointments_today,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status NOT IN ('COMPLETED','CANCELLED')) AS pending_referrals,
  COUNT(DISTINCT fms.id) FILTER (WHERE fms.status = 'LOW_STOCK') AS low_stock_medicines,
  AVG(EXTRACT(EPOCH FROM (qe.completed_at - qe.checked_in_at))/60) FILTER (WHERE qe.completed_at IS NOT NULL) AS avg_wait_minutes
FROM facilities f
LEFT JOIN appointments a ON a.facility_id = f.id
LEFT JOIN referrals r ON r.to_facility_id = f.id
LEFT JOIN facility_medicine_stock fms ON fms.facility_id = f.id
LEFT JOIN queues q ON q.facility_id = f.id AND q.queue_date = CURRENT_DATE
LEFT JOIN queue_entries qe ON qe.queue_id = q.id
GROUP BY f.id;

-- REFRESH MATERIALIZED VIEW CONCURRENTLY facility_daily_stats;  -- run on a cron, needs a unique index to allow CONCURRENTLY
```

Apply the same pattern for `district_daily_stats`, grouping by `district` instead of `facility_id`.

---

## 3. MongoDB schema

Each collection below is shown as a `$jsonSchema` validator (so Mongo still enforces shape) plus an example document.

### 3.1 `triage_sessions`

Symptom sets and question trees genuinely differ by presenting complaint — this is the clearest case for a document model. Postgres only stores the *outcome* (`risk_assessments`), Mongo stores the *process*.

```js
db.createCollection("triage_sessions", { validator: { $jsonSchema: {
  bsonType: "object",
  required: ["patientId", "status", "startedAt"],
  properties: {
    _id: { bsonType: "objectId" },
    patientId: { bsonType: "string" },        // Postgres patients.id (UUID as string)
    conductedByUserId: { bsonType: "string" },
    status: { enum: ["IN_PROGRESS", "COMPLETED", "ABANDONED"] },
    symptoms: {
      bsonType: "array",
      items: {
        bsonType: "object",
        properties: {
          name: { bsonType: "string" },
          severity: { enum: ["MILD","MODERATE","SEVERE"] },
          durationDays: { bsonType: "int" }
        }
      }
    },
    vitals: {
      bsonType: "object",
      properties: {
        temperatureC: { bsonType: "double" },
        pulse: { bsonType: "int" },
        bloodPressure: { bsonType: "string" },
        spo2: { bsonType: "int" }
      }
    },
    ruleEngineVersion: { bsonType: "string" },   // which rule-set version scored this
    result: {
      bsonType: "object",
      properties: {
        riskLevel: { enum: ["LOW","MEDIUM","HIGH","CRITICAL"] },
        recommendedAction: { bsonType: "string" },
        recommendedFacilityId: { bsonType: "string" },
        emergency: { bsonType: "bool" },
        matchedRules: { bsonType: "array", items: { bsonType: "string" } }
      }
    },
    startedAt: { bsonType: "date" },
    completedAt: { bsonType: "date" }
  }
}}});

db.triage_sessions.createIndex({ patientId: 1, startedAt: -1 });
db.triage_sessions.createIndex({ "result.riskLevel": 1, status: 1 });
```

### 3.2 `health_content` (multilingual CMS)

```js
db.createCollection("health_content", { validator: { $jsonSchema: {
  bsonType: "object",
  required: ["slug", "category", "translations"],
  properties: {
    _id: { bsonType: "objectId" },
    slug: { bsonType: "string" },
    category: { enum: ["MATERNAL_HEALTH","CHILD_HEALTH","CHRONIC_DISEASE","NUTRITION","PREVENTIVE_CARE","EMERGENCY_AWARENESS","MEDICINE_AWARENESS"] },
    translations: {
      bsonType: "object",
      description: "keyed by language code: mr, hi, en",
      additionalProperties: {
        bsonType: "object",
        properties: {
          title: { bsonType: "string" },
          body: { bsonType: "string" },
          audioUrl: { bsonType: "string" }   // low-literacy / low-connectivity support
        }
      }
    },
    tags: { bsonType: "array", items: { bsonType: "string" } },
    publishedBy: { bsonType: "string" },
    isPublished: { bsonType: "bool" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" }
  }
}}});

db.health_content.createIndex({ category: 1, isPublished: 1 });
db.health_content.createIndex({ slug: 1 }, { unique: true });
db.health_content.createIndex({ tags: 1 });
```

Example document:
```json
{
  "slug": "maternal-danger-signs",
  "category": "MATERNAL_HEALTH",
  "translations": {
    "mr": { "title": "गरोदरपणातील धोक्याची चिन्हे", "body": "...", "audioUrl": "https://cdn.../mr.mp3" },
    "hi": { "title": "गर्भावस्था में खतरे के संकेत", "body": "..." },
    "en": { "title": "Danger signs in pregnancy", "body": "..." }
  },
  "isPublished": true
}
```

### 3.3 `notifications`

High write volume, payload shape varies per `type`, and records are naturally expiring — a good fit for Mongo with a TTL index instead of a Postgres table you'd have to prune manually.

```js
db.createCollection("notifications", { validator: { $jsonSchema: {
  bsonType: "object",
  required: ["userId", "type", "channel", "createdAt"],
  properties: {
    _id: { bsonType: "objectId" },
    userId: { bsonType: "string" },
    type: { enum: ["APPOINTMENT","REFERRAL","FOLLOW_UP","MEDICINE","EMERGENCY","SYSTEM"] },
    channel: { enum: ["SMS","PUSH","EMAIL","IN_APP"] },
    title: { bsonType: "string" },
    body: { bsonType: "string" },
    data: { bsonType: "object" },      // freeform payload, e.g. {"appointmentId": "...", "deepLink": "..."}
    isRead: { bsonType: "bool" },
    sentAt: { bsonType: "date" },
    readAt: { bsonType: "date" },
    createdAt: { bsonType: "date" }
  }
}}});

db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
// auto-purge read notifications after 180 days
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 15552000, partialFilterExpression: { isRead: true } });
```

### 3.4 `sync_queue` (offline sync from health-worker devices)

Each entity type pushed offline (patient, visit, triage) has a different shape — Mongo avoids needing one staging table per entity.

```js
db.createCollection("sync_queue", { validator: { $jsonSchema: {
  bsonType: "object",
  required: ["deviceId", "entity", "operation", "localId", "payload", "syncStatus"],
  properties: {
    _id: { bsonType: "objectId" },
    deviceId: { bsonType: "string" },
    userId: { bsonType: "string" },
    entity: { enum: ["PATIENT","VISIT","TRIAGE_SESSION","FOLLOW_UP"] },
    operation: { enum: ["CREATE","UPDATE"] },
    localId: { bsonType: "string" },     // client-generated id, for idempotency
    serverId: { bsonType: "string" },    // filled in after successful apply
    payload: { bsonType: "object" },
    syncStatus: { enum: ["PENDING","APPLIED","CONFLICT","FAILED"] },
    conflictReason: { bsonType: "string" },
    receivedAt: { bsonType: "date" },
    processedAt: { bsonType: "date" }
  }
}}});

db.sync_queue.createIndex({ deviceId: 1, syncStatus: 1 });
db.sync_queue.createIndex({ localId: 1 }, { unique: true });  // idempotent retries from flaky connections
```

### 3.5 `facility_search_index` (optional, denormalized read model)

Postgres already has `facilities` + PostGIS. This collection is only worth adding if the patient-facing app needs very fast, cache-friendly "nearby + filter by service/medicine" search without hitting Postgres directly — a background job keeps it in sync. Skip this for the MVP; add it in Phase 3 if search latency becomes a real problem.

```js
db.createCollection("facility_search_index");
db.facility_search_index.createIndex({ location: "2dsphere" });
db.facility_search_index.createIndex({ district: 1, type: 1, services: 1 });
```

---

## 4. How the pieces connect (data flow, not just schema)

```
patients (PG) ──┬── triage_sessions (Mongo) ──> risk_assessments (PG)
                ├── appointments (PG) ── queue_entries (PG)
                ├── referrals (PG) ── referral_status_history (PG)
                ├── consultations (PG) ── prescriptions (PG) ── prescription_items (PG)
                ├── diagnostic_orders (PG) ── diagnostic_results (PG) ── documents (PG)
                ├── follow_ups (PG)
                └── notifications (Mongo, fired by triggers on the above)
```

Practical note on the Postgres/Mongo boundary: write to Postgres first (it's your source of truth and has the FK guarantees), then fire the Mongo write (notification, sync ack) from the application layer or an outbox/event table — don't make the Postgres transaction depend on the Mongo write succeeding.

---

## 5. Build-order alignment with your API doc's phases

- **Phase 1 (demo-critical):** users, patients, facilities, doctors, appointments, appointment_slots, consultations, visits, referrals, follow_ups, `triage_sessions` (Mongo)
- **Phase 2:** medicines/facility_medicine_stock, diagnostic_*, queues/queue_entries, notifications (Mongo), risk_assessments, feedback, health_workers dashboards, `health_content` (Mongo)
- **Phase 3:** sync_queue (Mongo), audit_logs partitioning, materialized-view dashboards, facility_search_index (Mongo), FHIR-shaped export layer on top of §2
