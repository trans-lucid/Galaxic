#!/usr/bin/env bash
set -euo pipefail

if command -v act >/dev/null 2>&1 && [ -d .github/workflows ]; then
  act
else
  echo "act is not installed or no workflows were found. Running public tests instead."
  bash translucid/scripts/test-public.sh 2>/dev/null || bash scripts/test-public.sh
fi
