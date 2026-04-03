-- Migration pour corriger les problèmes RLS et les requêtes de gamification
-- Date: 2 Février 2025
-- Objectif: Ajouter les politiques RLS manquantes et créer une fonction pour initialiser la gamification

-- =====================================================
-- 1. AJOUTER POLITIQUE RLS INSERT POUR user_gamification
-- =====================================================

-- Permettre aux utilisateurs d'insérer leur propre entrée de gamification
DROP POLICY IF EXISTS "users_insert_own_gamification" ON public.user_gamification;
CREATE POLICY "users_insert_own_gamification" ON public.user_gamification
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permettre aux utilisateurs de mettre à jour leur propre gamification
DROP POLICY IF EXISTS "users_update_own_gamification" ON public.user_gamification;
CREATE POLICY "users_update_own_gamification" ON public.user_gamification
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 2. CRÉER FONCTION POUR INITIALISER LA GAMIFICATION
-- =====================================================

-- Supprimer toutes les versions existantes de la fonction
-- Utiliser une requête dynamique pour supprimer toutes les signatures possibles
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Trouver et supprimer toutes les versions de la fonction
  FOR r IN 
    SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
    FROM pg_proc
    WHERE proname = 'initialize_user_gamification'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    BEGIN
      EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', r.proname, r.args);
    EXCEPTION
      WHEN OTHERS THEN
        -- Ignorer les erreurs de suppression
        NULL;
    END;
  END LOOP;
END $$;

-- Fonction simplifiée pour initialiser ou récupérer la gamification d'un utilisateur
-- Retourne directement depuis la table (plus simple et compatible)
CREATE FUNCTION public.initialize_user_gamification(p_user_id UUID)
RETURNS SETOF public.user_gamification
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gamification public.user_gamification;
BEGIN
  -- Essayer de récupérer l'entrée existante
  SELECT * INTO v_gamification
  FROM public.user_gamification
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Si elle n'existe pas, en créer une nouvelle
  IF NOT FOUND THEN
    INSERT INTO public.user_gamification (
      user_id,
      total_points,
      experience_points,
      current_level,
      experience_points_to_next_level,
      points_earned_today,
      points_earned_this_week,
      points_earned_this_month,
      current_streak_days,
      longest_streak_days,
      last_activity_date,
      total_products_purchased,
      total_orders_completed,
      total_reviews_written,
      total_referrals,
      total_badges_earned,
      total_achievements_unlocked
    ) VALUES (
      p_user_id,
      0, -- total_points
      0, -- experience_points
      1, -- current_level
      100, -- experience_points_to_next_level
      0, -- points_earned_today
      0, -- points_earned_this_week
      0, -- points_earned_this_month
      0, -- current_streak_days
      0, -- longest_streak_days
      CURRENT_DATE, -- last_activity_date
      0, -- total_products_purchased
      0, -- total_orders_completed
      0, -- total_reviews_written
      0, -- total_referrals
      0, -- total_badges_earned
      0 -- total_achievements_unlocked
    )
    RETURNING * INTO v_gamification;
  END IF;

  -- Retourner les données
  RETURN NEXT v_gamification;
  RETURN;
EXCEPTION
  WHEN unique_violation THEN
    -- Si l'entrée existe déjà (race condition), la récupérer
    SELECT * INTO v_gamification
    FROM public.user_gamification
    WHERE user_id = p_user_id
    LIMIT 1;
    
    IF FOUND THEN
      RETURN NEXT v_gamification;
    END IF;
    RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.initialize_user_gamification(UUID) TO authenticated;

-- =====================================================
-- 3. AMÉLIORER LES POLITIQUES RLS EXISTANTES
-- =====================================================

-- S'assurer que la politique public_view_gamification_leaderboard permet bien de voir les données nécessaires
-- (Elle existe déjà avec USING (TRUE), donc pas besoin de la modifier)

-- S'assurer que les politiques RLS sont correctes
-- Supprimer et recréer les politiques pour éviter les conflits

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "users_view_own_gamification" ON public.user_gamification;
DROP POLICY IF EXISTS "public_view_gamification_leaderboard" ON public.user_gamification;

-- Recréer la politique pour les utilisateurs de voir leur propre gamification
CREATE POLICY "users_view_own_gamification" ON public.user_gamification
  FOR SELECT
  USING (auth.uid() = user_id);

-- Recréer la politique publique pour le leaderboard (doit permettre à tous de voir)
-- IMPORTANT: Cette politique doit permettre l'accès même aux utilisateurs non authentifiés
CREATE POLICY "public_view_gamification_leaderboard" ON public.user_gamification
  FOR SELECT
  USING (TRUE); -- TRUE permet à tous (authentifiés et non authentifiés) de voir les données

-- Vérifier que les politiques sont bien créées
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies 
  WHERE tablename = 'user_gamification' 
  AND schemaname = 'public';
  
  IF v_policy_count < 2 THEN
    RAISE WARNING 'Only % policies found for user_gamification, expected at least 2', v_policy_count;
  END IF;
END $$;

-- =====================================================
-- 4. CRÉER VUE POUR LEADERBOARD (OPTIONNEL, POUR PERFORMANCE)
-- =====================================================

-- Vue pour faciliter les requêtes de leaderboard avec les profils
CREATE OR REPLACE VIEW public.gamification_leaderboard_view AS
SELECT 
  ug.user_id,
  ug.total_points,
  ug.current_level,
  ug.current_streak_days,
  ug.total_products_purchased,
  p.display_name,
  p.first_name,
  p.last_name,
  p.avatar_url,
  COALESCE(p.display_name, 
           TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), 
           'Utilisateur') AS user_name
FROM public.user_gamification ug
LEFT JOIN public.profiles p ON p.user_id = ug.user_id
ORDER BY ug.total_points DESC;

-- Grant select permission to authenticated users and anonymous
GRANT SELECT ON public.gamification_leaderboard_view TO authenticated;
GRANT SELECT ON public.gamification_leaderboard_view TO anon;

-- S'assurer que la vue est accessible même sans authentification
-- (nécessaire pour le leaderboard public)

-- Commentaire sur la vue
COMMENT ON VIEW public.gamification_leaderboard_view IS 'Vue optimisée pour le leaderboard de gamification avec les données de profil';

