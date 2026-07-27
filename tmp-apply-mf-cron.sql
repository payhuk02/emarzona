-- Apply cron setup function only (avoid full db push of broken historical migrations)
\i supabase/migrations/20260723110000__moneyfusion_reconciliation_cron.sql
