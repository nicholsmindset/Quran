### Security and Compliance

- Authentication: Supabase Auth (JWT) with short-lived access tokens; refresh via rotating refresh tokens.
- Authorization: Strict RLS on all tables; deny-by-default policies.
- Roles: `learner`, `teacher`, `scholar`, `admin` with least-privilege mapping.
- PII: emails and minimal profile fields in `users`; no plaintext secrets in DB.
- Data in transit: HTTPS/TLS everywhere.
- Data at rest: PostgreSQL disk encryption (cloud provider); encrypted backups.
- Access control: Service role keys only in server-side functions; never in client.
- Audit: Postgres logs for writes to `questions`, `attempts`, `assignments`; enable pgAudit in prod.
- GDPR/PDPA: Data export and deletion endpoints; 30-day retention for raw logs; configurable data retention for attempts.
- Secrets: Managed via environment variables and secret manager in CI/CD.
- Third-party: DPA with OpenAI, PostHog, Stripe; region selection to minimise cross-border transfers.