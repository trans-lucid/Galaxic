#!/usr/bin/env bash
set -euo pipefail

if [ -f api/openapi.yaml ]; then
  echo "OpenAPI file present: api/openapi.yaml"
fi

if [ -n "${MOCK_API_URL:-}" ]; then
  curl -fsS "$MOCK_API_URL/__admin" >/dev/null || {
    echo "Mock API is not reachable at $MOCK_API_URL"
    exit 1
  }
fi

echo "API test shim complete"
