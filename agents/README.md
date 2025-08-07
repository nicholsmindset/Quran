### Agents Overview

- PM Agent: stories/specs; backlog priority
- Backend Agent: schema, APIs, tests
- Frontend Agent: Next.js UI, state, E2E
- AI-Question Agent: verse fetch, distractor generation, tagging
- Scholar-Validation Agent: moderation queue and approvals
- QA Agent: unit/integration/load/accessibility tests
- DevOps Agent: CI/CD, deploys, cost guardrails

All agents coordinate via Redis task queue; sub-agents run in parallel where safe.