-- Test de vérification de l'existence des fonctions
-- Date : Janvier 2026

-- Vérifier que les fonctions nécessaires existent
DO $$
BEGIN
  -- Vérifier l'existence de generate_short_link_code
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'generate_short_link_code'
  ) THEN
    RAISE EXCEPTION 'Fonction generate_short_link_code n''existe pas';
  END IF;

  -- Vérifier l'existence de track_short_link_click
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'track_short_link_click'
  ) THEN
    RAISE EXCEPTION 'Fonction track_short_link_click n''existe pas';
  END IF;

  -- Vérifier l'existence de la table affiliate_short_links
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_short_links'
  ) THEN
    RAISE EXCEPTION 'Table affiliate_short_links n''existe pas';
  END IF;

  RAISE NOTICE '✓ Toutes les fonctions et tables nécessaires existent';
END $$;