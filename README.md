# translucid-eval-base

`translucid-eval-base` is the public modular environment base used by
Translucid's Lucy to generate focused, candidate-ready technical evaluation
repositories.

This repository is not an interview challenge by itself. It is a reusable
environment grammar: Lucy composes language overlays, domain profiles, service
modules, local emulators, mock APIs, safety checks, and preview metadata into a
small job-specific repo.

## Core Principle

Generate the smallest useful environment for the role.

Do not create a giant always-on environment. Generated repos should include only
the tools and services required for the challenge.

## v0.1 Scope

The first production slice supports:

- Node.js / TypeScript, Python, SQL/Postgres, Terraform/OpenTofu, Java, Go,
  Rust, .NET, PHP, Ruby, and shell detection
- `backend-api`, `web-fullstack`, `data-sql`, `cloud-iac`, `api-contract`, and
  `security-readiness` profiles
- Postgres, Redis, WireMock, Caddy, LocalStack, pgTAP placeholders, and local
  routing modules
- `translucid-environment.json` and `translucid-preview.json` generation
- candidate-safe scans, secret scans, readiness reports, and local preflight

## Candidate Command Contract

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

For non-Node targets, Lucy should also generate a `Makefile` with equivalent
targets.

## Public Safety Rules

This public repo must never include:

- company source code
- real interview tasks
- hidden tests
- private evaluator or solution material
- candidate data
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

## Repository Layers

1. Core runtime: Dev Containers, Codespaces compatibility, scripts, schemas, and
   security checks.
2. Language overlays: detection and command metadata for common stacks.
3. Domain profiles: role-shaped service and workflow bundles.
4. Generated repos: focused candidate environments with public tests, safe
   fixtures, local services, previews, and readiness reports.
