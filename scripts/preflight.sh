#!/usr/bin/env bash
set -euo pipefail

echo "Translucid preflight"

bash scripts/doctor.sh
bash scripts/candidate-safe-scan.sh
bash scripts/secret-scan.sh

if [ -f compose.translucid.yml ]; then
  if command -v docker >/dev/null 2>&1; then
    bash scripts/env-start.sh
  else
    echo "Docker is unavailable; skipping service startup."
  fi
fi

bash scripts/test-public.sh
bash scripts/deploy-dry-run.sh

echo "Preflight complete"
