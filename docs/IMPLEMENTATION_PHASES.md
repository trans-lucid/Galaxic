# Implementation Phases

## Phase 1: Skeleton And Schemas

Deliver repo structure, schemas, README/security docs, base devcontainer, basic
scripts, profile metadata, compose modules, and CLI package scaffolding.

Acceptance:

- repo opens in Codespaces
- `scripts/doctor.sh` runs
- JSON schemas validate sample manifests

## Phase 2: CLI Detection And Planning

Implement stack, language, service, CI, and profile planning.

Acceptance:

- detects Node, Python, SQL, Terraform, Java, Go, Rust, .NET, PHP, Ruby, and
  shell evidence
- writes detection evidence
- selects reasonable default profiles for `backend-api` and `web-fullstack`

## Phase 3: Compose/Profile Generation

Implement devcontainer, compose, preview, package scripts, generated README, and
environment manifest generation.

Acceptance:

- generates a focused backend API repo
- generated compose config validates
- generated manifests validate against schemas

## Phase 4: Web/Backend/Data/Cloud Profiles

Implement the first production profiles and examples.

Acceptance:

- examples run
- public tests run
- LocalStack/OpenTofu validates
- SQL pgTAP example validates
- WireMock example works

## Phase 5: Safety And Readiness

Implement candidate-safe scans, secret scans, RED/GREEN preflight hooks,
negative-control hooks, and readiness reports.

Acceptance:

- planted secret fixture fails
- planted private material fixture fails
- readiness report is generated
- candidate branch rules are enforced

## Phase 6: Supabase/Render/Firebase

Implement Supabase local, render-shim, and Firebase local profiles.

## Phase 7: Expansion Profiles

Add ML/LLM-light, design frontend, GTM automation, local Kubernetes, and
expanded language overlays after the first generated repo works end-to-end.
