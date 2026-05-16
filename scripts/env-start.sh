#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-compose.translucid.yml}"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "No $COMPOSE_FILE found."
  echo "Generate one with: translucid-env create --target ."
  exit 1
fi

docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
