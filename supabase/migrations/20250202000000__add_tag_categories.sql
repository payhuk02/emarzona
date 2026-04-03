-- ============================================================
-- AJOUT SYSTÈME DE CATÉGORIES POUR TAGS
-- Date: 2 Février 2025
-- Description: Ajoute un système de catégories pour organiser les tags
-- ============================================================

-- ============================================================
-- 1. AJOUT COLONNE category À email_user_tags
-- ============================================================

ALTER TABLE public.email_user_tags
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('behavior', 'segment', 'custom', 'system')) DEFAULT 'custom';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_email_user_tags_category ON public.email_user_tags(category);
CREATE INDEX IF NOT EXISTS idx_email_user_tags_store_category ON public.email_user_tags(store_id, category);

-- Comment
COMMENT ON COLUMN public.email_user_tags.category IS 'Catégorie du tag: behavior (comportement), segment (segmentation), custom (personnalisé), system (système)';

-- ============================================================
-- 2. MISE À JOUR DES FONCTIONS EXISTANTES
-- ============================================================

-- Supprimer l'ancienne fonction si elle existe (sans le paramètre category)
DROP FUNCTION IF EXISTS public.add_user_tag(UUID, UUID, TEXT, JSONB);

-- Fonction add_user_tag avec support de category
CREATE OR REPLACE FUNCTION public.add_user_tag(
  p_user_id UUID,
  p_store_id UUID,
  p_tag TEXT,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_category TEXT DEFAULT 'custom'
)
RETURNS UUID AS $$
DECLARE
  v_tag_id UUID;
  v_normalized_tag TEXT;
BEGIN
  -- Normaliser le tag
  v_normalized_tag := LOWER(TRIM(p_tag));
  
  -- Validation
  IF v_normalized_tag = '' THEN
    RAISE EXCEPTION 'Tag cannot be empty';
  END IF;
  
  IF LENGTH(v_normalized_tag) > 50 THEN
    RAISE EXCEPTION 'Tag cannot exceed 50 characters';
  END IF;
  
  -- Vérifier que le tag ne contient que des caractères valides
  IF NOT (v_normalized_tag ~ '^[a-z0-9_-]+$') THEN
    RAISE EXCEPTION 'Tag can only contain lowercase letters, numbers, underscores, and hyphens';
  END IF;
  
  -- Valider la catégorie
  IF p_category NOT IN ('behavior', 'segment', 'custom', 'system') THEN
    RAISE EXCEPTION 'Invalid category. Must be one of: behavior, segment, custom, system';
  END IF;
  
  -- Insérer ou mettre à jour le tag
  INSERT INTO public.email_user_tags (
    user_id,
    store_id,
    tag,
    context,
    category
  )
  VALUES (
    p_user_id,
    p_store_id,
    v_normalized_tag,
    p_context,
    p_category
  )
  ON CONFLICT (user_id, store_id, tag) DO UPDATE
  SET 
    added_at = NOW(),
    context = p_context,
    category = p_category
  RETURNING id INTO v_tag_id;
  
  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.add_user_tag IS 'Ajoute un tag à un utilisateur avec validation, normalisation et catégorie';

-- ============================================================
-- 3. FONCTION: get_user_tags_by_category
-- Récupère les tags d'un utilisateur filtrés par catégorie
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_tags_by_category(
  p_user_id UUID,
  p_store_id UUID,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  tag TEXT,
  category TEXT,
  added_at TIMESTAMPTZ,
  added_by UUID,
  context JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tag,
    t.category,
    t.added_at,
    t.added_by,
    t.context
  FROM public.email_user_tags t
  WHERE t.user_id = p_user_id
    AND t.store_id = p_store_id
    AND (p_category IS NULL OR t.category = p_category)
  ORDER BY t.category, t.added_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_tags_by_category IS 'Récupère les tags d''un utilisateur filtrés par catégorie';

-- ============================================================
-- 4. FONCTION: get_store_tags_by_category
-- Récupère tous les tags uniques d'un store par catégorie
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_store_tags_by_category(
  p_store_id UUID,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  tag TEXT,
  category TEXT,
  user_count BIGINT,
  last_used_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tag,
    t.category,
    COUNT(DISTINCT t.user_id) AS user_count,
    MAX(t.added_at) AS last_used_at
  FROM public.email_user_tags t
  WHERE t.store_id = p_store_id
    AND (p_category IS NULL OR t.category = p_category)
  GROUP BY t.tag, t.category
  ORDER BY t.category, user_count DESC, last_used_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_store_tags_by_category IS 'Récupère tous les tags uniques d''un store groupés par catégorie';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================

