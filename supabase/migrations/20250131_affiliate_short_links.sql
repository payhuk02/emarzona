-- =========================================================
-- Migration : Système de liens courts d'affiliation
-- Date : 31/01/2025
-- Description : Permet de créer des liens courts pour les liens d'affiliation
--               Format: emarzona.com/aff/ABC123
-- =========================================================

-- Activer l'extension pgcrypto si nécessaire
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- TABLE : AFFILIATE_SHORT_LINKS (Liens courts)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.affiliate_short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  
  -- Code court unique (6-8 caractères)
  short_code TEXT NOT NULL UNIQUE,  -- Ex: "ABC123", "XYZ789"
  
  -- URL complète vers laquelle rediriger
  target_url TEXT NOT NULL,  -- URL complète du lien d'affiliation
  
  -- Statistiques
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  
  -- Métadonnées
  custom_alias TEXT,  -- Alias personnalisé optionnel (ex: "youtube", "facebook")
  expires_at TIMESTAMP WITH TIME ZONE,  -- Date d'expiration optionnelle
  is_active BOOLEAN DEFAULT true,
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_affiliate_short_links_short_code ON public.affiliate_short_links(short_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_short_links_affiliate_link_id ON public.affiliate_short_links(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_short_links_affiliate_id ON public.affiliate_short_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_short_links_is_active ON public.affiliate_short_links(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliate_short_links_custom_alias ON public.affiliate_short_links(custom_alias) WHERE custom_alias IS NOT NULL;

-- Comments
COMMENT ON TABLE public.affiliate_short_links IS 'Liens courts pour les liens d''affiliation (ex: emarzona.com/aff/ABC123)';
COMMENT ON COLUMN public.affiliate_short_links.short_code IS 'Code court unique (6-8 caractères alphanumériques)';
COMMENT ON COLUMN public.affiliate_short_links.custom_alias IS 'Alias personnalisé optionnel pour un code plus mémorable';

-- RLS Policies
ALTER TABLE public.affiliate_short_links ENABLE ROW LEVEL SECURITY;

-- Les affiliés peuvent voir leurs propres liens courts
DROP POLICY IF EXISTS "Affiliates can view their own short links" ON public.affiliate_short_links;
CREATE POLICY "Affiliates can view their own short links"
  ON public.affiliate_short_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_short_links.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

-- Les affiliés peuvent créer des liens courts pour leurs liens
DROP POLICY IF EXISTS "Affiliates can create short links for their affiliate links" ON public.affiliate_short_links;
CREATE POLICY "Affiliates can create short links for their affiliate links"
  ON public.affiliate_short_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_short_links.affiliate_id
      AND affiliates.user_id = auth.uid()
      AND affiliates.status = 'active'
    )
    AND EXISTS (
      SELECT 1 FROM public.affiliate_links
      WHERE affiliate_links.id = affiliate_short_links.affiliate_link_id
      AND affiliate_links.affiliate_id = affiliate_short_links.affiliate_id
      AND affiliate_links.status = 'active'
    )
  );

-- Les affiliés peuvent mettre à jour leurs liens courts
DROP POLICY IF EXISTS "Affiliates can update their own short links" ON public.affiliate_short_links;
CREATE POLICY "Affiliates can update their own short links"
  ON public.affiliate_short_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_short_links.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

-- Les affiliés peuvent supprimer leurs liens courts
DROP POLICY IF EXISTS "Affiliates can delete their own short links" ON public.affiliate_short_links;
CREATE POLICY "Affiliates can delete their own short links"
  ON public.affiliate_short_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_short_links.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

-- Les admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all short links" ON public.affiliate_short_links;
CREATE POLICY "Admins can view all short links"
  ON public.affiliate_short_links FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Public peut accéder aux liens courts actifs (pour la redirection)
DROP POLICY IF EXISTS "Public can view active short links for redirection" ON public.affiliate_short_links;
CREATE POLICY "Public can view active short links for redirection"
  ON public.affiliate_short_links FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_affiliate_short_links_updated_at ON public.affiliate_short_links;
CREATE TRIGGER update_affiliate_short_links_updated_at
BEFORE UPDATE ON public.affiliate_short_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FONCTION : Générer un code court unique
-- =========================================================

CREATE OR REPLACE FUNCTION public.generate_short_link_code(
  p_length INTEGER DEFAULT 6
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_counter INTEGER := 0;
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- Exclut les caractères ambigus (0, O, I, 1)
  v_char_count INTEGER := length(v_chars);
BEGIN
  -- Valider la longueur (entre 4 et 10 caractères)
  IF p_length < 4 OR p_length > 10 THEN
    RAISE EXCEPTION 'La longueur du code doit être entre 4 et 10 caractères';
  END IF;
  
  -- Boucle jusqu'à trouver un code unique
  LOOP
    v_code := '';
    
    -- Générer un code aléatoire
    FOR i IN 1..p_length LOOP
      v_code := v_code || substr(v_chars, floor(random() * v_char_count + 1)::INTEGER, 1);
    END LOOP;
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(
      SELECT 1 FROM affiliate_short_links WHERE short_code = v_code
    ) INTO v_exists;
    
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
    
    v_counter := v_counter + 1;
    
    -- Sécurité : éviter boucle infinie
    IF v_counter > 100 THEN
      -- Ajouter un timestamp pour garantir unicité
      v_code := v_code || substr(md5(random()::text), 1, 2);
      RETURN upper(v_code);
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.generate_short_link_code IS 'Génère un code court unique pour les liens d''affiliation (4-10 caractères)';

-- =========================================================
-- FONCTION : Tracker un clic sur un lien court
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
BEGIN
  -- Récupérer le lien court
  SELECT * INTO v_short_link
  FROM affiliate_short_links
  WHERE short_code = p_short_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  IF v_short_link IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Lien court introuvable ou expiré'
    );
  END IF;
  
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

COMMENT ON FUNCTION public.track_short_link_click IS 'Traque un clic sur un lien court et retourne l''URL de redirection';

-- =========================================================
-- VUE : Statistiques des liens courts
-- =========================================================

DROP VIEW IF EXISTS public.affiliate_short_links_stats;
CREATE OR REPLACE VIEW public.affiliate_short_links_stats AS
SELECT 
  asl.id,
  asl.short_code,
  asl.custom_alias,
  asl.total_clicks,
  asl.unique_clicks,
  asl.is_active,
  asl.created_at,
  asl.last_used_at,
  al.product_id,
  al.store_id,
  p.name AS product_name,
  s.name AS store_name,
  asl.affiliate_id
FROM affiliate_short_links asl
LEFT JOIN affiliate_links al ON al.id = asl.affiliate_link_id
LEFT JOIN products p ON p.id = al.product_id
LEFT JOIN stores s ON s.id = al.store_id;

COMMENT ON VIEW public.affiliate_short_links_stats IS 'Vue agrégée des statistiques des liens courts d''affiliation';

-- =========================================================
-- FONCTION : Analytics avancés pour les liens courts
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_affiliate_short_links_analytics(
  p_affiliate_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_links INTEGER;
  v_active_links INTEGER;
  v_total_clicks INTEGER;
  v_avg_clicks_per_link NUMERIC;
  v_conversion_rate NUMERIC;
  v_top_performing_links JSONB;
  v_clicks_by_day JSONB;
  v_geographic_data JSONB;
BEGIN
  -- Statistiques générales
  SELECT
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN is_active THEN 1 END)::INTEGER,
    COALESCE(SUM(total_clicks), 0)::INTEGER
  INTO v_total_links, v_active_links, v_total_clicks
  FROM affiliate_short_links
  WHERE (p_affiliate_id IS NULL OR affiliate_id = p_affiliate_id);

  -- Moyenne de clics par lien
  v_avg_clicks_per_link := CASE
    WHEN v_total_links > 0 THEN ROUND(v_total_clicks::NUMERIC / v_total_links, 2)
    ELSE 0
  END;

  -- Top 5 liens les plus performants
  SELECT jsonb_agg(
    jsonb_build_object(
      'short_code', short_code,
      'custom_alias', custom_alias,
      'clicks', total_clicks,
      'is_active', is_active,
      'created_at', created_at,
      'last_used_at', last_used_at
    )
  ) INTO v_top_performing_links
  FROM (
    SELECT * FROM affiliate_short_links
    WHERE (p_affiliate_id IS NULL OR affiliate_id = p_affiliate_id)
    ORDER BY total_clicks DESC, created_at DESC
    LIMIT 5
  ) top_links;

  -- Clics par jour (derniers N jours)
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', date,
      'clicks', COALESCE(clicks, 0)
    )
  ) INTO v_clicks_by_day
  FROM (
    SELECT
      DATE(last_used_at) as date,
      COUNT(*) as clicks
    FROM affiliate_short_links
    WHERE (p_affiliate_id IS NULL OR affiliate_id = p_affiliate_id)
      AND last_used_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY DATE(last_used_at)
    ORDER BY date
  ) daily_clicks;

  -- Données géographiques (si tracking activé)
  SELECT jsonb_agg(
    jsonb_build_object(
      'country', country,
      'clicks', clicks)
  ) INTO v_geographic_data
  FROM (
    SELECT
      COALESCE(country, 'Unknown') as country,
      COUNT(*) as clicks
    FROM affiliate_clicks ac
    JOIN affiliate_links al ON al.id = ac.affiliate_link_id
    WHERE al.affiliate_id = COALESCE(p_affiliate_id, al.affiliate_id)
    GROUP BY country
    ORDER BY clicks DESC
    LIMIT 10
  ) geo_data;

  -- Taux de conversion (clics convertis / total clics)
  SELECT ROUND(
    CASE
      WHEN SUM(total_clicks) > 0
      THEN (COUNT(CASE WHEN converted THEN 1 END)::NUMERIC / SUM(total_clicks)) * 100
      ELSE 0
    END, 2
  ) INTO v_conversion_rate
  FROM affiliate_short_links asl
  LEFT JOIN affiliate_links al ON al.id = asl.affiliate_link_id
  LEFT JOIN affiliate_clicks ac ON ac.affiliate_link_id = al.id AND ac.product_id = al.product_id
  WHERE (p_affiliate_id IS NULL OR asl.affiliate_id = p_affiliate_id);

  -- Construction du résultat
  v_result := jsonb_build_object(
    'summary', jsonb_build_object(
      'total_links', v_total_links,
      'active_links', v_active_links,
      'inactive_links', v_total_links - v_active_links,
      'total_clicks', v_total_clicks,
      'avg_clicks_per_link', v_avg_clicks_per_link,
      'conversion_rate', v_conversion_rate
    ),
    'top_performing_links', COALESCE(v_top_performing_links, '[]'::jsonb),
    'clicks_by_day', COALESCE(v_clicks_by_day, '[]'::jsonb),
    'geographic_distribution', COALESCE(v_geographic_data, '[]'::jsonb),
    'period_days', p_days,
    'generated_at', NOW()
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_affiliate_short_links_analytics IS 'Analytics avancés pour les liens courts d''affiliation avec métriques détaillées';

-- =========================================================
-- FONCTION : Recommandations d'optimisation pour les liens courts
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_short_link_optimization_suggestions(
  p_affiliate_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_underperforming_links JSONB;
  v_suggestions JSONB[];
BEGIN
  -- Liens sous-performants (peu de clics)
  SELECT jsonb_agg(
    jsonb_build_object(
      'short_code', short_code,
      'custom_alias', custom_alias,
      'clicks', total_clicks,
      'days_since_creation', EXTRACT(DAY FROM NOW() - created_at),
      'avg_daily_clicks', ROUND(total_clicks::NUMERIC / GREATEST(EXTRACT(DAY FROM NOW() - created_at), 1), 2)
    )
  ) INTO v_underperforming_links
  FROM affiliate_short_links
  WHERE affiliate_id = p_affiliate_id
    AND total_clicks < 10
    AND created_at < NOW() - INTERVAL '7 days'
  ORDER BY total_clicks ASC
  LIMIT 5;

  -- Suggestions basées sur les performances
  v_suggestions := ARRAY[];

  -- Suggestion 1: Liens sous-performants
  IF v_underperforming_links IS NOT NULL AND jsonb_array_length(v_underperforming_links) > 0 THEN
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'underperforming_links',
      'priority', 'high',
      'title', 'Liens sous-performants détectés',
      'description', 'Certains liens reçoivent peu de trafic. Considérez les promouvoir davantage.',
      'affected_links', v_underperforming_links,
      'action_suggestion', 'Augmentez la visibilité de ces liens sur vos canaux de communication'
    );
  END IF;

  -- Suggestion 2: Pas d'alias personnalisé
  IF EXISTS (
    SELECT 1 FROM affiliate_short_links
    WHERE affiliate_id = p_affiliate_id
      AND custom_alias IS NULL
      AND total_clicks > 50
  ) THEN
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'missing_custom_alias',
      'priority', 'medium',
      'title', 'Liens populaires sans alias personnalisé',
      'description', 'Vos liens les plus populaires n''ont pas d''alias mémorable.',
      'action_suggestion', 'Ajoutez des alias personnalisés pour améliorer la mémorisation'
    );
  END IF;

  -- Suggestion 3: Liens expirés proches
  IF EXISTS (
    SELECT 1 FROM affiliate_short_links
    WHERE affiliate_id = p_affiliate_id
      AND expires_at IS NOT NULL
      AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  ) THEN
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'expiring_links',
      'priority', 'medium',
      'title', 'Liens arrivant à expiration',
      'description', 'Certains liens courts arrivent bientôt à expiration.',
      'action_suggestion', 'Renouvelez ou supprimez les liens expirés'
    );
  END IF;

  -- Construction du résultat
  v_result := jsonb_build_object(
    'affiliate_id', p_affiliate_id,
    'suggestions', v_suggestions,
    'total_suggestions', array_length(v_suggestions, 1),
    'generated_at', NOW()
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_short_link_optimization_suggestions IS 'Génère des suggestions d''optimisation pour améliorer les performances des liens courts';