-- Vérification du lot migrations audit œuvre d'artiste (20260526)
-- Exécuter dans le SQL Editor Supabase. Échoue explicitement si un objet manque.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'artist_product_auctions'
      AND column_name = 'winning_bid_id'
  ) THEN
    RAISE EXCEPTION 'MISSING: artist_product_auctions.winning_bid_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'artist_product_auctions'
      AND column_name = 'winner_checkout_order_id'
  ) THEN
    RAISE EXCEPTION 'MISSING: artist_product_auctions.winner_checkout_order_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'artist_product_auctions'
      AND column_name = 'winner_payment_deadline'
  ) THEN
    RAISE EXCEPTION 'MISSING: artist_product_auctions.winner_payment_deadline';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'artist_product_auctions'
      AND column_name = 'winner_notified_at'
  ) THEN
    RAISE EXCEPTION 'MISSING: artist_product_auctions.winner_notified_at';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'create_auction_winner_order'
  ) THEN
    RAISE EXCEPTION 'MISSING: function create_auction_winner_order';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'setup_auction_statuses_cron_job'
  ) THEN
    RAISE EXCEPTION 'MISSING: function setup_auction_statuses_cron_job';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'orders' AND t.tgname = 'trg_fulfill_artist_limited_edition_on_order_paid'
  ) THEN
    RAISE EXCEPTION 'MISSING: trigger trg_fulfill_artist_limited_edition_on_order_paid on orders';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'check_and_increment_artist_product_version'
  ) THEN
    RAISE EXCEPTION 'MISSING: function check_and_increment_artist_product_version';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.notification_templates
    WHERE slug = 'auction_won' AND channel = 'email' AND language = 'fr' AND store_id IS NULL
  ) THEN
    RAISE EXCEPTION 'MISSING: notification_templates auction_won (fr)';
  END IF;

  RAISE NOTICE 'OK: all artist audit migration objects present';
END $$;

-- Historique CLI (informatif)
SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version IN (
  '20260526120500',
  '20260526120100',
  '20260526140000',
  '20260526150000'
)
ORDER BY version;
