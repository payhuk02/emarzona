#!/usr/bin/env bash
# Emarzona — Deploy cache enterprise (Linux/macOS/CI)
# Usage: ./scripts/deploy-cache-enterprise.sh [--interactive]

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

INTERACTIVE=false
SKIP_MIGRATION=false
SKIP_EDGE=false
SKIP_VERCEL=false
SKIP_SECRETS=false

for arg in "$@"; do
  case "$arg" in
    --interactive) INTERACTIVE=true ;;
    --skip-migration) SKIP_MIGRATION=true ;;
    --skip-edge) SKIP_EDGE=true ;;
    --skip-vercel) SKIP_VERCEL=true ;;
    --skip-secrets) SKIP_SECRETS=true ;;
  esac
done

SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-hbdnzajbyjakdhuavrvb}"
SITE_URL="${SITE_URL:-https://www.emarzona.com}"

rand_hex() { openssl rand -hex 32; }

if [[ "$INTERACTIVE" == true ]]; then
  read -r -p "CACHE_INVALIDATION_SECRET (empty=auto): " CACHE_SECRET_IN
  CACHE_INVALIDATION_SECRET="${CACHE_SECRET_IN:-$(rand_hex)}"
  read -r -p "UPSTASH_REDIS_REST_URL: " UPSTASH_REDIS_REST_URL
  read -r -s -p "UPSTASH_REDIS_REST_TOKEN: " UPSTASH_REDIS_REST_TOKEN
  echo
else
  CACHE_INVALIDATION_SECRET="${CACHE_INVALIDATION_SECRET:-$(rand_hex)}"
fi

CRON_SECRET="${CRON_SECRET:-$(rand_hex)}"

echo "=== Emarzona — Deploy Cache Enterprise ==="

if [[ "$SKIP_VERCEL" != true ]]; then
  echo "[1/4] Vercel env..."
  for target in production preview; do
    npx --yes vercel@latest env add CACHE_INVALIDATION_SECRET "$target" --value "$CACHE_INVALIDATION_SECRET" --yes --force
    npx --yes vercel@latest env add CRON_SECRET "$target" --value "$CRON_SECRET" --yes --force
    [[ -n "${UPSTASH_REDIS_REST_URL:-}" ]] && npx --yes vercel@latest env add UPSTASH_REDIS_REST_URL "$target" --value "$UPSTASH_REDIS_REST_URL" --yes --force
    [[ -n "${UPSTASH_REDIS_REST_TOKEN:-}" ]] && npx --yes vercel@latest env add UPSTASH_REDIS_REST_TOKEN "$target" --value "$UPSTASH_REDIS_REST_TOKEN" --yes --force
  done
fi

if [[ "$SKIP_SECRETS" != true ]]; then
  echo "[2/4] Supabase secrets..."
  npx --yes supabase secrets set "CACHE_INVALIDATION_SECRET=$CACHE_INVALIDATION_SECRET" --project-ref "$SUPABASE_PROJECT_REF"
  npx --yes supabase secrets set "CRON_SECRET=$CRON_SECRET" --project-ref "$SUPABASE_PROJECT_REF"
  npx --yes supabase secrets set "SITE_URL=$SITE_URL" --project-ref "$SUPABASE_PROJECT_REF"
  [[ -n "${UPSTASH_REDIS_REST_URL:-}" ]] && npx --yes supabase secrets set "UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL" --project-ref "$SUPABASE_PROJECT_REF"
  [[ -n "${UPSTASH_REDIS_REST_TOKEN:-}" ]] && npx --yes supabase secrets set "UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN" --project-ref "$SUPABASE_PROJECT_REF"
fi

if [[ "$SKIP_EDGE" != true ]]; then
  echo "[3/4] Edge functions..."
  npx --yes supabase functions deploy cache-invalidate --project-ref "$SUPABASE_PROJECT_REF"
  npx --yes supabase functions deploy cache-warm --project-ref "$SUPABASE_PROJECT_REF"
fi

if [[ "$SKIP_MIGRATION" != true ]]; then
  echo "[4/4] Trigger SQL..."
  TEMP_SQL="$(mktemp)"
  sed -e "s/{{CACHE_INVALIDATION_SECRET}}/$CACHE_INVALIDATION_SECRET/g" \
      -e "s/{{SUPABASE_PROJECT_REF}}/$SUPABASE_PROJECT_REF/g" \
      scripts/sql/cache-invalidate-trigger.template.sql > "$TEMP_SQL"
  npx --yes supabase db execute --file "$TEMP_SQL" --project-ref "$SUPABASE_PROJECT_REF" || echo "WARN: db execute failed — apply manually"
  rm -f "$TEMP_SQL"
fi

echo ""
echo "DONE. Secrets:"
echo "  CACHE_INVALIDATION_SECRET=$CACHE_INVALIDATION_SECRET"
echo "  CRON_SECRET=$CRON_SECRET"
echo "Next: supabase db push && vercel --prod"
