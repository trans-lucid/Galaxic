# Galaxic

Galaxic is a public modular environment base: a reusable environment grammar for
composing language overlays, domain profiles, service modules, local emulators,
mock APIs, safety checks, and preview metadata into small job-specific
repositories.

The repo is not a challenge, task, or application by itself. It is a clean base
for generating focused local development and evaluation environments without
shipping a giant always-on stack.

## Core Principle

Generate the smallest useful environment for the job.

Use only the tools and services required for the target workflow. A backend API
repo should not inherit ML notebooks; an IaC repo should not inherit Storybook;
a frontend repo should not boot LocalStack unless it needs it.

## v0.1 Scope

The first production slice supports:

- Node.js / TypeScript, Python, SQL/Postgres, Terraform/OpenTofu, Java, Go,
  Rust, .NET, PHP, Ruby, and shell detection
- `backend-api`, `web-fullstack`, `data-sql`, `cloud-iac`, `api-contract`, and
  `security-readiness` profiles
- Postgres, Redis, WireMock, Caddy, LocalStack, pgTAP placeholders, and local
  routing modules
- `galaxic-environment.json` and `galaxic-preview.json` generation
- candidate-safe scans, secret scans, readiness reports, and local preflight

## Command Contract

Every generated repo should expose:

```bash
npm run env:start
npm run env:stop
npm run env:reset
npm run dev
npm run test
npm run ci:local
npm run deploy:dry-run
npm run doctor
```

For non-Node targets, generated repos should also include a `Makefile` with
equivalent targets.

## Public Safety Rules

This public repo must never include:

- company source code
- private job tasks
- hidden tests
- private evaluator or solution material
- user or candidate data
- production credentials or production `.env` files
- service-account JSON
- runtime artifacts containing secrets

## Example Generation Flow

```bash
npm run build
node cli/dist/index.js create \
  --role backend-api \
  --languages node-typescript,sql \
  --profiles backend-api,api-contract,security-readiness \
  --target ./tmp/generated-backend-eval
```

The CLI also exposes the `galaxic` binary when installed from the workspace.

## Repository Layers

1. Core runtime: Dev Containers, Codespaces compatibility, scripts, schemas, and
   security checks.
2. Language overlays: detection and command metadata for common stacks.
3. Domain profiles: job-shaped service and workflow bundles.
4. Generated repos: focused environments with public tests, safe fixtures, local
   services, previews, and readiness reports.
