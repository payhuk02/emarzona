#!/usr/bin/env bash
# Apply idempotent E2E schema patches via direct Postgres (no prod credentials required).
# Retries on catalog races when multiple Playwright jobs apply patches in parallel.
set -euo pipefail

E2E_REF="${E2E_REF:-ufbztturuwwazfcvhvuu}"
POOLER_HOST="${POOLER_HOST:-aws-1-eu-west-2.pooler.supabase.com}"
PATCH_FILE="${BASH_SOURCE%/*}/e2e-post-bootstrap-patches.sql"
MAX_ATTEMPTS="${E2E_PATCH_MAX_ATTEMPTS:-5}"

if [ -z "${E2E_SUPABASE_DB_PASSWORD:-}" ]; then
  echo "E2E_SUPABASE_DB_PASSWORD not set — skipping inline E2E schema patches"
  exit 0
fi

if [ ! -f "${PATCH_FILE}" ]; then
  echo "::error::Missing patch file: ${PATCH_FILE}"
  exit 1
fi

echo "Applying E2E post-bootstrap patches on ${E2E_REF} via pooler..."

attempt=1
while [ "${attempt}" -le "${MAX_ATTEMPTS}" ]; do
  set +e
  output="$(
    PGPASSWORD="${E2E_SUPABASE_DB_PASSWORD}" psql \
      -h "${POOLER_HOST}" \
      -p 5432 \
      -U "postgres.${E2E_REF}" \
      -d postgres \
      -v ON_ERROR_STOP=1 \
      -f "${PATCH_FILE}" 2>&1
  )"
  status=$?
  set -e
  echo "${output}"

  if [ "${status}" -eq 0 ]; then
    echo "OK: e2e-post-bootstrap-patches.sql applied on ${E2E_REF}"
    exit 0
  fi

  if echo "${output}" | grep -qiE 'tuple concurrently updated|deadlock detected'; then
    sleep_s=$((attempt * 2))
    echo "::warning::E2E patch catalog race (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${sleep_s}s..."
    sleep "${sleep_s}"
    attempt=$((attempt + 1))
    continue
  fi

  echo "::error::E2E schema patches failed with exit ${status}"
  exit "${status}"
done

echo "::error::E2E schema patches failed after ${MAX_ATTEMPTS} attempts (catalog race)"
exit 1
