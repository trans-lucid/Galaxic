#!/usr/bin/env bash
set -euo pipefail

REPORT="${1:-galaxic-readiness-report.md}"

{
  echo "# Galaxic Readiness Report"
  echo
  echo "Status: TODO"
  echo
  echo "## Required checks"
  echo
  echo "- [ ] Environment manifest exists"
  echo "- [ ] Preview manifest exists"
  echo "- [ ] Candidate-safe scan passes"
  echo "- [ ] Secret scan passes"
  echo "- [ ] Public tests behave as intended"
  echo "- [ ] Private solution passes public tests"
  echo "- [ ] Private solution passes hidden tests"
  echo "- [ ] Shortcut negative-control fails hidden tests"
  echo "- [ ] Candidate setup commands work"
  echo "- [ ] Local services boot"
  echo "- [ ] Credential policy is declared"
  echo "- [ ] Limitations are documented"
} > "$REPORT"

echo "Wrote $REPORT"
