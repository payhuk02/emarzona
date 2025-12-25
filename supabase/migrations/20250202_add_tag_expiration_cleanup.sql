-- ============================================================
-- SYSTÈME D'EXPIRATION ET NETTOYAGE AUTOMATIQUE DES TAGS
-- Date: 2 Février 2025
-- Description: Ajoute expiration automatique et nettoyage des tags obsolètes
-- ============================================================

-- ============================================================
-- 1. AJOUT COLONNE expires_at À email_user_tags
-- ============================================================

ALTER TABLE public.email_user_tags
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Index pour améliorer les performances des requêtes d'expiration
CREATE INDEX IF NOT EXISTS idx_email_user_tags_expires_at ON public.email_user_tags(expires_at) WHERE expires_at IS NOT NULL;

-- Comment
COMMENT ON COLUMN public.email_user_tags.expires_at IS 'Date d''expiration du tag. NULL = pas d''expiration';

-- ============================================================
-- 2. FONCTION: add_user_tag avec support d'expiration
-- ============================================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.add_user_tag(UUID, UUID, TEXT, JSONB, TEXT);

-- Fonction add_user_tag avec support de category et expiration
CREATE OR REPLACE FUNCTION public.add_user_tag(
  p_user_id UUID,
  p_store_id UUID,
  p_tag TEXT,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_category TEXT DEFAULT 'custom',
  p_expires_in_days INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_tag_id UUID;
  v_normalized_tag TEXT;
  v_expires_at TIMESTAMPTZ;
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
  
  -- Calculer la date d'expiration si spécifiée
  IF p_expires_in_days IS NOT NULL AND p_expires_in_days > 0 THEN
    v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
  ELSE
    v_expires_at := NULL;
  END IF;
  
  -- Insérer ou mettre à jour le tag
  INSERT INTO public.email_user_tags (
    user_id,
    store_id,
    tag,
    context,
    category,
    expires_at
  )
  VALUES (
    p_user_id,
    p_store_id,
    v_normalized_tag,
    p_context,
    p_category,
    v_expires_at
  )
  ON CONFLICT (user_id, store_id, tag) DO UPDATE
  SET 
    added_at = NOW(),
    context = p_context,
    category = p_category,
    expires_at = v_expires_at
  RETURNING id INTO v_tag_id;
  
  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.add_user_tag IS 'Ajoute un tag à un utilisateur avec validation, normalisation, catégorie et expiration optionnelle';

-- ============================================================
-- 3. FONCTION: cleanup_expired_tags
-- Supprime les tags expirés
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_tags()
RETURNS TABLE (
  deleted_count BIGINT,
  deleted_tags JSONB
) AS $$
DECLARE
  v_deleted_count BIGINT;
  v_deleted_tags JSONB;
BEGIN
  -- Supprimer les tags expirés et collecter les informations
  WITH deleted AS (
    DELETE FROM public.email_user_tags
    WHERE expires_at IS NOT NULL
      AND expires_at <= NOW()
    RETURNING id, user_id, store_id, tag, category
  )
  SELECT 
    COUNT(*)::BIGINT,
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'store_id', store_id,
        'tag', tag,
        'category', category
      )
    )
  INTO v_deleted_count, v_deleted_tags
  FROM deleted;
  
  RETURN QUERY
  SELECT 
    COALESCE(v_deleted_count, 0) AS deleted_count,
    COALESCE(v_deleted_tags, '[]'::jsonb) AS deleted_tags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_tags IS 'Supprime les tags expirés et retourne le nombre et les détails des tags supprimés';

-- ============================================================
-- 4. FONCTION: cleanup_unused_tags
-- Supprime les tags non utilisés depuis X jours
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_unused_tags(
  p_store_id UUID DEFAULT NULL,
  p_unused_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  deleted_count BIGINT,
  deleted_tags JSONB
) AS $$
DECLARE
  v_deleted_count BIGINT;
  v_deleted_tags JSONB;
BEGIN
  -- Supprimer les tags non utilisés depuis X jours
  -- Un tag est considéré comme "non utilisé" s'il n'a pas été ajouté récemment
  -- et qu'il n'est pas dans une catégorie système
  WITH deleted AS (
    DELETE FROM public.email_user_tags
    WHERE (p_store_id IS NULL OR store_id = p_store_id)
      AND category != 'system'  -- Ne pas supprimer les tags système
      AND added_at < NOW() - (p_unused_days || ' days')::INTERVAL
      -- Ne pas supprimer les tags qui ont une expiration future
      AND (expires_at IS NULL OR expires_at <= NOW())
    RETURNING id, user_id, store_id, tag, category, added_at
  )
  SELECT 
    COUNT(*)::BIGINT,
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'store_id', store_id,
        'tag', tag,
        'category', category,
        'added_at', added_at
      )
    )
  INTO v_deleted_count, v_deleted_tags
  FROM deleted;
  
  RETURN QUERY
  SELECT 
    COALESCE(v_deleted_count, 0) AS deleted_count,
    COALESCE(v_deleted_tags, '[]'::jsonb) AS deleted_tags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_unused_tags IS 'Supprime les tags non utilisés depuis X jours pour un store (ou tous les stores)';

-- ============================================================
-- 5. FONCTION: get_expiring_tags
-- Récupère les tags qui vont expirer bientôt
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_expiring_tags(
  p_store_id UUID DEFAULT NULL,
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
  user_id UUID,
  store_id UUID,
  tag TEXT,
  category TEXT,
  expires_at TIMESTAMPTZ,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.user_id,
    t.store_id,
    t.tag,
    t.category,
    t.expires_at,
    EXTRACT(DAY FROM (t.expires_at - NOW()))::INTEGER AS days_until_expiry
  FROM public.email_user_tags t
  WHERE (p_store_id IS NULL OR t.store_id = p_store_id)
    AND t.expires_at IS NOT NULL
    AND t.expires_at > NOW()
    AND t.expires_at <= NOW() + (p_days_ahead || ' days')::INTERVAL
  ORDER BY t.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_expiring_tags IS 'Récupère les tags qui vont expirer dans les X prochains jours';

-- ============================================================
-- 6. VUE: active_tags (exclut les tags expirés)
-- ============================================================

CREATE OR REPLACE VIEW public.active_email_user_tags AS
SELECT *
FROM public.email_user_tags
WHERE expires_at IS NULL OR expires_at > NOW();

COMMENT ON VIEW public.active_email_user_tags IS 'Vue des tags actifs (non expirés)';

-- ============================================================
-- 7. TRIGGER: Auto-nettoyage des tags expirés lors de la lecture
-- (Optionnel - peut être désactivé si trop lourd)
-- ============================================================

-- Fonction trigger pour nettoyer automatiquement (optionnel)
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_tags_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Nettoyer les tags expirés toutes les heures (via un mécanisme externe)
  -- Cette fonction peut être appelée par un cron job
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================

