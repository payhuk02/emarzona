-- Migration: Rate Limiting pour la création de liens courts d'affiliation
-- Date : Janvier 2026
-- Description : Implémentation d'un système de rate limiting pour éviter les abus

-- =========================================================
-- TABLE : SHORT LINKS CREATION LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.affiliate_short_links_creation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('create_short_link', 'update_short_link', 'delete_short_link')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_short_links_creation_logs_affiliate_id ON public.affiliate_short_links_creation_logs(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_short_links_creation_logs_created_at ON public.affiliate_short_links_creation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_short_links_creation_logs_action_type ON public.affiliate_short_links_creation_logs(action_type);

-- RLS Policies
ALTER TABLE public.affiliate_short_links_creation_logs ENABLE ROW LEVEL SECURITY;

-- Les affiliés peuvent voir leurs propres logs
DROP POLICY IF EXISTS "Affiliates can view their own creation logs" ON public.affiliate_short_links_creation_logs;
CREATE POLICY "Affiliates can view their own creation logs"
  ON public.affiliate_short_links_creation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_short_links_creation_logs.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

-- Les admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all creation logs" ON public.affiliate_short_links_creation_logs;
CREATE POLICY "Admins can view all creation logs"
  ON public.affiliate_short_links_creation_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- FONCTION : Vérification du rate limiting
-- =========================================================

CREATE OR REPLACE FUNCTION public.check_short_links_rate_limit(
  p_affiliate_id UUID,
  p_action_type TEXT DEFAULT 'create_short_link',
  p_ip_address INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits JSONB;
  v_recent_actions INTEGER;
  v_time_window_minutes INTEGER := 60; -- Fenêtre de 1 heure par défaut
  v_max_actions INTEGER;
  v_result JSONB;
BEGIN
  -- Récupérer les limites depuis platform_settings ou utiliser les valeurs par défaut
  SELECT settings->'rate_limiting'->'short_links'
  INTO v_limits
  FROM platform_settings
  WHERE key = 'admin'
  LIMIT 1;

  -- Valeurs par défaut si pas configuré
  IF v_limits IS NULL THEN
    v_limits := jsonb_build_object(
      'create_short_link', jsonb_build_object('max_per_hour', 50, 'max_per_day', 200),
      'update_short_link', jsonb_build_object('max_per_hour', 100, 'max_per_day', 500),
      'delete_short_link', jsonb_build_object('max_per_hour', 100, 'max_per_day', 500)
    );
  END IF;

  -- Récupérer les limites pour cette action
  v_max_actions := CASE
    WHEN p_action_type = 'create_short_link' THEN (v_limits->'create_short_link'->>'max_per_hour')::INTEGER
    WHEN p_action_type = 'update_short_link' THEN (v_limits->'update_short_link'->>'max_per_hour')::INTEGER
    WHEN p_action_type = 'delete_short_link' THEN (v_limits->'delete_short_link'->>'max_per_hour')::INTEGER
    ELSE 100 -- Valeur par défaut
  END;

  -- Compter les actions récentes (dernière heure)
  SELECT COUNT(*)
  INTO v_recent_actions
  FROM affiliate_short_links_creation_logs
  WHERE affiliate_id = p_affiliate_id
    AND action_type = p_action_type
    AND created_at >= NOW() - INTERVAL '1 hour'
    AND (p_ip_address IS NULL OR ip_address = p_ip_address);

  -- Vérifier si la limite est dépassée
  IF v_recent_actions >= v_max_actions THEN
    -- Calculer le temps restant avant la prochaine action autorisée
    SELECT EXTRACT(EPOCH FROM (
      NOW() - INTERVAL '1 hour' +
      (SELECT MIN(created_at) FROM (
        SELECT created_at
        FROM affiliate_short_links_creation_logs
        WHERE affiliate_id = p_affiliate_id
          AND action_type = p_action_type
          AND created_at >= NOW() - INTERVAL '1 hour'
        ORDER BY created_at DESC
        LIMIT v_max_actions
      ) oldest_actions)
    )) INTO v_time_window_minutes;

    v_result := jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'max_actions', v_max_actions,
      'current_actions', v_recent_actions,
      'time_window_minutes', GREATEST(0, v_time_window_minutes),
      'reset_time', (NOW() + INTERVAL '1 hour')::TEXT
    );
  ELSE
    v_result := jsonb_build_object(
      'allowed', true,
      'remaining_actions', v_max_actions - v_recent_actions,
      'time_window_minutes', 60
    );
  END IF;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.check_short_links_rate_limit IS 'Vérifie si l''affilié respecte les limites de taux pour les actions sur les liens courts';

-- =========================================================
-- FONCTION : Log d'action avec rate limiting
-- =========================================================

CREATE OR REPLACE FUNCTION public.log_short_link_action(
  p_affiliate_id UUID,
  p_action_type TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_check JSONB;
BEGIN
  -- Vérifier le rate limiting
  SELECT check_short_links_rate_limit(p_affiliate_id, p_action_type, p_ip_address)
  INTO v_rate_check;

  -- Si pas autorisé, retourner l'erreur
  IF NOT (v_rate_check->>'allowed')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'rate_limit_exceeded',
      'details', v_rate_check
    );
  END IF;

  -- Logger l'action
  INSERT INTO affiliate_short_links_creation_logs (
    affiliate_id,
    action_type,
    ip_address,
    user_agent
  ) VALUES (
    p_affiliate_id,
    p_action_type,
    p_ip_address,
    p_user_agent
  );

  RETURN jsonb_build_object(
    'success', true,
    'remaining_actions', (v_rate_check->>'remaining_actions')::INTEGER
  );
END;
$$;

COMMENT ON FUNCTION public.log_short_link_action IS 'Log une action sur les liens courts avec vérification du rate limiting';

-- =========================================================
-- FONCTION : Créer un lien court avec rate limiting intégré
-- =========================================================

CREATE OR REPLACE FUNCTION public.create_short_link_with_rate_limit(
  p_affiliate_link_id UUID,
  p_short_code TEXT,
  p_target_url TEXT,
  p_custom_alias TEXT DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id UUID;
  v_log_result JSONB;
  v_short_link_id UUID;
BEGIN
  -- Récupérer l'ID de l'affilié
  SELECT affiliate_id INTO v_affiliate_id
  FROM affiliate_links
  WHERE id = p_affiliate_link_id;

  IF v_affiliate_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'affiliate_link_not_found'
    );
  END IF;

  -- Vérifier et logger l'action
  SELECT log_short_link_action(v_affiliate_id, 'create_short_link', p_ip_address, p_user_agent)
  INTO v_log_result;

  IF NOT (v_log_result->>'success')::BOOLEAN THEN
    RETURN v_log_result;
  END IF;

  -- Créer le lien court
  INSERT INTO affiliate_short_links (
    affiliate_link_id,
    affiliate_id,
    short_code,
    target_url,
    custom_alias,
    expires_at,
    is_active
  ) VALUES (
    p_affiliate_link_id,
    v_affiliate_id,
    p_short_code,
    p_target_url,
    p_custom_alias,
    p_expires_at,
    true
  )
  RETURNING id INTO v_short_link_id;

  RETURN jsonb_build_object(
    'success', true,
    'short_link_id', v_short_link_id,
    'remaining_actions', (v_log_result->>'remaining_actions')::INTEGER
  );
END;
$$;

COMMENT ON FUNCTION public.create_short_link_with_rate_limit IS 'Crée un lien court avec vérification du rate limiting intégrée';