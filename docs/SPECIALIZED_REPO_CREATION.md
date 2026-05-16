# Specialized Repo Creation

Galaxic creates focused repos, not generic bloated repos.

Example:

```bash
galaxic create \
  --role backend-api \
  --languages node-typescript,sql \
  --profiles backend-api,api-contract,security-readiness \
  --target ../generated-backend-eval
```

Generated repos should include:

```txt
.devcontainer/devcontainer.json
compose.galaxic.yml
galaxic-environment.json
galaxic-preview.json
galaxic/scripts/*
galaxic/mocks/*
tests/public/*
README.md
package.json or Makefile command contract
```

Dynamic dimensions include language, domain, local service modules, CI/CD
dry-runs, deployment shims, local cloud emulators, API mocks, and preview tabs.
