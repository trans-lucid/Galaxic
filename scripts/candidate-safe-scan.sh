#!/usr/bin/env bash
set -euo pipefail

echo "Candidate-safe scan"

FORBIDDEN_PATH_PATTERNS=(
  "./private/solution"
  "./private/evaluator"
  "./hidden"
  "./hidden-tests"
  "./.env"
  "./.env.local"
  "./.env.production"
  "./service-account.json"
  "./gcp-service-account.json"
)

for path in "${FORBIDDEN_PATH_PATTERNS[@]}"; do
  if [ -e "$path" ]; then
    echo "Forbidden candidate-facing path found: $path"
    exit 1
  fi
done

if find . \
  -path ./.git -prune -o \
  -iname "*service-account*.json" -print | grep -q .; then
  echo "Forbidden service account JSON found"
  exit 1
fi

if find . \
  -path ./.git -prune -o \
  -type f \( -iname "*solution*.md" -o -iname "*hidden*test*" \) -print | grep -q .; then
  echo "Potential private solution or hidden test material found. Review required."
  exit 1
fi

echo "Candidate-safe scan complete"
