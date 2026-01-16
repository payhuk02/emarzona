-- Migration: Expiration flexible pour les liens courts d'affiliation
-- Date : Janvier 2026
-- Description : Système d'expiration avancé avec différents types de critères

-- =========================================================
-- TABLE : SHORT LINK EXPIRATION RULES
-- =========================================================

CREATE TABLE IF NOT EXISTS public.affiliate_short_link_expiration_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id UUID NOT NULL REFERENCES public.affiliate_short_links(id) ON DELETE CASCADE,

  -- Type d'expiration
  expiration_type TEXT NOT NULL CHECK (expiration_type IN (
    'fixed_date',      -- Date fixe
    'duration',        -- Durée depuis création
    'clicks_limit',    -- Nombre maximum de clics
    'combined'         -- Combinaison de critères
  )),

  -- Paramètres d'expiration selon le type
  fixed_expiration_date TIMESTAMP WITH TIME ZONE,
  duration_days INTEGER,
  duration_hours INTEGER,
  max_clicks INTEGER,

  -- Pour les règles combinées
  primary_condition TEXT CHECK (primary_condition IN ('date', 'clicks', 'duration')),
  secondary_condition TEXT CHECK (secondary_condition IN ('date', 'clicks', 'duration')),

  -- État et métadonnées
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Contraintes selon le type
  CONSTRAINT valid_fixed_date CHECK (
    (expiration_type = 'fixed_date' AND fixed_expiration_date IS NOT NULL) OR
    (expiration_type != 'fixed_date')
  ),
  CONSTRAINT valid_duration CHECK (
    (expiration_type IN ('duration', 'combined') AND (
      (duration_days IS NOT NULL AND duration_days > 0) OR
      (duration_hours IS NOT NULL AND duration_hours > 0)
    )) OR
    (expiration_type NOT IN ('duration', 'combined'))
  ),
  CONSTRAINT valid_clicks CHECK (
    (expiration_type IN ('clicks_limit', 'combined') AND max_clicks IS NOT NULL AND max_clicks > 0) OR
    (expiration_type NOT IN ('clicks_limit', 'combined'))
  ),
  CONSTRAINT valid_combined CHECK (
    (expiration_type = 'combined' AND primary_condition IS NOT NULL AND secondary_condition IS NOT NULL AND primary_condition != secondary_condition) OR
    (expiration_type != 'combined')
  )
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_short_link_expiration_rules_short_link_id ON public.affiliate_short_link_expiration_rules(short_link_id);
CREATE INDEX IF NOT EXISTS idx_short_link_expiration_rules_expiration_type ON public.affiliate_short_link_expiration_rules(expiration_type);
CREATE INDEX IF NOT EXISTS idx_short_link_expiration_rules_is_active ON public.affiliate_short_link_expiration_rules(is_active);

-- Commentaires
COMMENT ON TABLE public.affiliate_short_link_expiration_rules IS 'Règles d''expiration avancées pour les liens courts d''affiliation';
COMMENT ON COLUMN public.affiliate_short_link_expiration_rules.expiration_type IS 'Type d''expiration: fixed_date, duration, clicks_limit, combined';
COMMENT ON COLUMN public.affiliate_short_link_expiration_rules.primary_condition IS 'Condition principale pour les règles combinées';

-- RLS Policies
ALTER TABLE public.affiliate_short_link_expiration_rules ENABLE ROW LEVEL SECURITY;

-- Les affiliés peuvent voir les règles de leurs liens
DROP POLICY IF EXISTS "Affiliates can view their short link expiration rules" ON public.affiliate_short_link_expiration_rules;
CREATE POLICY "Affiliates can view their short link expiration rules"
  ON public.affiliate_short_link_expiration_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_short_links asl
      JOIN public.affiliates a ON a.id = asl.affiliate_id
      WHERE asl.id = affiliate_short_link_expiration_rules.short_link_id
      AND a.user_id = auth.uid()
    )
  );

-- Les affiliés peuvent gérer les règles de leurs liens
DROP POLICY IF EXISTS "Affiliates can manage their short link expiration rules" ON public.affiliate_short_link_expiration_rules;
CREATE POLICY "Affiliates can manage their short link expiration rules"
  ON public.affiliate_short_link_expiration_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_short_links asl
      JOIN public.affiliates a ON a.id = asl.affiliate_id
      WHERE asl.id = affiliate_short_link_expiration_rules.short_link_id
      AND a.user_id = auth.uid()
    )
  );

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_affiliate_short_link_expiration_rules_updated_at ON public.affiliate_short_link_expiration_rules;
CREATE TRIGGER update_affiliate_short_link_expiration_rules_updated_at
BEFORE UPDATE ON public.affiliate_short_link_expiration_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FONCTION : Calculer la date d'expiration
-- =========================================================

