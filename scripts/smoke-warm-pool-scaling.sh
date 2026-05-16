#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STARTER_DIR="$ROOT_DIR/examples/aws-warm-pool-scaling/starter"
REFERENCE_DIR="$ROOT_DIR/examples/aws-warm-pool-scaling/reference"
TMP_ROOT="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

STARTER_TARGET="$TMP_ROOT/generated-warm-pool-starter"
REFERENCE_TARGET="$TMP_ROOT/generated-warm-pool-reference"

echo "Running warm pool scaling challenge smoke test"

npm run build --prefix "$ROOT_DIR"

node "$ROOT_DIR/cli/dist/index.js" detect --source "$STARTER_DIR" --json \
  | node -e "let input=''; process.stdin.on('data', chunk => input += chunk); process.stdin.on('end', () => { const ids=JSON.parse(input).detected_languages.map((language) => language.id); for (const required of ['node-typescript','terraform-hcl','shell-devops']) { if (!ids.includes(required)) throw new Error(required + ' was not detected'); } });"

node "$ROOT_DIR/cli/dist/index.js" create \
  --source "$STARTER_DIR" \
  --target "$STARTER_TARGET" \
  --role cloud-iac \
  --profiles cloud-iac,security-readiness \
  --force

node "$ROOT_DIR/cli/dist/index.js" validate --cwd "$STARTER_TARGET"
docker compose -f "$STARTER_TARGET/compose.galaxic.yml" config >/dev/null

if npm --prefix "$STARTER_TARGET" test; then
  echo "Expected starter challenge tests to fail before implementation."
  exit 1
fi

npm --prefix "$STARTER_TARGET" run candidate-safe-scan

node "$ROOT_DIR/cli/dist/index.js" create \
  --source "$REFERENCE_DIR" \
  --target "$REFERENCE_TARGET" \
  --role cloud-iac \
  --profiles cloud-iac,security-readiness \
  --force

node "$ROOT_DIR/cli/dist/index.js" validate --cwd "$REFERENCE_TARGET"
docker compose -f "$REFERENCE_TARGET/compose.galaxic.yml" config >/dev/null
npm --prefix "$REFERENCE_TARGET" test
npm --prefix "$REFERENCE_TARGET" run candidate-safe-scan
npm --prefix "$REFERENCE_TARGET" run readiness

node -e "const fs=require('fs'); const main=fs.readFileSync('$REFERENCE_TARGET/infra/opentofu/main.tf','utf8'); if(!main.includes('warm_pool')) throw new Error('reference warm pool was not preserved');"
node -e "const fs=require('fs'); const report=fs.readFileSync('$REFERENCE_TARGET/galaxic-readiness-report.md','utf8'); if(!report.includes('Status: PASS')) throw new Error('reference readiness report did not pass');"

echo "Warm pool scaling challenge smoke test passed"
