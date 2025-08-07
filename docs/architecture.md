### System Architecture

- **Frontend**: Next.js (App Router), Tailwind, PostHog
- **Backend**: Supabase (Postgres + Auth + RLS), Edge Functions (for cron/daily quiz), Node workers for agents
- **Agents**: Queue-driven Claude/OpenAI workers for question generation, moderation workflow, QA, and deployment automation
- **Infra**: Vercel for web, Supabase for DB, Redis for queues, Stripe for billing

### Key Data Flows

- **Daily Quiz (FR-01)**
  - At 04:00 local time, a scheduled job materializes a 5-question set per user from `questions` where `approved_at` IS NOT NULL.
  - Users answer; `attempts` are saved with low latency and can be resumed.

- **Resume Incomplete (FR-02)**
  - Client syncs progress every action; server persists to `attempts` within 15s via debounced writes.

- **Teacher Assignments (FR-03)**
  - Teachers create `assignments` for a `group`; linked `assignment_questions` capture the static set.
  - Group members see assignments within 1 minute via subscription or poll.

- **Scholar Approval (FR-04)**
  - `questions` cannot be served unless `approved_at` is set; only `scholar` or `admin` may approve.

### Data Model (MVP+)

- Core tables from PRD plus operational tables: `groups`, `group_members`, `assignments`, `assignment_questions`, `daily_quizzes`, `daily_quiz_questions`, `quiz_sessions`.

### Security & RLS

- RLS defaults to deny; explicit policies:
  - Learners can read approved questions only; write their own `attempts` and `streaks`.
  - Teachers can read attempts of students in their groups.
  - Scholars approve questions.

### Performance & Cost

- P95 < 300 ms by pushing heavy work to background agents, using prepared statements and indexes.
- Cost ≤ 15% MRR via caching, batching AI calls, and reducing token usage with embeddings.

### Deployment

- CI: type-check, SQL lint, unit tests.
- CD: Vercel deploy on main; database migrations gated behind approval.