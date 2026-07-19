#!/usr/bin/env bash
# Bootstrap Emarzona E2E Supabase public schema from production (schema-only, no data).
# Designed for GitHub Actions; also runnable locally with env vars set.
set -euo pipefail

PROD_REF="${PROD_REF:-hbdnzajbyjakdhuavrvb}"
E2E_REF="${E2E_REF:-ufbztturuwwazfcvhvuu}"
POOLER_HOST="${POOLER_HOST:-aws-1-eu-west-2.pooler.supabase.com}"
E2E_DIRECT_HOST="db.${E2E_REF}.supabase.co"
MIN_PUBLIC_TABLES="${MIN_PUBLIC_TABLES:-500}"

require_env() {
  if [ -z "${SUPABASE_PROD_DB_PASSWORD:-}" ] || [ -z "${E2E_SUPABASE_DB_PASSWORD:-}" ]; then
    echo "::error::Set GitHub secrets SUPABASE_PROD_DB_PASSWORD and E2E_SUPABASE_DB_PASSWORD (Dashboard > Database password)."
    exit 1
  fi
}

prod_psql() {
  PGPASSWORD="${SUPABASE_PROD_DB_PASSWORD}" psql -h "${POOLER_HOST}" -p 5432 -U "postgres.${PROD_REF}" -d postgres "$@"
}

e2e_psql() {
  PGPASSWORD="${E2E_SUPABASE_DB_PASSWORD}" psql -h "${E2E_DIRECT_HOST}" -p 5432 -U postgres -d postgres "$@"
}

preflight() {
  echo "Preflight: pg_dump version"
  pg_dump --version
  echo "Preflight: prod connectivity"
  prod_psql -Atc "SELECT current_database(), version();" | head -1
  echo "Preflight: E2E connectivity (direct DB ${E2E_DIRECT_HOST})"
  e2e_psql -Atc "SELECT current_database(), version();" | head -1
}

collect_prod_extensions() {
  echo "Collecting prod extensions (schema-matched)..."
  prod_psql -Atc \
    "SELECT format('CREATE EXTENSION IF NOT EXISTS %I WITH SCHEMA %I;', e.extname, n.nspname)
     FROM pg_extension e
     JOIN pg_namespace n ON n.oid = e.extnamespace
     WHERE e.extname NOT IN ('plpgsql')
     ORDER BY e.extname;" > /tmp/e2e-extensions.sql
  echo "Prod extensions to enable on E2E:"
  cat /tmp/e2e-extensions.sql
}

dump_prod_public_schema() {
  echo "Dumping prod public schema (schema-only, no data)..."
  prod_psql -Atc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" \
    | xargs -I{} echo "Prod public tables: {}"
  pg_dump -h "${POOLER_HOST}" -p 5432 -U "postgres.${PROD_REF}" -d postgres \
    --schema=public --schema-only --no-owner --no-privileges > /tmp/e2e-schema.sql
  sed -i '/^CREATE SCHEMA public;/d' /tmp/e2e-schema.sql
  sed -i '/^COMMENT ON SCHEMA public IS/d' /tmp/e2e-schema.sql
  local lines bytes
  lines=$(wc -l < /tmp/e2e-schema.sql)
  bytes=$(wc -c < /tmp/e2e-schema.sql)
  echo "Schema dump: ${lines} lines, ${bytes} bytes"
}

reset_e2e_public() {
  echo "Resetting E2E public schema via batched drops (direct DB, avoids lock limits)..."
  e2e_psql -v ON_ERROR_STOP=1 <<'EOSQL'
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;

DO $$
DECLARE
  r RECORD;
  remaining INTEGER;
BEGIN
  FOR r IN (SELECT matviewname FROM pg_matviews WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE', r.matviewname);
  END LOOP;

  FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', r.viewname);
  END LOOP;

  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
  END LOOP;

  FOR r IN (
    SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
  ) LOOP
    EXECUTE format('DROP SEQUENCE IF EXISTS public.%I CASCADE', r.sequence_name);
  END LOOP;

  -- Functions can depend on each other; repeat until none remain.
  LOOP
    remaining := 0;
    FOR r IN (
      SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
    ) LOOP
      remaining := remaining + 1;
      EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', r.proname, r.args);
    END LOOP;
    EXIT WHEN remaining = 0;
  END LOOP;

  FOR r IN (
    SELECT typname FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype IN ('e', 'c', 'd')
  ) LOOP
    EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
  END LOOP;
END $$;
EOSQL

  local tables funcs
  tables=$(e2e_psql -Atc "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';")
  funcs=$(e2e_psql -Atc "SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public';")
  echo "After reset: public tables=${tables}, public functions=${funcs}"
  if [ "${tables}" != "0" ] || [ "${funcs}" != "0" ]; then
    echo "::error::E2E public schema reset incomplete (tables=${tables}, functions=${funcs})"
    exit 1
  fi
}

enable_e2e_extensions() {
  echo "Enabling prod-matched extensions on E2E..."
  e2e_psql -v ON_ERROR_STOP=0 -f /tmp/e2e-extensions.sql
}

apply_prod_schema() {
  echo "Applying prod public schema to E2E (${E2E_REF})..."
  e2e_psql --set ON_ERROR_STOP=1 -f /tmp/e2e-schema.sql
}

verify_e2e_schema() {
  echo "Verifying E2E schema..."
  e2e_psql -c "SELECT COUNT(*) AS public_tables FROM information_schema.tables WHERE table_schema='public';"
  e2e_psql -c "SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='stores'
  ) AS has_stores;"

  local table_count has_stores
  table_count=$(e2e_psql -Atc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
  has_stores=$(e2e_psql -Atc "SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='stores'
  );")

  if [ "${has_stores}" != "t" ] || [ "${table_count}" -lt "${MIN_PUBLIC_TABLES}" ]; then
    echo "::error::Bootstrap incomplete: public_tables=${table_count} (min ${MIN_PUBLIC_TABLES}), has_stores=${has_stores}"
    exit 1
  fi

  echo "OK: E2E schema bootstrapped (${table_count} public tables, stores present)."
  echo "Next locally: npx supabase link --project-ref ${E2E_REF} && npx supabase migration repair --status applied"
}

main() {
  require_env
  preflight
  collect_prod_extensions
  dump_prod_public_schema
  reset_e2e_public
  enable_e2e_extensions
  apply_prod_schema
  verify_e2e_schema
}

main "$@"
