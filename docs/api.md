### API Guide

See `api/openapi.yaml` for the complete contract.

Key endpoints:
- GET `/v1/quiz/daily` — 5 approved questions for the day
- GET `/v1/quiz/resume` — current session progress
- POST `/v1/quiz/attempts` — record an answer
- POST `/v1/groups` — create a group (teacher)
- POST/GET `/v1/groups/{groupId}/assignments` — manage/list assignments
- GET `/v1/moderation/questions/pending` — list pending approvals (scholar)
- POST `/v1/moderation/questions/{id}/approve` — approve question

Auth:
- Bearer JWT (Supabase). Client uses anon key to get session; server uses service role for privileged ops.