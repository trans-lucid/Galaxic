# Dagger Pipeline Scaffolding

The v0.1 CLI and shell preflight path land first. Dagger modules should wrap the
same operations once the generated backend/full-stack repo is stable:

- build generated repo
- start local services
- run public tests
- run hidden evaluator privately
- run candidate-safe scan
- run secret scan
- write readiness report
