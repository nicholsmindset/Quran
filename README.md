# Qur’an Verse Challenge

AI-native SaaS to help learners memorise and understand Qur’anic verses via daily quizzes, streaks, and scholar-verified explanations.

## Quickstart

- Prerequisites:
  - Postgres 15+ (Supabase recommended)
  - Node 20+ (frontend/backend to be added in Sprint 2)
  - Redis (for agent queues)
- Environment variables (example `.env`):
  - `SUPABASE_URL=...`
  - `SUPABASE_ANON_KEY=...`
  - `SUPABASE_SERVICE_ROLE_KEY=...`
  - `OPENAI_API_KEY=...`
  - `POSTHOG_API_KEY=...`
  - `STRIPE_SECRET_KEY=...`
  - `REDIS_URL=redis://...`

### Database

1) Apply schema

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

2) Seed minimal content

```bash
psql "$DATABASE_URL" -f db/seed/seed.sql
```

3) Verify RLS

- Ensure queries as anonymous user cannot read unapproved questions.
- Ensure a teacher can read attempts of their group members.

## Project Structure

- `db/` — SQL schema, RLS, helper functions, seeds
- `api/` — OpenAPI spec and (later) route handlers
- `docs/` — Architecture, decisions, runbooks
- `agents/` — Agent roles and queue contracts

## Milestones (from PRD)

- Sprint 0: Repo, Vercel, Supabase, CI
- Sprint 1: DB schema, auth flow, verse seeding
- Sprint 2: Quiz API, basic Next.js pages
- Sprint 3: Scholar moderation UI, invites
- Sprint 4: Daily challenge cron, progress dashboard
- Sprint 5: QA hardening, load test, open beta
- Sprint 6: Payments, public launch
