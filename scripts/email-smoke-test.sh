#!/usr/bin/env bash
# Email system smoke test — Emarzona
# export SUPABASE_URL=https://hbdnzajbyjakdhuavrvb.supabase.co
# export SUPABASE_ANON_KEY="eyJ..."
# export CRON_SECRET="..."
# ./scripts/email-smoke-test.sh

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-hbdnzajbyjakdhuavrvb}"
BASE_URL="${SUPABASE_URL:-https://${PROJECT_REF}.supabase.co}"
TEST_EMAIL="${TEST_EMAIL:-smoke-test-unsub@emarzona.invalid}"
USE_CLI="${USE_SUPABASE_CLI:-1}"

PASS=0
FAIL=0
SKIP=0

pass() { echo "[PASS] $1"; [[ -n "${2:-}" ]] && echo "       $2"; PASS=$((PASS+1)); }
fail() { echo "[FAIL] $1"; [[ -n "${2:-}" ]] && echo "       $2"; FAIL=$((FAIL+1)); }
skip() { echo "[SKIP] $1 — $2"; SKIP=$((SKIP+1)); }

echo ""
echo "=== Emarzona Email Smoke Test ==="
echo "Project: $PROJECT_REF"
echo ""

if [[ "$USE_CLI" == "1" ]] && command -v npx &>/dev/null; then
  if npx supabase db query --linked "SELECT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'record_email_unsubscribe') AS ok;" -o json 2>/dev/null | grep -q '"ok":true\|"ok": true'; then
    pass "SQL: record_email_unsubscribe RPC"
  else
    fail "SQL: record_email_unsubscribe RPC"
  fi

  if npx supabase db query --linked "SELECT count(*)::int AS c FROM cron.job WHERE jobname IN ('process-scheduled-email-campaigns','process-email-sequences','abandoned-cart-recovery') AND active = true;" -o json 2>/dev/null | grep -q '"c":3\|"c": 3'; then
    pass "SQL: email crons active (3 jobs)"
  else
    fail "SQL: email crons active"
  fi
else
  skip "SQL checks" "npx supabase linked or USE_SUPABASE_CLI=0"
fi

if [[ -n "${SUPABASE_ANON_KEY:-}" ]]; then
  HTTP_CODE=$(curl -s -o /tmp/emarzona-unsub.json -w "%{http_code}" \
    -X POST "${BASE_URL}/rest/v1/rpc/record_email_unsubscribe" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"p_email\":\"${TEST_EMAIL}\",\"p_unsubscribe_type\":\"marketing\",\"p_reason\":\"smoke-test\"}")
  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "204" ]]; then
    pass "REST: anon record_email_unsubscribe" "$TEST_EMAIL"
  else
    fail "REST: anon record_email_unsubscribe" "HTTP $HTTP_CODE $(cat /tmp/emarzona-unsub.json 2>/dev/null)"
  fi
else
  skip "REST anon RPC" "SUPABASE_ANON_KEY not set"
fi

if [[ -n "${CRON_SECRET:-}" ]]; then
  for fn in process-scheduled-campaigns process-email-sequences; do
    CODE=$(curl -s -o /tmp/emarzona-edge.json -w "%{http_code}" \
      -X POST "${BASE_URL}/functions/v1/${fn}" \
      -H "x-cron-secret: ${CRON_SECRET}" \
      -H "Content-Type: application/json" \
      -d "{}")
    if [[ "$CODE" =~ ^2 ]]; then
      pass "Edge: $fn" "HTTP $CODE"
    else
      fail "Edge: $fn" "HTTP $CODE"
    fi
  done
else
  skip "Edge cron functions" "CRON_SECRET not set"
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "${BASE_URL}/functions/v1/resend-webhook-handler")
if [[ "$CODE" =~ ^2 ]]; then
  pass "Edge: resend-webhook-handler reachable" "HTTP $CODE"
else
  fail "Edge: resend-webhook-handler" "HTTP $CODE"
fi

echo ""
echo "=== Summary === Passed: $PASS  Failed: $FAIL  Skipped: $SKIP"
[[ "$FAIL" -eq 0 ]]
