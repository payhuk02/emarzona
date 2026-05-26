-- =============================================================================
-- Emarzona — Lot migrations audit œuvre d'artiste (20260526)
-- Préféré : supabase db push (applique les fichiers dans supabase/migrations/)
--
-- Fichiers (ordre) :
--   20260526120500__artist_edition_reserve_pending_commit_on_paid.sql  (H-01)
--   20260526120100__auction_winner_order_checkout.sql                  (H-03)
--   20260526140000__artist_auction_cron_and_notifications.sql          (cron)
--   20260526150000__auction_notification_templates.sql                   (templates)
--
-- Puis : supabase/scripts/verify_artist_audit_migrations.sql
-- Puis : SELECT setup_auction_statuses_cron_job('PROJECT_REF', 'CRON_SECRET');
-- =============================================================================

BEGIN;

-- Enregistrer dans l'historique CLI si appliqué manuellement via Dashboard
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES
  ('20260526120500'),
  ('20260526120100'),
  ('20260526140000'),
  ('20260526150000')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- NOTE: Ce script n'inclut pas le DDL complet (trop volumineux).
-- Exécutez d'abord les 4 fichiers de migration listés ci-dessus, puis ce INSERT,
-- ou utilisez uniquement `supabase db push` qui gère version + DDL automatiquement.
