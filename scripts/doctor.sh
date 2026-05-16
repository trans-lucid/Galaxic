#!/usr/bin/env bash
set -euo pipefail

echo "Translucid doctor check"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    return 1
  fi
}

need git
need node
need npm

if command -v docker >/dev/null 2>&1; then
  docker --version
else
  echo "Docker is not installed or not available in this shell."
fi

git --version
node --version
npm --version

echo "Doctor complete"