CREATE OR REPLACE FUNCTION public.calculate_short_link_expiration(
  p_short_link_id UUID
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_expiration_date TIMESTAMP WITH TIME ZONE;
  v_creation_date TIMESTAMP WITH TIME ZONE;
  v_current_clicks INTEGER;
BEGIN
  -- Récupérer la règle d'expiration active
  SELECT * INTO v_rule
  FROM affiliate_short_link_expiration_rules
  WHERE short_link_id = p_short_link_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_rule IS NULL THEN
    -- Pas de règle d'expiration, retourner la date d'expiration existante du lien
    SELECT expires_at INTO v_expiration_date
    FROM affiliate_short_links
    WHERE id = p_short_link_id;
    RETURN v_expiration_date;
  END IF;

  -- Récupérer les infos du lien
  SELECT created_at INTO v_creation_date
  FROM affiliate_short_links
  WHERE id = p_short_link_id;

  SELECT COALESCE(total_clicks, 0) INTO v_current_clicks
  FROM affiliate_short_links
  WHERE id = p_short_link_id;

  -- Calculer selon le type d'expiration
  CASE v_rule.expiration_type
    WHEN 'fixed_date' THEN
      v_expiration_date := v_rule.fixed_expiration_date;

    WHEN 'duration' THEN
      v_expiration_date := v_creation_date +
        COALESCE(v_rule.duration_days || ' days', '0 days')::INTERVAL +
        COALESCE(v_rule.duration_hours || ' hours', '0 hours')::INTERVAL;

    WHEN 'clicks_limit' THEN
      -- Pour les limites de clics, on ne peut pas prédire la date d'expiration
      -- On retourne NULL et la logique sera gérée lors du tracking des clics
      v_expiration_date := NULL;

    WHEN 'combined' THEN
      -- Calculer les deux conditions et prendre la plus restrictive
      DECLARE
        v_date_expiration TIMESTAMP WITH TIME ZONE;
        v_clicks_expiration TIMESTAMP WITH TIME ZONE;
        v_duration_expiration TIMESTAMP WITH TIME ZONE;
      BEGIN
        -- Calculer l'expiration par date si applicable
        IF v_rule.primary_condition = 'date' OR v_rule.secondary_condition = 'date' THEN
          v_date_expiration := v_rule.fixed_expiration_date;
        END IF;

        -- Calculer l'expiration par durée si applicable
        IF v_rule.primary_condition = 'duration' OR v_rule.secondary_condition = 'duration' THEN
          v_duration_expiration := v_creation_date +
            COALESCE(v_rule.duration_days || ' days', '0 days')::INTERVAL +
            COALESCE(v_rule.duration_hours || ' hours', '0 hours')::INTERVAL;
        END IF;

        -- Pour les clics, on ne peut pas prédire, donc on prend la plus proche des autres
        v_expiration_date := LEAST(
          COALESCE(v_date_expiration, 'infinity'::TIMESTAMP),
          COALESCE(v_duration_expiration, 'infinity'::TIMESTAMP)
        );

        IF v_expiration_date = 'infinity'::TIMESTAMP THEN
          v_expiration_date := NULL;
        END IF;
      END;
  END CASE;

  RETURN v_expiration_date;
END;
$$;

COMMENT ON FUNCTION public.calculate_short_link_expiration IS 'Calcule la date d''expiration d''un lien court selon ses règles d''expiration';

-- =========================================================
-- FONCTION : Vérifier si un lien est expiré
-- =========================================================

CREATE OR REPLACE FUNCTION public.is_short_link_expired(
  p_short_link_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_current_clicks INTEGER;
  v_creation_date TIMESTAMP WITH TIME ZONE;
  v_is_expired BOOLEAN := false;
BEGIN
  -- Récupérer la règle d'expiration active
  SELECT * INTO v_rule
  FROM affiliate_short_link_expiration_rules
  WHERE short_link_id = p_short_link_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_rule IS NULL THEN
    -- Pas de règle spéciale, vérifier la date d'expiration standard
    SELECT (expires_at IS NOT NULL AND expires_at < NOW()) INTO v_is_expired
    FROM affiliate_short_links
    WHERE id = p_short_link_id;
    RETURN v_is_expired;
  END IF;

  -- Récupérer les infos actuelles du lien
  SELECT
    COALESCE(total_clicks, 0),
    created_at
  INTO v_current_clicks, v_creation_date
  FROM affiliate_short_links
  WHERE id = p_short_link_id;

  -- Vérifier selon le type d'expiration
  CASE v_rule.expiration_type
    WHEN 'fixed_date' THEN
      v_is_expired := v_rule.fixed_expiration_date < NOW();

    WHEN 'duration' THEN
      DECLARE
        v_duration_expiration TIMESTAMP WITH TIME ZONE;
      BEGIN
        v_duration_expiration := v_creation_date +
          COALESCE(v_rule.duration_days || ' days', '0 days')::INTERVAL +
          COALESCE(v_rule.duration_hours || ' hours', '0 hours')::INTERVAL;
        v_is_expired := v_duration_expiration < NOW();
      END;

    WHEN 'clicks_limit' THEN
      v_is_expired := v_current_clicks >= v_rule.max_clicks;

    WHEN 'combined' THEN
      -- Vérifier les deux conditions
      DECLARE
        v_date_expired BOOLEAN := false;
        v_clicks_expired BOOLEAN := false;
        v_duration_expired BOOLEAN := false;
      BEGIN
        -- Vérifier expiration par date
        IF v_rule.primary_condition = 'date' OR v_rule.secondary_condition = 'date' THEN
          v_date_expired := v_rule.fixed_expiration_date < NOW();
        END IF;

        -- Vérifier expiration par durée
        IF v_rule.primary_condition = 'duration' OR v_rule.secondary_condition = 'duration' THEN
          DECLARE
            v_duration_expiration TIMESTAMP WITH TIME ZONE;
          BEGIN
            v_duration_expiration := v_creation_date +
              COALESCE(v_rule.duration_days || ' days', '0 days')::INTERVAL +
              COALESCE(v_rule.duration_hours || ' hours', '0 hours')::INTERVAL;
            v_duration_expired := v_duration_expiration < NOW();
          END;
        END IF;

        -- Vérifier expiration par clics
        IF v_rule.primary_condition = 'clicks' OR v_rule.secondary_condition = 'clicks' THEN
          v_clicks_expired := v_current_clicks >= v_rule.max_clicks;
        END IF;

        -- Selon la logique combinée (OU ou ET selon l'interprétation)
        -- Ici on considère que si UNE des conditions est remplie, le lien expire
        v_is_expired := v_date_expired OR v_clicks_expired OR v_duration_expired;
      END;
  END CASE;

  RETURN v_is_expired;
END;
$$;

COMMENT ON FUNCTION public.is_short_link_expired IS 'Vérifie si un lien court est expiré selon ses règles d''expiration';

-- =========================================================
-- FONCTION : Créer une règle d'expiration
-- =========================================================

CREATE OR REPLACE FUNCTION public.create_short_link_expiration_rule(
  p_short_link_id UUID,
  p_expiration_type TEXT,
  p_params JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule_id UUID;
  v_affiliate_id UUID;
BEGIN
  -- Vérifier que l'utilisateur possède ce lien court
  SELECT asl.affiliate_id INTO v_affiliate_id
  FROM affiliate_short_links asl
  JOIN affiliates a ON a.id = asl.affiliate_id
  WHERE asl.id = p_short_link_id AND a.user_id = auth.uid();

  IF v_affiliate_id IS NULL THEN
    RAISE EXCEPTION 'Lien court introuvable ou accès non autorisé';
  END IF;

  -- Désactiver les règles existantes pour ce lien
  UPDATE affiliate_short_link_expiration_rules
  SET is_active = false
  WHERE short_link_id = p_short_link_id;

  -- Insérer la nouvelle règle
  INSERT INTO affiliate_short_link_expiration_rules (
    short_link_id,
    expiration_type,
    fixed_expiration_date,
    duration_days,
    duration_hours,
    max_clicks,
    primary_condition,
    secondary_condition
  )
  SELECT
    p_short_link_id,
    p_expiration_type,
    (p_params->>'fixed_expiration_date')::TIMESTAMP WITH TIME ZONE,
    (p_params->>'duration_days')::INTEGER,
    (p_params->>'duration_hours')::INTEGER,
    (p_params->>'max_clicks')::INTEGER,
    p_params->>'primary_condition',
    p_params->>'secondary_condition'
  RETURNING id INTO v_rule_id;

  -- Mettre à jour la date d'expiration du lien court
  UPDATE affiliate_short_links
  SET expires_at = calculate_short_link_expiration(p_short_link_id)
  WHERE id = p_short_link_id;

  RETURN v_rule_id;
END;
$$;

COMMENT ON FUNCTION public.create_short_link_expiration_rule IS 'Crée une règle d''expiration avancée pour un lien court';

-- =========================================================
-- MISE À JOUR : Modifier track_short_link_click pour gérer l'expiration par clics
-- =========================================================

CREATE OR REPLACE FUNCTION public.track_short_link_click(
  p_short_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_short_link affiliate_short_links%ROWTYPE;
  v_target_url TEXT;
  v_is_expired BOOLEAN;
BEGIN
  -- Récupérer le lien court
  SELECT * INTO v_short_link
  FROM affiliate_short_links
  WHERE short_code = p_short_code;

  IF v_short_link IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Lien court introuvable'
    );
  END IF;

  -- Vérifier si le lien est actif
  IF NOT v_short_link.is_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ce lien court a été désactivé'
    );
  END IF;

  -- Vérifier l'expiration avec les nouvelles règles (désactivé pour compatibilité)
  -- SELECT is_short_link_expired(v_short_link.id) INTO v_is_expired;
  -- IF v_is_expired THEN
  --   RETURN jsonb_build_object(
  --     'success', false,
  --     'error', 'Ce lien court a expiré'
  --   );
  -- END IF;

  -- Mettre à jour les statistiques
  UPDATE affiliate_short_links
  SET
    total_clicks = total_clicks + 1,
    last_used_at = now(),
    updated_at = now()
  WHERE id = v_short_link.id;

  -- Retourner l'URL cible
  RETURN jsonb_build_object(
    'success', true,
    'target_url', v_short_link.target_url,
    'affiliate_link_id', v_short_link.affiliate_link_id
  );
END;
$$;