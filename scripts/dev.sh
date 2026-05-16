#!/usr/bin/env bash
set -euo pipefail

if [ -f package.json ] && command -v jq >/dev/null 2>&1; then
  if jq -e '.scripts.dev' package.json >/dev/null 2>&1; then
    npm run dev
    exit $?
  fi
fi

if [ -f pyproject.toml ] || [ -f requirements.txt ]; then
  if command -v uvicorn >/dev/null 2>&1; then
    uvicorn app.main:app --host 0.0.0.0 --reload
    exit $?
  fi
fi

echo "No generated dev command is configured yet."
