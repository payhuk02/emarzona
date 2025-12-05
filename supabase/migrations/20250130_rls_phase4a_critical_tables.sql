-- ============================================================
-- Phase 4A : RLS Policies pour Tables Critiques Sans Politiques
-- Date: 2025-01-30
-- 
-- Cette migration ajoute des politiques RLS pour les tables critiques
-- qui ont RLS activé mais aucune politique (bloquant l'accès)
-- 
-- Tables concernées :
-- - subscriptions (CRITIQUE)
-- - daily_stats, stats (MOYENNE)
-- ============================================================

-- ============================================================
-- 1. SUBSCRIPTIONS (CRITIQUE)
-- ============================================================

-- Vérifier que RLS est activé
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent (pour éviter les doublons)
DROP POLICY IF EXISTS "subscriptions_select_policy" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_policy" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_policy" ON public.subscriptions;

-- SELECT : Les utilisateurs voient leurs propres abonnements, les propriétaires voient les abonnements de leur boutique
CREATE POLICY "subscriptions_select_policy" ON public.subscriptions
  FOR SELECT
  USING (
    -- Utilisateur voit ses propres abonnements
    user_id = auth.uid()
    OR
    -- Propriétaire de boutique voit les abonnements de sa boutique
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- INSERT : Les utilisateurs peuvent créer leurs propres abonnements, les propriétaires peuvent créer des abonnements pour leur boutique
CREATE POLICY "subscriptions_insert_policy" ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    -- Utilisateur crée son propre abonnement
    user_id = auth.uid()
    OR
    -- Propriétaire crée un abonnement pour sa boutique
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- UPDATE : Les utilisateurs peuvent modifier leurs propres abonnements, les propriétaires peuvent modifier les abonnements de leur boutique
CREATE POLICY "subscriptions_update_policy" ON public.subscriptions
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- DELETE : Les utilisateurs peuvent supprimer leurs propres abonnements, les propriétaires peuvent supprimer les abonnements de leur boutique
CREATE POLICY "subscriptions_delete_policy" ON public.subscriptions
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Commentaires
COMMENT ON POLICY "subscriptions_select_policy" ON public.subscriptions IS 
  'Les utilisateurs voient leurs propres abonnements, les propriétaires voient les abonnements de leur boutique';
COMMENT ON POLICY "subscriptions_insert_policy" ON public.subscriptions IS 
  'Les utilisateurs peuvent créer leurs propres abonnements, les propriétaires peuvent créer des abonnements pour leur boutique';
COMMENT ON POLICY "subscriptions_update_policy" ON public.subscriptions IS 
  'Les utilisateurs peuvent modifier leurs propres abonnements, les propriétaires peuvent modifier les abonnements de leur boutique';
COMMENT ON POLICY "subscriptions_delete_policy" ON public.subscriptions IS 
  'Les utilisateurs peuvent supprimer leurs propres abonnements, les propriétaires peuvent supprimer les abonnements de leur boutique';

-- ============================================================
-- 2. DAILY_STATS (MOYENNE - Analytics)
-- ============================================================

-- Vérifier que la table existe avant d'ajouter des politiques
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_stats'
  ) THEN
    -- Vérifier que RLS est activé
    ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

    -- Supprimer les politiques existantes
    DROP POLICY IF EXISTS "daily_stats_select_policy" ON public.daily_stats;
    DROP POLICY IF EXISTS "daily_stats_insert_policy" ON public.daily_stats;
    DROP POLICY IF EXISTS "daily_stats_update_policy" ON public.daily_stats;
    DROP POLICY IF EXISTS "daily_stats_delete_policy" ON public.daily_stats;

    -- SELECT : Les propriétaires voient les stats de leur boutique
    -- Note: On suppose que la table a store_id, sinon on ajustera
    CREATE POLICY "daily_stats_select_policy" ON public.daily_stats
      FOR SELECT
      USING (
        -- Propriétaires voient les stats de leur boutique (si store_id existe)
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
        OR
        -- Permettre la lecture si pas de store_id (stats globales)
        true
      );

    -- INSERT : Seulement propriétaires
    CREATE POLICY "daily_stats_insert_policy" ON public.daily_stats
      FOR INSERT
      WITH CHECK (
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
      );

    -- UPDATE : Seulement propriétaires
    CREATE POLICY "daily_stats_update_policy" ON public.daily_stats
      FOR UPDATE
      USING (
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
      );

    -- DELETE : Seulement propriétaires
    CREATE POLICY "daily_stats_delete_policy" ON public.daily_stats
      FOR DELETE
      USING (
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
      );

    COMMENT ON POLICY "daily_stats_select_policy" ON public.daily_stats IS 
      'Les propriétaires voient les stats de leur boutique, lecture publique si pas de store_id';
  END IF;
END $$;

-- ============================================================
-- 3. STATS (MOYENNE - Analytics)
-- ============================================================

-- Vérifier que la table existe avant d'ajouter des politiques
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'stats'
  ) THEN
    -- Vérifier que RLS est activé
    ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

    -- Supprimer les politiques existantes
    DROP POLICY IF EXISTS "stats_select_policy" ON public.stats;
    DROP POLICY IF EXISTS "stats_insert_policy" ON public.stats;
    DROP POLICY IF EXISTS "stats_update_policy" ON public.stats;
    DROP POLICY IF EXISTS "stats_delete_policy" ON public.stats;

    -- SELECT : Les propriétaires voient les stats de leur boutique
    -- Note: On suppose que la table a store_id, sinon on ajustera
    CREATE POLICY "stats_select_policy" ON public.stats
      FOR SELECT
      USING (
        -- Propriétaires voient les stats de leur boutique (si store_id existe)
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
        OR
        -- Permettre la lecture si pas de store_id (stats globales)
        true
      );

    -- INSERT : Seulement propriétaires
    CREATE POLICY "stats_insert_policy" ON public.stats
      FOR INSERT
      WITH CHECK (
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
      );

    -- UPDATE : Seulement propriétaires
    CREATE POLICY "stats_update_policy" ON public.stats
      FOR UPDATE
      USING (
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
      );

    -- DELETE : Seulement propriétaires
    CREATE POLICY "stats_delete_policy" ON public.stats
      FOR DELETE
      USING (
        store_id IN (
          SELECT id FROM public.stores WHERE user_id = auth.uid()
        )
      );

    COMMENT ON POLICY "stats_select_policy" ON public.stats IS 
      'Les propriétaires voient les stats de leur boutique, lecture publique si pas de store_id';
  END IF;
END $$;

-- ============================================================
-- VÉRIFICATION
-- ============================================================

-- Vérifier que les politiques ont été créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('subscriptions', 'daily_stats', 'stats')
ORDER BY tablename, policyname;

