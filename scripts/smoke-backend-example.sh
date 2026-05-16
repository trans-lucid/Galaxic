#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXAMPLE_DIR="$ROOT_DIR/examples/backend-express-openapi-postgres"
TMP_ROOT="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

TARGET_DIR="$TMP_ROOT/generated-backend-example"

echo "Running backend example smoke test"

npm --prefix "$EXAMPLE_DIR" test
npm run build --prefix "$ROOT_DIR"

node "$ROOT_DIR/cli/dist/index.js" create \
  --source "$EXAMPLE_DIR" \
  --target "$TARGET_DIR" \
  --role backend-api \
  --profiles backend-api,api-contract,security-readiness \
  --force

node "$ROOT_DIR/cli/dist/index.js" validate --cwd "$TARGET_DIR"
docker compose -f "$TARGET_DIR/compose.galaxic.yml" config >/dev/null
npm --prefix "$TARGET_DIR" run test
npm --prefix "$TARGET_DIR" run test:app
npm --prefix "$TARGET_DIR" run candidate-safe-scan

node -e "const fs=require('fs'); const openapi=fs.readFileSync('$TARGET_DIR/api/openapi.yaml','utf8'); if(!openapi.includes('Galaxic Backend API Example')) throw new Error('source OpenAPI was not preserved');"

echo "Backend example smoke test passed"
