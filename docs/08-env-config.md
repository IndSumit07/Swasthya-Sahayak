# 08 — Environment Configuration

No actual secret values here — this is the reference for what each variable is, and which app uses it. Keep real values only in each app's untracked `.env`; commit `.env.example` with keys and placeholder/dummy values only.

## 1. `backend/.env`

| Variable | Purpose |
|---|---|
| `PORT` | Express server port |
| `NODE_ENV` | `development` \| `production` |
| `DATABASE_URL` | Postgres connection string (Supabase), used by Prisma |
| `DIRECT_URL` | Non-pooled Postgres connection, for Prisma migrations against Supabase's pooler |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Backend only, never shipped to any frontend bundle.** Used for Supabase Auth Admin API calls and privileged Storage operations. |
| `SUPABASE_JWT_SECRET` | For local JWT verification of access tokens without a round-trip to Supabase, if used instead of `getUser()` |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB_NAME` | Database name within the Mongo cluster |
| `REDIS_URL` | Redis connection string, shared by cache + BullMQ + Socket.IO adapter |
| `SESSION_COOKIE_SECRET` | Signs/encrypts session-related cookies set by the backend/BFF |
| `CORS_ORIGIN` | Allowed frontend origin(s) |
| `SMS_PROVIDER_API_KEY` / `SMS_PROVIDER_SENDER_ID` | OTP + notification SMS delivery |
| `PUSH_NOTIFICATION_SERVER_KEY` | Push notification provider (e.g. FCM) |
| `STORAGE_BUCKET_DOCUMENTS` | Supabase Storage bucket name for patient documents/diagnostic results — private bucket, accessed only via signed URLs |
| `IDEMPOTENCY_KEY_TTL_SECONDS` | How long a used `Idempotency-Key` is remembered in Redis (default 86400) |
| `RATE_LIMIT_OTP_WINDOW_SECONDS` / `RATE_LIMIT_OTP_MAX` | OTP endpoint rate limiting |
| `LOG_LEVEL` | Logging verbosity |

## 2. `frontend/.env` (Next.js)

Split strictly by prefix — anything without `NEXT_PUBLIC_` never reaches the browser bundle, and per the architecture rules, **nothing Supabase-related should ever be `NEXT_PUBLIC_`.**

| Variable | Purpose | Exposed to browser? |
|---|---|---|
| `BACKEND_API_URL` | Internal URL the Next.js server uses to reach Express (e.g. `http://backend:4000` in Docker, or the deployed service URL) | No — server-only |
| `SESSION_COOKIE_NAME` | Name of the httpOnly cookie holding the session | No |
| `SESSION_COOKIE_SECRET` | Must match the backend's, if cookies are signed/verified on the Next.js side too | No |
| `NEXT_PUBLIC_APP_NAME` | Display name, non-sensitive | Yes |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `en` \| `hi` \| `mr` | Yes |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO endpoint the browser connects to directly (auth still happens via a short-lived token issued by the backend, not a Supabase key) | Yes |

**Explicitly absent from the frontend env, on purpose:** `SUPABASE_URL`, any Supabase key, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`. If an agent finds itself adding one of these to `frontend/.env.example`, that's a sign the task drifted into violating `AGENTS.md` rule #1 — stop and re-route the call through the backend instead.

## 3. Local development infra

Not secrets, but worth standardizing so agents don't invent inconsistent defaults across generated `docker-compose.yml` files:

| Service | Local default |
|---|---|
| Postgres (if not using hosted Supabase even locally) | via Supabase CLI (`supabase start`) — gives you Postgres + Auth + Storage locally with matching URLs/keys |
| MongoDB | `mongodb://localhost:27017` |
| Redis | `redis://localhost:6379` |
