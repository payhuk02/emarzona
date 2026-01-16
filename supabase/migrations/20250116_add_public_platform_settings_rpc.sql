-- ============================================================
-- RPC Functions : Accès public aux paramètres de plateforme
-- Date: 2025-01-16
--
-- Créer des fonctions RPC pour permettre l'accès aux données
-- de personnalisation sans nécessiter les droits admin complets.
-- ============================================================

-- ============================================================
-- 1. Fonction pour récupérer les paramètres de personnalisation publique
-- ============================================================

CREATE OR REPLACE FUNCTION get_public_platform_settings(setting_key TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Pour les clés publiques, retourner les données
  IF setting_key IN ('customization', 'ai_recommendation_settings') THEN
    SELECT settings INTO result
    FROM platform_settings
    WHERE key = setting_key;

    RETURN result;
  END IF;

  -- Pour les autres clés, vérifier les droits admin
  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    SELECT settings INTO result
    FROM platform_settings
    WHERE key = setting_key;

    RETURN result;
  END IF;

  -- Retourner null si pas autorisé
  RETURN NULL;
END;
$$;

-- ============================================================
-- 2. Fonction pour récupérer les paramètres d'IA accessibles publiquement
-- ============================================================

CREATE OR REPLACE FUNCTION get_ai_recommendation_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Récupérer les paramètres d'IA (accessibles aux utilisateurs authentifiés)
  SELECT settings INTO result
  FROM platform_settings
  WHERE key = 'ai_recommendation_settings';

  RETURN result;
END;
$$;

-- ============================================================
-- 3. Fonction pour récupérer la personnalisation publique
-- ============================================================

CREATE OR REPLACE FUNCTION get_platform_customization()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Récupérer la personnalisation (accessibles aux utilisateurs authentifiés)
  SELECT settings INTO result
  FROM platform_settings
  WHERE key = 'customization';

  RETURN result;
END;
$$;

-- ============================================================
-- Permissions
-- ============================================================

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_public_platform_settings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_recommendation_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_customization() TO authenticated;

-- ============================================================
-- Commentaires et documentation
-- ============================================================

COMMENT ON FUNCTION get_public_platform_settings(TEXT) IS
'RPC function to get public platform settings without requiring admin privileges';

COMMENT ON FUNCTION get_ai_recommendation_settings() IS
'RPC function to get AI recommendation settings for authenticated users';

COMMENT ON FUNCTION get_platform_customization() IS
'RPC function to get platform customization settings for authenticated users';