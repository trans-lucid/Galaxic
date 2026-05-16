#!/usr/bin/env bash
set -euo pipefail

REPORT="${1:-galaxic-readiness-report.md}"
STATUS_ROWS=()
FAILURES=0

record_pass() {
  STATUS_ROWS+=("| PASS | $1 | $2 |")
}

record_fail() {
  STATUS_ROWS+=("| FAIL | $1 | $2 |")
  FAILURES=$((FAILURES + 1))
}

record_skip() {
  STATUS_ROWS+=("| SKIP | $1 | $2 |")
}

check_file() {
  local label="$1"
  local file="$2"

  if [ -f "$file" ]; then
    record_pass "$label" "$file"
  else
    record_fail "$label" "Missing $file"
  fi
}

check_executable() {
  local label="$1"
  local file="$2"

  if [ -x "$file" ]; then
    record_pass "$label" "$file"
  else
    record_fail "$label" "Missing executable $file"
  fi
}

run_check() {
  local label="$1"
  shift

  local output
  if output="$("$@" 2>&1)"; then
    record_pass "$label" "Command passed"
  else
    record_fail "$label" "$(printf '%s' "$output" | tail -n 1)"
  fi
}

script_path() {
  local script_name="$1"

  if [ -f "galaxic/scripts/$script_name" ]; then
    printf '%s\n' "galaxic/scripts/$script_name"
  elif [ -f "scripts/$script_name" ]; then
    printf '%s\n' "scripts/$script_name"
  else
    printf '%s\n' ""
  fi
}

COMPOSE_FILE="${COMPOSE_FILE:-compose.galaxic.yml}"
GENERATED_CONTEXT=false

if [ -d "galaxic/scripts" ] || [ -f "galaxic-environment.json" ] || [ -f "$COMPOSE_FILE" ]; then
  GENERATED_CONTEXT=true
fi

if [ "$GENERATED_CONTEXT" = true ]; then
  check_file "Environment manifest" "galaxic-environment.json"
  check_file "Preview manifest" "galaxic-preview.json"
else
  record_skip "Environment manifest" "not running inside a generated repo"
  record_skip "Preview manifest" "not running inside a generated repo"
fi

if [ -f "$COMPOSE_FILE" ]; then
  record_pass "Compose file" "$COMPOSE_FILE"
  if command -v docker >/dev/null 2>&1; then
    run_check "Compose config" docker compose -f "$COMPOSE_FILE" config
  else
    record_skip "Compose config" "docker is not installed"
  fi
else
  record_skip "Compose file" "$COMPOSE_FILE not present"
fi

DOCTOR_SCRIPT="$(script_path doctor.sh)"
SAFE_SCRIPT="$(script_path candidate-safe-scan.sh)"
SECRET_SCRIPT="$(script_path secret-scan.sh)"

if [ -n "$DOCTOR_SCRIPT" ]; then
  check_executable "Doctor script" "$DOCTOR_SCRIPT"
else
  record_fail "Doctor script" "doctor.sh not found"
fi

if [ -n "$SAFE_SCRIPT" ]; then
  run_check "Candidate-safe scan" bash "$SAFE_SCRIPT"
else
  record_fail "Candidate-safe scan" "candidate-safe-scan.sh not found"
fi

if [ -n "$SECRET_SCRIPT" ]; then
  run_check "Secret scan" bash "$SECRET_SCRIPT"
else
  record_fail "Secret scan" "secret-scan.sh not found"
fi

if [ "$GENERATED_CONTEXT" = true ] && [ -f package.json ] && command -v node >/dev/null 2>&1; then
  run_check "Package command contract" node -e "const pkg=require('./package.json'); const required=['env:start','env:stop','env:reset','dev','test','ci:local','deploy:dry-run','doctor']; for (const script of required) { if (!pkg.scripts?.[script]) throw new Error('missing package script ' + script); }"
else
  record_skip "Package command contract" "not running inside a generated repo"
fi

if [ "$GENERATED_CONTEXT" = true ] && [ -f package.json ] && command -v npm >/dev/null 2>&1; then
  run_check "Public tests" npm run test --silent
else
  record_skip "Public tests" "not running inside a generated repo"
fi

{
  echo "# Galaxic Readiness Report"
  echo
  if [ "$FAILURES" -eq 0 ]; then
    echo "Status: PASS"
  else
    echo "Status: FAIL"
  fi
  echo
  echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo
  echo "| Status | Check | Detail |"
  echo "| --- | --- | --- |"
  printf '%s\n' "${STATUS_ROWS[@]}"
} > "$REPORT"

echo "Wrote $REPORT"

if [ "$FAILURES" -gt 0 ]; then
  exit 1
fi
