# Master Implementation Plan

## Objective

Build `translucid-eval-base`, the public modular environment base Lucy uses to
create focused, job-specific technical evaluation repositories.

The base repo must let Lucy compose:

- language overlays
- domain profiles
- local service modules
- local cloud emulators
- API mocks
- CI/CD dry-runs
- deployment dry-runs
- preview tabs
- candidate safety checks
- solve-first readiness gates

## Architecture

### Layer 1: Core Runtime

Dev Container base, Codespaces compatibility, Docker support, common scripts,
Dagger scaffolding, local CI helpers, and safety checks.

### Layer 2: Language Overlays

Language overlays are selected only when needed. v0.1 prioritizes
Node/TypeScript, Python, SQL, Terraform/HCL, shell, Java, Go, Rust, .NET, PHP,
and Ruby.

### Layer 3: Domain Profiles

Profiles represent role-shaped environments:

- `web-fullstack`
- `backend-api`
- `data-sql`
- `cloud-iac`
- `api-contract`
- `supabase-local`
- `firebase-local`
- `render-shim`
- `ml-llm-light`
- `security-readiness`
- `design-frontend`
- `gtm-automation`

### Layer 4: Generated Repos

Lucy generates candidate repos containing selected overlays, selected compose
modules, a focused devcontainer, `compose.translucid.yml`,
`translucid-environment.json`, `translucid-preview.json`, candidate scripts,
safe mocks, public tests, and a candidate README.

## Fork / Use Policy

Do not fork major third-party projects by default. Use upstream projects as
pinned images, pinned CLI releases, pinned package dependencies, Dev Container
Features, thin wrappers, and generated local config.

Fork only when Translucid needs an unavoidable patch, upstream licensing or
packaging blocks candidate-safe use, the project is abandoned and critical,
security hardening requires an internal variant, or deep product integration
cannot be achieved through wrappers.

## v0.1 Priority

v0.1 must produce working examples for:

- Next/Vite plus API plus Postgres
- Express/FastAPI/Spring/Go API plus Postgres
- SQL plus pgTAP
- OpenTofu plus LocalStack
- API contract plus WireMock
- Supabase local scaffolding

The first serious milestone is a generated backend/full-stack repo with
Node/TypeScript, Postgres, Redis, WireMock, Caddy, manifests, public tests,
candidate-safe scans, secret scans, and a readiness report.
