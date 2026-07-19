#!/usr/bin/env bash
# Apply idempotent E2E schema patches via direct Postgres (no prod credentials required).
set -euo pipefail

E2E_REF="${E2E_REF:-ufbztturuwwazfcvhvuu}"
POOLER_HOST="${POOLER_HOST:-aws-1-eu-west-2.pooler.supabase.com}"
PATCH_FILE="${BASH_SOURCE%/*}/e2e-post-bootstrap-patches.sql"

if [ -z "${E2E_SUPABASE_DB_PASSWORD:-}" ]; then
  echo "E2E_SUPABASE_DB_PASSWORD not set — skipping inline E2E schema patches"
  exit 0
fi

if [ ! -f "${PATCH_FILE}" ]; then
  echo "::error::Missing patch file: ${PATCH_FILE}"
  exit 1
fi

echo "Applying E2E post-bootstrap patches on ${E2E_REF} via pooler..."
PGPASSWORD="${E2E_SUPABASE_DB_PASSWORD}" psql \
  -h "${POOLER_HOST}" \
  -p 5432 \
  -U "postgres.${E2E_REF}" \
  -d postgres \
  -v ON_ERROR_STOP=1 \
  -f "${PATCH_FILE}"

echo "OK: e2e-post-bootstrap-patches.sql applied on ${E2E_REF}"
