#!/usr/bin/env bash
set -euo pipefail

echo "Deployment dry-run"
echo "This command must never call production cloud APIs in candidate mode."

if [ -f render.yaml ]; then
  echo "Render config detected. Render shim validation will be used when enabled."
fi

if [ -d infra/opentofu ] && command -v tofu >/dev/null 2>&1; then
  (cd infra/opentofu && tofu validate)
fi

echo "Deployment dry-run complete"
