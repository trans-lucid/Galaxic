#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@localhost:5432/app}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is not installed; skipping SQL test shim."
  exit 0
fi

if [ -f database/pgtap/001_example.sql ]; then
  psql "$DATABASE_URL" -f database/pgtap/001_example.sql
else
  echo "No pgTAP test file found."
fi
