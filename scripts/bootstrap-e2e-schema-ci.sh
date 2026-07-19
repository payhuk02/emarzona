#!/usr/bin/env bash
# Bootstrap Emarzona E2E Supabase public schema from production (schema-only, no data).
# Designed for GitHub Actions; also runnable locally with env vars set.
set -euo pipefail

PROD_REF="${PROD_REF:-hbdnzajbyjakdhuavrvb}"
E2E_REF="${E2E_REF:-ufbztturuwwazfcvhvuu}"
POOLER_HOST="${POOLER_HOST:-aws-1-eu-west-2.pooler.supabase.com}"
MIN_PUBLIC_TABLES="${MIN_PUBLIC_TABLES:-500}"

if [ -d /usr/lib/postgresql/17/bin ]; then
  export PATH="/usr/lib/postgresql/17/bin:${PATH}"
fi
PG_DUMP="${PG_DUMP:-pg_dump}"
PSQL="${PSQL:-psql}"

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
  PGPASSWORD="${E2E_SUPABASE_DB_PASSWORD}" psql -h "${POOLER_HOST}" -p 5432 -U "postgres.${E2E_REF}" -d postgres "$@"
}

preflight() {
  echo "Preflight: pg_dump version"
  "${PG_DUMP}" --version
  echo "Preflight: prod connectivity"
  prod_psql -Atc "SELECT current_database(), version();" | head -1
  echo "Preflight: E2E connectivity (pooler ${POOLER_HOST})"
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
  export PGPASSWORD="${SUPABASE_PROD_DB_PASSWORD}"
  prod_psql -Atc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" \
    | xargs -I{} echo "Prod public tables: {}"
  PGPASSWORD="${SUPABASE_PROD_DB_PASSWORD}" "${PG_DUMP}" -h "${POOLER_HOST}" -p 5432 -U "postgres.${PROD_REF}" -d postgres \
    --schema=public --schema-only --no-owner --no-privileges > /tmp/e2e-schema.sql
  sed -i '/^CREATE SCHEMA public;/d' /tmp/e2e-schema.sql
  sed -i '/^COMMENT ON SCHEMA public IS/d' /tmp/e2e-schema.sql
  local lines bytes
  lines=$(wc -l < /tmp/e2e-schema.sql)
  bytes=$(wc -c < /tmp/e2e-schema.sql)
  echo "Schema dump: ${lines} lines, ${bytes} bytes"
}

reset_e2e_public() {
  echo "Resetting E2E public schema via batched drops (one statement per transaction)..."
  e2e_psql -v ON_ERROR_STOP=1 <<'EOSQL'
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;
EOSQL

  {
    e2e_psql -Atc "SELECT format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE;', matviewname) FROM pg_matviews WHERE schemaname = 'public' ORDER BY 1;"
    e2e_psql -Atc "SELECT format('DROP VIEW IF EXISTS public.%I CASCADE;', viewname) FROM pg_views WHERE schemaname = 'public' ORDER BY 1;"
    e2e_psql -Atc "SELECT format('DROP TABLE IF EXISTS public.%I CASCADE;', tablename) FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;"
    e2e_psql -Atc "SELECT format('DROP SEQUENCE IF EXISTS public.%I CASCADE;', sequence_name) FROM information_schema.sequences WHERE sequence_schema = 'public' ORDER BY 1;"
    for _pass in 1 2 3 4 5; do
      e2e_psql -Atc "SELECT format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE;', p.proname, pg_get_function_identity_arguments(p.oid))
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' ORDER BY 1;"
    done
    e2e_psql -Atc "SELECT format('DROP TYPE IF EXISTS public.%I CASCADE;', typname)
      FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype IN ('e', 'c', 'd') ORDER BY 1;"
  } > /tmp/e2e-reset.sql

  local drop_count
  drop_count=$(wc -l < /tmp/e2e-reset.sql)
  echo "Executing ${drop_count} reset statements..."
  e2e_psql -v ON_ERROR_STOP=0 -f /tmp/e2e-reset.sql

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
  echo "Recreating prod-matched extensions on E2E (drop stale installs from prior runs)..."
  e2e_psql -Atc "SELECT format('DROP EXTENSION IF EXISTS %I CASCADE;', extname)
    FROM pg_extension
    WHERE extname NOT IN ('plpgsql')
    ORDER BY extname;" > /tmp/e2e-drop-extensions.sql
  e2e_psql -v ON_ERROR_STOP=0 -f /tmp/e2e-drop-extensions.sql
  e2e_psql -v ON_ERROR_STOP=0 -f /tmp/e2e-extensions.sql
}

apply_prod_schema() {
  echo "Applying prod public schema to E2E (${E2E_REF})..."
  e2e_psql --set ON_ERROR_STOP=1 -f /tmp/e2e-schema.sql
}

restore_supabase_grants() {
  echo "Restoring Supabase GRANTs stripped by pg_dump --no-privileges..."
  e2e_psql -v ON_ERROR_STOP=1 <<'EOSQL'
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated, anon, service_role;
NOTIFY pgrst, 'reload schema';
EOSQL
}

verify_e2e_schema() {
  echo "Verifying E2E schema..."
  e2e_psql -c "SELECT COUNT(*) AS public_tables FROM information_schema.tables WHERE table_schema='public';"
  e2e_psql -c "SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='stores'
  ) AS has_stores;"
  e2e_psql -c "SELECT has_table_privilege('service_role', 'public.stores', 'SELECT') AS service_role_can_select_stores;"
  e2e_psql -c "SELECT has_table_privilege('service_role', 'public.stores', 'INSERT') AS service_role_can_insert_stores;"

  local table_count has_stores can_select can_insert
  table_count=$(e2e_psql -Atc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
  has_stores=$(e2e_psql -Atc "SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='stores'
  );")
  can_select=$(e2e_psql -Atc "SELECT has_table_privilege('service_role', 'public.stores', 'SELECT');")
  can_insert=$(e2e_psql -Atc "SELECT has_table_privilege('service_role', 'public.stores', 'INSERT');")

  if [ "${has_stores}" != "t" ] || [ "${table_count}" -lt "${MIN_PUBLIC_TABLES}" ]; then
    echo "::error::Bootstrap incomplete: public_tables=${table_count} (min ${MIN_PUBLIC_TABLES}), has_stores=${has_stores}"
    exit 1
  fi
  if [ "${can_select}" != "t" ] || [ "${can_insert}" != "t" ]; then
    echo "::error::Bootstrap grants incomplete: service_role stores SELECT=${can_select} INSERT=${can_insert}"
    exit 1
  fi

  echo "OK: E2E schema bootstrapped (${table_count} public tables, stores present, service_role grants OK)."
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
  restore_supabase_grants
  verify_e2e_schema
}

main "$@"
