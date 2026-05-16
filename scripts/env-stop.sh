#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-compose.translucid.yml}"
docker compose -f "$COMPOSE_FILE" down --remove-orphans || true
