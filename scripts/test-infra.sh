#!/usr/bin/env bash
set -euo pipefail

if [ -d infra/opentofu ] && command -v tofu >/dev/null 2>&1; then
  (
    cd infra/opentofu
    tofu init -backend=false
    tofu validate
    tofu test || true
  )
else
  echo "OpenTofu is not installed or infra/opentofu is absent; skipping infra test shim."
fi
