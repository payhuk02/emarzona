#!/usr/bin/env bash
# Sanitize apt sources, then install Playwright browsers + OS deps.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bash "$ROOT/scripts/ci-sanitize-apt-sources.sh"
npx playwright install --with-deps "$@"
