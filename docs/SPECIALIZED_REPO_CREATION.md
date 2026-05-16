# Specialized Repo Creation

Lucy must create focused repos, not generic bloated repos.

Example:

```bash
translucid-env create \
  --role backend-api \
  --languages node-typescript,sql \
  --profiles backend-api,api-contract,security-readiness \
  --target ../generated-backend-eval
```

Generated repos should include:

```txt
.devcontainer/devcontainer.json
compose.translucid.yml
translucid-environment.json
translucid-preview.json
translucid/scripts/*
translucid/mocks/*
tests/public/*
README.md
package.json or Makefile command contract
```

Dynamic dimensions include language, domain, local service modules, CI/CD
dry-runs, deployment shims, local cloud emulators, API mocks, and preview tabs.
