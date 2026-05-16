# Credential Policy

Default mode is no production credentials.

Candidate environments must use local dummy values such as:

```env
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
DATABASE_URL=postgres://postgres:postgres@postgres:5432/app
REDIS_URL=redis://redis:6379
SUPABASE_URL=http://localhost:54321
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

Candidate branches must never contain production cloud keys, service-account
JSON, production Supabase keys, Render API keys, production database URLs,
Stripe live keys, GitHub tokens, Slack tokens, or CRM tokens.

Credentialed-private mode is allowed only in the private evaluator, Translucid
control plane, or recruiter-approved smoke tests. It must be declared in
`translucid-environment.json`.
