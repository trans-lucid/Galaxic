#!/usr/bin/env bash
set -euo pipefail

echo "Running generated public tests"

if [ -x tests/public/run.sh ]; then
  bash tests/public/run.sh
  exit $?
fi

if [ -f package.json ] && command -v jq >/dev/null 2>&1; then
  if jq -e '.scripts["test:app"]' package.json >/dev/null 2>&1; then
    npm run test:app
    exit $?
  fi

  TEST_SCRIPT="$(jq -r '.scripts.test // empty' package.json)"
  if [ -n "$TEST_SCRIPT" ] \
    && [ "$TEST_SCRIPT" != "bash galaxic/scripts/test-public.sh" ] \
    && [ "$TEST_SCRIPT" != "bash scripts/test-public.sh" ]; then
    npm test
    exit $?
  fi
fi

if [ -f pyproject.toml ] || [ -f requirements.txt ]; then
  python -m pytest
  exit $?
fi

if [ -f go.mod ]; then
  go test ./...
  exit $?
fi

if [ -f Cargo.toml ]; then
  cargo test
  exit $?
fi

echo "No known public test command detected."
