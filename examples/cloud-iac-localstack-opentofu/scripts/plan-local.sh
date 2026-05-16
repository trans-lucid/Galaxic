#!/usr/bin/env bash
set -euo pipefail

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"

cd "$(dirname "${BASH_SOURCE[0]}")/../infra/opentofu"
tofu init -backend=false
tofu plan
