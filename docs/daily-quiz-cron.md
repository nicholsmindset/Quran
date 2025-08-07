### Daily Quiz Cron (FR-01)

Goal: Present a 5-question daily quiz by 04:00 local time per user, from approved questions only.

Approach:
- Store user timezone (future: `users.timezone`), default to region-level if missing.
- Scheduler triggers per region at 03:55 local time to materialize quizzes by 04:00.
- Materialize to `daily_quizzes` and `daily_quiz_questions` via service role (bypass RLS) or generate on-demand with a deterministic selection seed.

Pseudocode:
```sql
-- materialize_day(user_id uuid, quiz_date date, limit_count int default 5)
insert into public.daily_quizzes (user_id, quiz_date)
values (p_user_id, p_date)
on conflict (user_id, quiz_date) do update set quiz_date = excluded.quiz_date
returning id into v_daily_quiz_id;

insert into public.daily_quiz_questions (daily_quiz_id, question_id, position)
select v_daily_quiz_id, q.id, row_number() over ()
from public.questions q
where q.approved_at is not null
order by random()
limit limit_count;
```

Serving:
- GET `/v1/quiz/daily` reads from materialized tables if present; else generates once and caches.

Notes:
- Ensure idempotency via unique (user_id, quiz_date).
- Add observability (count of successful materializations per region; retry on failure).