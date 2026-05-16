#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXAMPLE_DIR="$ROOT_DIR/examples/cloud-iac-localstack-opentofu"
TMP_ROOT="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

TARGET_DIR="$TMP_ROOT/generated-cloud-iac-example"

echo "Running cloud IaC example smoke test"

npm run build --prefix "$ROOT_DIR"

node "$ROOT_DIR/cli/dist/index.js" detect --source "$EXAMPLE_DIR" --json \
  | node -e "let input=''; process.stdin.on('data', chunk => input += chunk); process.stdin.on('end', () => { const ids=JSON.parse(input).detected_languages.map((language) => language.id); if (!ids.includes('terraform-hcl')) throw new Error('terraform-hcl was not detected'); if (!ids.includes('shell-devops')) throw new Error('shell-devops was not detected'); });"

node "$ROOT_DIR/cli/dist/index.js" create \
  --source "$EXAMPLE_DIR" \
  --target "$TARGET_DIR" \
  --role cloud-iac \
  --profiles cloud-iac,security-readiness \
  --force

node "$ROOT_DIR/cli/dist/index.js" validate --cwd "$TARGET_DIR"
docker compose -f "$TARGET_DIR/compose.galaxic.yml" config >/dev/null
npm --prefix "$TARGET_DIR" run test
npm --prefix "$TARGET_DIR" run candidate-safe-scan
npm --prefix "$TARGET_DIR" run readiness

node -e "const fs=require('fs'); const vars=fs.readFileSync('$TARGET_DIR/infra/opentofu/variables.tf','utf8'); if(!vars.includes('galaxic-example-artifacts')) throw new Error('source OpenTofu files were not preserved');"
node -e "const fs=require('fs'); const report=fs.readFileSync('$TARGET_DIR/galaxic-readiness-report.md','utf8'); if(!report.includes('Status: PASS')) throw new Error('readiness report did not pass');"

echo "Cloud IaC example smoke test passed"
