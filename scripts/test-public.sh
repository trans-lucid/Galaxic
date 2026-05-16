#!/usr/bin/env bash
set -euo pipefail

echo "Running generated public tests"

if [ -f package.json ] && command -v jq >/dev/null 2>&1; then
  if jq -e '.scripts.test' package.json >/dev/null 2>&1; then
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
