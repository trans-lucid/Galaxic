# Master Implementation Plan

## Objective

Build Galaxic as a public modular environment base: a reusable grammar for
composing focused, job-specific repositories.

Galaxic must support:

- language overlays
- domain profiles
- local service modules
- local cloud emulators
- API mocks
- CI/CD dry-runs
- deployment dry-runs
- preview tabs
- safety checks
- readiness gates

## Architecture

### Layer 1: Core Runtime

Dev Container base, Codespaces compatibility, Docker support, common scripts,
local CI helpers, Dagger scaffolding, manifest schemas, and safety checks.

### Layer 2: Language Overlays

Language overlays are selected only when needed. v0.1 prioritizes
Node/TypeScript, Python, SQL, Terraform/HCL, shell, Java, Go, Rust, .NET, PHP,
and Ruby.

### Layer 3: Domain Profiles

Profiles represent job-shaped environments:

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

Generated repos contain selected overlays, selected Compose modules, a focused
devcontainer, `compose.galaxic.yml`, `galaxic-environment.json`,
`galaxic-preview.json`, command scripts, safe mocks, public tests, and a
README.

## Fork / Use Policy

Do not fork major third-party projects by default. Use upstream projects as
pinned images, pinned CLI releases, pinned package dependencies, Dev Container
Features, thin wrappers, and generated local config.

Fork only when an unavoidable patch is needed, upstream licensing or packaging
blocks safe use, the project is abandoned and critical, security hardening
requires an internal variant, or deep product integration cannot be achieved
through wrappers.

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
