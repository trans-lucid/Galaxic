#!/usr/bin/env bash
set -euo pipefail

if command -v gitleaks >/dev/null 2>&1; then
  CONFIG_ARG=()
  if [ -f security/gitleaks.toml ]; then
    CONFIG_ARG=(--config security/gitleaks.toml)
  elif [ -f translucid/security/gitleaks.toml ]; then
    CONFIG_ARG=(--config translucid/security/gitleaks.toml)
  fi

  gitleaks detect --source . --no-git --redact "${CONFIG_ARG[@]}"
else
  echo "gitleaks is not installed; skipping secret scan in this local shell."
fi
