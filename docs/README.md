# SwasthyaSetu — PS 26133 (SIH 2026 Internal)

Integrated care-access and quality-monitoring platform for rural/underserved public healthcare, built for Govt. of Maharashtra's SIH problem statement 26133.

> Working name only — rename freely across these docs once you settle on a project name.

## Docs

All product, architecture, schema, API, auth, folder-structure, and convention decisions live in [`AGENTS.md`](./AGENTS.md) and [`docs/`](./docs). That's true whether you're a human contributor or an AI coding agent — read `AGENTS.md` first.

- [docs/01-product-overview.md](./docs/01-product-overview.md) — problem statement, roles, MVP phasing
- [docs/02-architecture.md](./docs/02-architecture.md) — system architecture, data-store rationale, auth flow, offline sync
- [docs/03-database-schema.md](./docs/03-database-schema.md) — Postgres schema, Mongo collections, Redis/BullMQ layout
- [docs/04-api-specification.md](./docs/04-api-specification.md) — full REST contract
- [docs/05-auth-rbac.md](./docs/05-auth-rbac.md) — auth flow + role permission matrix
- [docs/06-folder-structure.md](./docs/06-folder-structure.md) — frontend + backend layout
- [docs/07-coding-conventions.md](./docs/07-coding-conventions.md) — response format, validation, layering, git conventions
- [docs/08-env-config.md](./docs/08-env-config.md) — environment variable reference

## Stack

Next.js · Node.js/Express · PostgreSQL (Supabase) via Prisma · Supabase Auth (server-mediated only) · MongoDB · Redis · BullMQ · Socket.IO
